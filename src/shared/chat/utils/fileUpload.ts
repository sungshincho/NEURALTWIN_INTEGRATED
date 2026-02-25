/**
 * NEURALTWIN Chat File Upload Utility
 * 파일을 Supabase Storage에 업로드하고 텍스트 콘텐츠를 추출
 *
 * 지원 포맷:
 * - 텍스트: txt, csv, md → FileReader.readAsText
 * - PDF: pdf → pdfjs-dist 텍스트 추출
 * - Word: docx → mammoth 텍스트 추출
 * - Excel: xlsx → SheetJS 셀 데이터 추출
 * - 이미지: jpg, png, gif, webp → 텍스트 추출 없음 (메타데이터만)
 */

import { supabase } from '@/integrations/supabase/client';

const STORAGE_BUCKET = 'chat-attachments';
const MAX_TEXT_LENGTH = 8000;

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  textContent?: string;
}

// ═══════════════════════════════════════════
//  텍스트 추출: 텍스트 파일 (txt, csv, md)
// ═══════════════════════════════════════════

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ═══════════════════════════════════════════
//  텍스트 추출: PDF (pdfjs-dist)
// ═══════════════════════════════════════════

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Worker 설정 (빌드 환경에서 안정적으로 동작)
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 30); // 최대 30페이지

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str || '')
      .join(' ');
    if (pageText.trim()) {
      textParts.push(`[Page ${i}]\n${pageText.trim()}`);
    }
  }

  if (pdf.numPages > maxPages) {
    textParts.push(`\n...(${pdf.numPages - maxPages}페이지 추가 있음, 생략)`);
  }

  return textParts.join('\n\n');
}

// ═══════════════════════════════════════════
//  텍스트 추출: DOCX (mammoth)
// ═══════════════════════════════════════════

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// ═══════════════════════════════════════════
//  텍스트 추출: XLSX (SheetJS)
// ═══════════════════════════════════════════

async function extractXlsxText(file: File): Promise<string> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const parts: string[] = [];
  const maxSheets = Math.min(workbook.SheetNames.length, 5); // 최대 5시트

  for (let i = 0; i < maxSheets; i++) {
    const sheetName = workbook.SheetNames[i];
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim()) {
      parts.push(`[Sheet: ${sheetName}]\n${csv.trim()}`);
    }
  }

  if (workbook.SheetNames.length > maxSheets) {
    parts.push(`\n...(${workbook.SheetNames.length - maxSheets}개 시트 추가 있음, 생략)`);
  }

  return parts.join('\n\n');
}

// ═══════════════════════════════════════════
//  통합 텍스트 추출
// ═══════════════════════════════════════════

const TEXT_TYPES = ['text/plain', 'text/csv', 'text/markdown'];

async function extractTextContent(file: File): Promise<string | undefined> {
  try {
    let text: string | undefined;

    if (TEXT_TYPES.includes(file.type)) {
      text = await readFileAsText(file);
    } else if (file.type === 'application/pdf') {
      text = await extractPdfText(file);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await extractDocxText(file);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      text = await extractXlsxText(file);
    }

    if (!text || !text.trim()) return undefined;

    // 최대 길이 제한
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH) + '\n...(truncated)';
    }

    return text;
  } catch (err) {
    console.warn('[FileUpload] Text extraction failed:', file.name, err);
    return undefined;
  }
}

// ═══════════════════════════════════════════
//  업로드 + 추출 통합
// ═══════════════════════════════════════════

export async function uploadChatFile(
  file: File,
  sessionId: string
): Promise<UploadedFile> {
  const fileId = crypto.randomUUID();
  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `${sessionId}/${fileId}.${ext}`;

  // Supabase Storage 업로드
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`파일 업로드 실패: ${error.message}`);
  }

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  // 텍스트 추출
  const textContent = await extractTextContent(file);

  return {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type,
    url: urlData.publicUrl,
    textContent,
  };
}

export async function uploadChatFiles(
  files: File[],
  sessionId: string
): Promise<UploadedFile[]> {
  const results = await Promise.allSettled(
    files.map(file => uploadChatFile(file, sessionId))
  );

  const uploaded: UploadedFile[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      uploaded.push(result.value);
    } else {
      console.error('[FileUpload] Upload failed:', result.reason);
    }
  }
  return uploaded;
}

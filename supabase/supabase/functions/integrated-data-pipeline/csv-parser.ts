/**
 * Storage에서 CSV 파일을 streaming 방식으로 파싱
 */

interface ParsedRow {
  [key: string]: string;
}

export async function parseCSVFromStorage(
  supabase: any,
  filePath: string,
  bucket: string = 'store-data'
): Promise<ParsedRow[]> {
  console.log(`📖 Reading CSV from storage: ${bucket}/${filePath}`);
  
  // Storage에서 파일 다운로드
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(filePath);
  
  if (downloadError) {
    throw new Error(`Failed to download file from storage: ${downloadError.message}`);
  }
  
  // Blob to text
  const text = await fileData.text();
  const lines = text.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least header and one data row');
  }
  
  // Parse header
  const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
  console.log(`📋 CSV Headers: ${headers.join(', ')}`);
  
  // Parse rows
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length !== headers.length) {
      console.warn(`⚠️  Row ${i} has ${values.length} values but expected ${headers.length}`);
      continue;
    }
    
    const row: ParsedRow = {};
    headers.forEach((header: string, idx: number) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  console.log(`✅ Parsed ${rows.length} rows from CSV`);
  return rows;
}

export async function parseExcelFromStorage(
  supabase: any,
  filePath: string,
  bucket: string = 'store-data'
): Promise<ParsedRow[]> {
  console.log(`📖 Reading Excel from storage: ${bucket}/${filePath}`);
  
  // Storage에서 파일 다운로드
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(filePath);
  
  if (downloadError) {
    throw new Error(`Failed to download file from storage: ${downloadError.message}`);
  }
  
  // Excel 파싱은 복잡하므로 CSV로 변환 권장
  throw new Error('Excel parsing from storage not yet implemented. Please convert to CSV first.');
}

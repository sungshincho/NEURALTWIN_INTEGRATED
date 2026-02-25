/**
 * NEURALTWIN Chat Export Utility
 * 대화 내용을 .md / .pdf / .docx 포맷으로 내보내기
 */

import { saveAs } from 'file-saver';

interface ExportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExportOptions {
  kpis?: Array<{ label: string; value: string; sub: string }>;
  zones?: Array<{ id: string; label: string; color: string }>;
  stage?: string;
}

// 타임스탬프 생성
function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function getFileTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}`;
}

// =============================================
// Markdown Export
// =============================================

export function exportAsMarkdown(messages: ExportMessage[], options?: ExportOptions): void {
  const lines: string[] = [
    `# NEURALTWIN 대화 기록`,
    ``,
    `> 내보내기 시각: ${getTimestamp()}`,
    `> 메시지 수: ${messages.length}개`,
    ``,
    `---`,
    ``,
  ];

  for (const msg of messages) {
    const label = msg.role === 'user' ? '**사용자**' : '**NEURAL**';
    lines.push(`### ${label}`);
    lines.push(``);
    lines.push(msg.content);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  // ── 추가 데이터 섹션 (ExportOptions) ──
  if (options?.stage) {
    lines.push(`## 고객 여정 단계`);
    lines.push(``);
    lines.push(`현재 단계: **${options.stage}**`);
    lines.push(``);
  }

  if (options?.kpis && options.kpis.length > 0) {
    lines.push(`## KPI 데이터`);
    lines.push(``);
    lines.push(`| 지표 | 값 | 상세 |`);
    lines.push(`| --- | --- | --- |`);
    for (const kpi of options.kpis) {
      lines.push(`| ${kpi.label} | ${kpi.value} | ${kpi.sub} |`);
    }
    lines.push(``);
  }

  if (options?.zones && options.zones.length > 0) {
    lines.push(`## 매장 구성`);
    lines.push(``);
    for (const zone of options.zones) {
      lines.push(`- **${zone.label}** (${zone.id}) — 색상: \`${zone.color}\``);
    }
    lines.push(``);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `neuraltwin_chat_${getFileTimestamp()}.md`);
}

// =============================================
// PDF Export (jsPDF)
// =============================================

export async function exportAsPDF(messages: ExportMessage[], options?: ExportOptions): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NEURALTWIN Chat Export', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Exported: ${getTimestamp()} | Messages: ${messages.length}`, margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Messages
  for (const msg of messages) {
    const label = msg.role === 'user' ? '[User]' : '[NEURAL]';

    // Check page overflow
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    // Label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(msg.role === 'user' ? 60 : 0, msg.role === 'user' ? 60 : 120, msg.role === 'user' ? 60 : 100);
    doc.text(label, margin, y);
    y += 5;

    // Content - split into lines
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(msg.content, contentWidth);
    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    y += 5;

    // Divider between messages
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  // ── 추가 데이터 섹션 (ExportOptions) ──
  const hasExtraData = options?.stage || (options?.kpis && options.kpis.length > 0) || (options?.zones && options.zones.length > 0);

  if (hasExtraData) {
    // 페이지 여유 확인
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    // 구분선
    doc.setDrawColor(100, 100, 100);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // 고객 여정 단계
    if (options?.stage) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Customer Journey Stage', margin, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(`Current Stage: ${options.stage}`, margin, y);
      y += 10;
    }

    // KPI 데이터
    if (options?.kpis && options.kpis.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('KPI Data', margin, y);
      y += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);

      for (const kpi of options.kpis) {
        if (y > 275) {
          doc.addPage();
          y = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${kpi.label}: `, margin, y);
        const labelWidth = doc.getTextWidth(`${kpi.label}: `);
        doc.setFont('helvetica', 'normal');
        doc.text(`${kpi.value}  (${kpi.sub})`, margin + labelWidth, y);
        y += 5;
      }
      y += 5;
    }

    // 매장 구성
    if (options?.zones && options.zones.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Store Zone Configuration', margin, y);
      y += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);

      for (const zone of options.zones) {
        if (y > 275) {
          doc.addPage();
          y = margin;
        }
        doc.text(`- ${zone.label} (${zone.id}) — Color: ${zone.color}`, margin, y);
        y += 5;
      }
    }
  }

  doc.save(`neuraltwin_chat_${getFileTimestamp()}.pdf`);
}

// =============================================
// DOCX Export
// =============================================

export async function exportAsDocx(messages: ExportMessage[], options?: ExportOptions): Promise<void> {
  const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, BorderStyle } = await import('docx');

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title
  children.push(
    new Paragraph({
      text: 'NEURALTWIN 대화 기록',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `내보내기 시각: ${getTimestamp()} | 메시지 수: ${messages.length}개`,
          size: 18,
          color: '888888',
          italics: true,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Divider
  children.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
      spacing: { after: 200 },
    })
  );

  // Messages
  for (const msg of messages) {
    const isUser = msg.role === 'user';

    // Label
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isUser ? '사용자' : 'NEURAL',
            bold: true,
            size: 22,
            color: isUser ? '555555' : '007A66',
          }),
        ],
        spacing: { before: 200 },
      })
    );

    // Content - split by newlines
    const contentLines = msg.content.split('\n');
    for (const line of contentLines) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 20,
            }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    // Separator
    children.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
        },
        spacing: { after: 150 },
      })
    );
  }

  // ── 추가 데이터 섹션 (ExportOptions) ──
  const hasExtraData = options?.stage || (options?.kpis && options.kpis.length > 0) || (options?.zones && options.zones.length > 0);

  if (hasExtraData) {
    // 구분선
    children.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
        },
        spacing: { before: 400, after: 300 },
      })
    );

    // 고객 여정 단계
    if (options?.stage) {
      children.push(
        new Paragraph({
          text: '고객 여정 단계',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '현재 단계: ', size: 20 }),
            new TextRun({ text: options.stage, bold: true, size: 20, color: '007A66' }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // KPI 데이터
    if (options?.kpis && options.kpis.length > 0) {
      children.push(
        new Paragraph({
          text: 'KPI 데이터',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 },
        })
      );
      for (const kpi of options.kpis) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${kpi.label}: `, bold: true, size: 20 }),
              new TextRun({ text: `${kpi.value}`, size: 20, color: '007A66' }),
              new TextRun({ text: `  (${kpi.sub})`, size: 18, color: '888888', italics: true }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }

    // 매장 구성
    if (options?.zones && options.zones.length > 0) {
      children.push(
        new Paragraph({
          text: '매장 구성',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      for (const zone of options.zones) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${zone.label}`, bold: true, size: 20 }),
              new TextRun({ text: ` (${zone.id})`, size: 18, color: '888888' }),
              new TextRun({ text: ` — 색상: ${zone.color}`, size: 18, color: '666666' }),
            ],
            spacing: { after: 60 },
            bullet: { level: 0 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `neuraltwin_chat_${getFileTimestamp()}.docx`);
}

import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer, UnderlineType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import type { SmartCard } from './card-engine/types';
import type { EmploymentAgreement, ContentBlock, ListItem, DefinitionItem } from '@/app/api/templates/employment-agreement/schema';

export interface DocumentGeneratorOptions {
  document: EmploymentAgreement;
  formData: any;
}

export async function generateEmploymentAgreementDocx(
  options: DocumentGeneratorOptions
): Promise<Buffer> {
  const { document } = options;

  // Convert JSON structure to DOCX paragraphs
  const paragraphs = convertJsonToDocx(document);

  // Create DOCX document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  // Generate buffer
  return await Packer.toBuffer(doc);
}

function convertJsonToDocx(employmentAgreement: EmploymentAgreement): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      text: employmentAgreement.metadata.title.toUpperCase(),
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Effective Date
  paragraphs.push(
    new Paragraph({
      text: `Effective Date: ${employmentAgreement.metadata.effectiveDate}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Recitals Section
  if (employmentAgreement.recitals && employmentAgreement.recitals.length > 0) {
    paragraphs.push(
      new Paragraph({
        text: 'RECITALS',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 200 },
      })
    );

    employmentAgreement.recitals.forEach((recital) => {
      paragraphs.push(
        new Paragraph({
          text: recital,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 150 },
        })
      );
    });
  }

  // Agreement clause
  paragraphs.push(
    new Paragraph({
      text: 'NOW, THEREFORE, in consideration of the mutual covenants, agreements, and promises contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:',
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 200, after: 300 },
    })
  );

  // Articles
  employmentAgreement.articles.forEach((article) => {
    // Article heading
    paragraphs.push(
      new Paragraph({
        text: `ARTICLE ${article.number}. ${article.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      })
    );

    // Sections within article
    article.sections.forEach((section) => {
      // Section heading (if exists)
      if (section.title) {
        paragraphs.push(
          new Paragraph({
            text: section.number ? `${section.number} ${section.title}` : section.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          })
        );
      }

      // Content blocks
      section.content.forEach((block) => {
        paragraphs.push(...convertContentBlock(block));
      });
    });
  });

  // Signatures
  paragraphs.push(
    new Paragraph({
      text: '',
      spacing: { before: 600, after: 200 },
    })
  );

  paragraphs.push(
    new Paragraph({
      text: 'IN WITNESS WHEREOF, the parties have executed this Employment Agreement as of the date first written above.',
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 300, after: 400 },
    })
  );

  employmentAgreement.signatures.forEach((sig) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sig.partyName.toUpperCase(),
            bold: true,
          }),
        ],
        spacing: { before: 300, after: 150 },
      })
    );

    sig.fields.forEach((field) => {
      paragraphs.push(
        new Paragraph({
          text: `${field.label}: _______________________________`,
          spacing: { after: 120 },
        })
      );
    });
  });

  return paragraphs;
}

function convertContentBlock(block: ContentBlock): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  switch (block.type) {
    case 'paragraph':
      paragraphs.push(createParagraphFromBlock(block));
      break;

    case 'list':
      if (Array.isArray(block.content)) {
        (block.content as ListItem[]).forEach((item, index) => {
          paragraphs.push(createListItem(item, index));
        });
      }
      break;

    case 'definition':
      if (Array.isArray(block.content)) {
        (block.content as DefinitionItem[]).forEach((defItem) => {
          paragraphs.push(createDefinition(defItem));
        });
      }
      break;

    case 'clause':
      paragraphs.push(createParagraphFromBlock(block));
      break;

    default:
      // Fallback for unknown types
      if (typeof block.content === 'string') {
        paragraphs.push(
          new Paragraph({
            text: block.content,
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 150 },
          })
        );
      }
  }

  return paragraphs;
}

function createParagraphFromBlock(block: ContentBlock): Paragraph {
  const text = typeof block.content === 'string' ? block.content : '';
  const formatting = block.formatting || {};

  const textRuns = parseInlineFormatting(text, formatting.bold, formatting.italic);

  let alignment = AlignmentType.JUSTIFIED;
  if (formatting.alignment === 'center') alignment = AlignmentType.CENTER;
  else if (formatting.alignment === 'right') alignment = AlignmentType.RIGHT;
  else if (formatting.alignment === 'left') alignment = AlignmentType.LEFT;

  const indent = formatting.indent ? { left: formatting.indent * 360 } : undefined;

  return new Paragraph({
    children: textRuns,
    alignment,
    spacing: { after: 150 },
    indent,
  });
}

function createListItem(item: ListItem, index: number): Paragraph {
  const textRuns = parseInlineFormatting(item.content);

  return new Paragraph({
    children: textRuns,
    bullet: { level: 0 },
    spacing: { after: 100 },
    indent: { left: 720 },
  });
}

function createDefinition(defItem: DefinitionItem): Paragraph {
  const prefix = defItem.number ? `${defItem.number} ` : '';

  return new Paragraph({
    children: [
      new TextRun({
        text: `${prefix}"${defItem.term}"`,
        bold: true,
      }),
      new TextRun({
        text: ` means ${defItem.definition}`,
      }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 150 },
  });
}

function parseInlineFormatting(text: string, forceBold?: boolean, forceItalic?: boolean): TextRun[] {
  const runs: TextRun[] = [];
  let currentPos = 0;

  // Regex to match **bold**, *italic*, or plain text
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add any plain text before this match
    if (match.index > currentPos) {
      const plainText = text.substring(currentPos, match.index);
      runs.push(new TextRun({ text: plainText, bold: forceBold, italics: forceItalic }));
    }

    // Add the formatted text
    if (match[2]) {
      // Bold text (**text**)
      runs.push(new TextRun({ text: match[2], bold: true, italics: forceItalic }));
    } else if (match[3]) {
      // Italic text (*text*)
      runs.push(new TextRun({ text: match[3], italics: true, bold: forceBold }));
    }

    currentPos = match.index + match[0].length;
  }

  // Add any remaining plain text
  if (currentPos < text.length) {
    runs.push(new TextRun({ text: text.substring(currentPos), bold: forceBold, italics: forceItalic }));
  }

  // If no formatting was found, return a single run with the whole text
  if (runs.length === 0) {
    runs.push(new TextRun({ text, bold: forceBold, italics: forceItalic }));
  }

  return runs;
}

// PDF Generation
export interface PDFDocumentData {
  cards: SmartCard[];
  companyName?: string;
}

export function generateEmploymentAgreementPDF(data: PDFDocumentData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  // Helper to get card value
  const getValue = (cardId: string, defaultValue: string = '[Not specified]') => {
    const card = data.cards.find((c) => c.id === cardId);
    return card?.value || defaultValue;
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYMENT AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated on: ${dateStr}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Section helper
  const addSection = (title: string, content: string) => {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    // Section title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPos);
    yPos += 7;

    // Section content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(content, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 8;
  };

  // 1. PARTIES
  addSection(
    '1. PARTIES TO THE AGREEMENT',
    `This Employment Agreement ("Agreement") is made and entered into as of ${getValue(
      'start-date',
      '[Start Date]'
    )} by and between ${data.companyName || '[Company Name]'} ("Employer") and ${getValue(
      'employee-name',
      '[Employee Name]'
    )} ("Employee").`
  );

  // 2. POSITION AND DUTIES
  const level = getValue('level', '');
  const dept = getValue('department', '');
  const remote = getValue('remote-policy', '');
  addSection(
    '2. POSITION AND DUTIES',
    `The Employee is hired for the position of ${getValue(
      'role',
      '[Job Title]'
    )}${level ? ` at the ${level} level` : ''}${dept ? ` in the ${dept} department` : ''}. The Employee will be based in ${getValue(
      'location',
      '[Location]'
    )}${remote ? ` with a ${remote} work arrangement` : ''}.

The Employee agrees to perform all duties as assigned by the Employer and to devote their full working time and attention to the business of the Employer. The Employee shall report to [Supervisor Name/Title] and shall comply with all policies, procedures, and directives of the Employer.`
  );

  // 3. COMPENSATION
  const salary = getValue('salary', '[Salary]');
  const payFreq = getValue('pay-frequency', '[Pay Schedule]');
  const bonus = getValue('bonus', '');
  const equity = getValue('equity', '');
  const vesting = getValue('vesting', '');
  const cliff = getValue('cliff', '');

  let compensationText = `The Employee shall receive an annual base salary of ${salary}, payable ${payFreq} via direct deposit or as otherwise agreed.`;

  if (bonus) {
    compensationText += ` In addition, the Employee may be eligible for an annual performance bonus of ${bonus}, subject to company performance and individual contributions.`;
  }

  if (equity) {
    compensationText += ` The Employee will be granted ${equity} in company equity`;
    if (vesting) {
      compensationText += `, vesting over ${vesting}`;
    }
    if (cliff) {
      compensationText += ` with a ${cliff} cliff period`;
    }
    compensationText += `, subject to the terms of the company's equity plan and applicable grant agreements.`;
  }

  addSection('3. COMPENSATION', compensationText);

  // 4. BENEFITS
  const health = getValue('health-insurance', '');
  const pto = getValue('pto', '');
  const retirement = getValue('retirement', '');

  if (health || pto || retirement) {
    let benefitsText = 'The Employee shall be eligible for the following benefits:\n\n';
    if (health) benefitsText += `• Health Insurance: ${health}\n`;
    if (pto) benefitsText += `• Paid Time Off: ${pto}\n`;
    if (retirement) benefitsText += `• Retirement Plan: ${retirement}\n`;
    benefitsText += '\nBenefits are subject to the terms and conditions of the applicable benefit plans and may be modified by the Employer from time to time.';
    addSection('4. EMPLOYEE BENEFITS', benefitsText);
  }

  // 5. CONFIDENTIALITY
  const nda = getValue('nda', 'Standard NDA');
  addSection(
    '5. CONFIDENTIALITY AND NON-DISCLOSURE',
    `The Employee acknowledges that during their employment, they will have access to and become acquainted with confidential information belonging to the Employer, including but not limited to trade secrets, customer lists, business strategies, financial information, and proprietary technology.

The Employee agrees to maintain strict confidentiality of all such information during and after employment, and shall not disclose, use, or exploit such information for any purpose other than performing their duties for the Employer. This obligation shall survive the termination of employment.

Terms: ${nda}`
  );

  // 6. INTELLECTUAL PROPERTY
  const ipRights = getValue('ip-rights', 'Work-for-hire');
  addSection(
    '6. INTELLECTUAL PROPERTY RIGHTS',
    `All work product, inventions, discoveries, improvements, and intellectual property created by the Employee during their employment and related to the Employer's business shall be the sole and exclusive property of the Employer. The Employee hereby assigns all rights, title, and interest in such work product to the Employer.

The Employee agrees to execute any documents necessary to perfect the Employer's rights in such intellectual property.

Terms: ${ipRights}`
  );

  // 7. NON-COMPETE/NON-SOLICITATION
  const nonCompete = getValue('non-compete', '');
  const nonSolicitation = getValue('non-solicitation', '');

  if (nonCompete || nonSolicitation) {
    let restrictionsText = '';
    if (nonCompete) {
      restrictionsText += `Non-Compete: ${nonCompete}\n\nThe Employee agrees not to engage in any business that competes with the Employer during employment and for the specified period after termination.\n\n`;
    }
    if (nonSolicitation) {
      restrictionsText += `Non-Solicitation: ${nonSolicitation}\n\nThe Employee agrees not to solicit or hire Employer's employees, contractors, or customers for the specified period after termination.`;
    }
    addSection('7. RESTRICTIVE COVENANTS', restrictionsText);
  }

  // 8. TERMINATION
  const empType = getValue('employment-type', 'At-will');
  const notice = getValue('notice-period', '2 weeks');
  const severance = getValue('severance', '');

  let terminationText = `This is an ${empType} employment relationship. Either party may terminate this Agreement at any time, with or without cause.

Notice Period: ${notice}

Upon termination, the Employee shall return all company property, including but not limited to keys, access cards, documents, equipment, and confidential information.`;

  if (severance) {
    terminationText += `\n\nSeverance: ${severance}`;
  }

  addSection('8. TERMINATION', terminationText);

  // 9. GENERAL PROVISIONS
  addSection(
    '9. GENERAL PROVISIONS',
    `Entire Agreement: This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements, whether written or oral.

Amendments: This Agreement may only be amended in writing signed by both parties.

Governing Law: This Agreement shall be governed by and construed in accordance with the laws of ${getValue(
      'location',
      '[State/Jurisdiction]'
    )}.

Severability: If any provision of this Agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect.

Assignment: This Agreement may not be assigned by the Employee without the written consent of the Employer.`
  );

  // Signature section
  yPos += 10;
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', margin, yPos);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Employer signature
  doc.text('EMPLOYER:', margin, yPos);
  yPos += 15;
  doc.line(margin, yPos, margin + 70, yPos);
  yPos += 5;
  doc.text(data.companyName || '[Company Name]', margin, yPos);
  yPos += 3;
  doc.text('Signature', margin, yPos);
  yPos += 10;
  doc.line(margin, yPos, margin + 70, yPos);
  yPos += 5;
  doc.text('Date', margin, yPos);

  // Employee signature
  yPos += 15;
  doc.text('EMPLOYEE:', margin, yPos);
  yPos += 15;
  doc.line(margin, yPos, margin + 70, yPos);
  yPos += 5;
  doc.text(getValue('employee-name', '[Employee Name]'), margin, yPos);
  yPos += 3;
  doc.text('Signature', margin, yPos);
  yPos += 10;
  doc.line(margin, yPos, margin + 70, yPos);
  yPos += 5;
  doc.text('Date', margin, yPos);

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1; // Subtract the empty first page
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by Legal Templates',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string = 'employment-agreement.pdf') {
  doc.save(filename);
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}

import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer } from 'docx';

export interface DocumentGeneratorOptions {
  document: string;
  formData: any;
}

export async function generateEmploymentAgreementDocx(
  options: DocumentGeneratorOptions
): Promise<Buffer> {
  const { document, formData } = options;

  // Parse the plain text document into structured sections
  const sections = parseDocumentSections(document);

  // Create DOCX document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: 'EMPLOYMENT AGREEMENT',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Generate paragraphs from parsed content
          ...sections.map((section) => {
            if (section.isHeading) {
              return new Paragraph({
                text: section.text,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 },
              });
            } else {
              return new Paragraph({
                text: section.text,
                spacing: { after: 200 },
                alignment: AlignmentType.JUSTIFIED,
              });
            }
          }),

          // Signature blocks
          new Paragraph({
            text: '',
            spacing: { before: 600, after: 200 },
          }),
          new Paragraph({
            text: 'SIGNATURES',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
          }),

          // Employer signature
          new Paragraph({
            children: [
              new TextRun({
                text: `Employer: ${formData.companyName}`,
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Signature: _______________________________',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: 'Name: _______________________________',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: 'Title: _______________________________',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: 'Date: _______________________________',
            spacing: { after: 400 },
          }),

          // Employee signature
          new Paragraph({
            children: [
              new TextRun({
                text: `Employee: ${formData.employeeName}`,
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Signature: _______________________________',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: 'Date: _______________________________',
            spacing: { after: 100 },
          }),
        ],
      },
    ],
  });

  // Generate buffer
  return await Packer.toBuffer(doc);
}

interface DocumentSection {
  text: string;
  isHeading: boolean;
}

function parseDocumentSections(document: string): DocumentSection[] {
  const lines = document.split('\n');
  const sections: DocumentSection[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if it's a heading (all caps, or starts with a number followed by a period)
    const isHeading =
      trimmed === trimmed.toUpperCase() && trimmed.length < 100 ||
      /^\d+\.\s+[A-Z]/.test(trimmed);

    sections.push({
      text: trimmed,
      isHeading,
    });
  }

  return sections;
}

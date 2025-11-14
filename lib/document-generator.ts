// PDF Generation using jsPDF (legacy - kept for reference)
// The main PDF generation now uses @react-pdf/renderer in lib/pdf/EmploymentAgreementPDF.tsx

import jsPDF from 'jspdf';
import type { SmartCard } from './card-engine/types';

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

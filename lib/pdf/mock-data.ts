import type { LegalDocument } from '@/app/api/templates/employment-agreement/schema';

export const MOCK_LEGAL_DOCUMENT: LegalDocument = {
  metadata: {
    title: 'Employment Agreement',
    effectiveDate: '2024-03-20',
    documentType: 'employment-agreement',
    jurisdiction: 'California',
    generatedAt: new Date().toISOString(),
  },
  content: [
    // Intro Paragraph
    {
      type: 'paragraph',
      text: 'This Employment Agreement (the "Agreement") is entered into as of the Effective Date by and between TechCorp Inc. ("Company") and John Doe ("Employee").',
    },
    
    // Article 1: Definitions (Nested structure)
    {
      type: 'article',
      props: { title: 'Definitions', number: 1 },
      children: [
        {
          type: 'definition',
          children: [
            {
              type: 'definition_item',
              props: { term: 'Confidential Information' },
              text: 'Means all non-public information, technical data, trade secrets, know-how, software, and other proprietary information.',
            },
            {
              type: 'definition_item',
              props: { term: 'Intellectual Property' },
              text: 'Means any and all inventions, designs, copyrights, trademarks, and other industrial property rights.',
            },
          ],
        },
      ],
    },
    
    // Article 2: Position and Duties (Sections with lists)
    {
      type: 'article',
      props: { title: 'Position and Duties', number: 2 },
      children: [
        {
          type: 'section',
          props: { title: 'Position', number: '2.1' },
          children: [
            {
              type: 'paragraph',
              text: 'The Company agrees to employ the Employee in the position of Senior Software Engineer. The Employee shall report to the Chief Technology Officer.',
            },
          ],
        },
        {
          type: 'section',
          props: { title: 'Duties', number: '2.2' },
          children: [
            {
              type: 'paragraph',
              text: 'The Employee shall have the following primary responsibilities:',
            },
            {
              type: 'list',
              children: [
                {
                  type: 'list_item',
                  text: 'Developing and maintaining the Company\'s core software products;',
                },
                {
                  type: 'list_item',
                  text: 'Collaborating with cross-functional teams to define, design, and ship new features;',
                },
                {
                  type: 'list_item',
                  text: 'Ensuring the performance, quality, and responsiveness of applications.',
                },
              ],
            },
          ],
        },
      ],
    },

    // Article 3: Compensation (Tables example if we supported tables, but using text for now)
    {
      type: 'article',
      props: { title: 'Compensation', number: 3 },
      children: [
        {
          type: 'section',
          props: { title: 'Base Salary', number: '3.1' },
          children: [
            {
              type: 'paragraph',
              text: 'The Company shall pay the Employee a base salary of $150,000 per year, payable in accordance with the Company\'s standard payroll schedule.',
            },
          ],
        },
      ],
    },
  ],
  signatories: [
    {
      party: 'employer',
      name: 'Jane Smith',
      title: 'Chief Technology Officer',
      email: 'jane.smith@techcorp.com',
    },
    {
      party: 'employee',
      name: 'John Doe',
      email: 'john.doe@email.com',
    },
  ],
};


import { notFound, redirect } from 'next/navigation';
import { getTemplateById, isValidTemplate } from '@/data/templates';

/**
 * Dynamic Template Generation Page
 * 
 * This page handles dynamic routing for template generation.
 * Currently, it redirects to the specific template implementation.
 * 
 * In the future, this will be a generic generation page that loads
 * the appropriate template configuration and renders the wizard.
 */
export default async function TemplateGeneratePage({ 
  params 
}: { 
  params: Promise<{ templateId: string }> 
}) {
  const { templateId } = await params;
  
  // Validate template exists
  if (!isValidTemplate(templateId)) {
    notFound();
  }

  const template = getTemplateById(templateId);
  
  if (!template || !template.available) {
    notFound();
  }

  // For now, redirect to the specific template implementation
  // This maintains backward compatibility while we migrate
  switch (templateId) {
    case 'employment-agreement':
      redirect('/templates/employment-agreement/generate');
    default:
      // For templates without specific implementations yet
      notFound();
  }
}


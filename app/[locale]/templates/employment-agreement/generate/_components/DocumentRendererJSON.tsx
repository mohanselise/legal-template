'use client';

import React from 'react';
import { Scale, Shield, FileText } from 'lucide-react';
import type { LegalDocument, EmploymentAgreement, DocumentBlock, ContentBlock, ListItem } from '@/app/api/templates/employment-agreement/schema';

interface DocumentRendererJSONProps {
  document: LegalDocument | EmploymentAgreement;
}

// Type guard to check if document is legacy format
function isLegacyDocument(doc: LegalDocument | EmploymentAgreement): doc is EmploymentAgreement {
  return 'articles' in doc && 'parties' in doc;
}

const generateDocumentId = () => {
  if (typeof window !== 'undefined') {
    if (typeof window.crypto?.randomUUID === 'function') {
      return window.crypto
        .randomUUID()
        .replace(/-/g, '')
        .slice(0, 8)
        .toUpperCase();
    }
    if (typeof window.crypto?.getRandomValues === 'function') {
      const buffer = new Uint32Array(2);
      window.crypto.getRandomValues(buffer);
      return Array.from(buffer)
        .map((value) => value.toString(16).toUpperCase())
        .join('')
        .slice(0, 8);
    }
  }
  return `DOC-${Date.now().toString(36).toUpperCase()}`;
};

// Recursive Block Renderer Component
const BlockRenderer = ({ block, level = 0 }: { block: DocumentBlock; level?: number }) => {
  const baseTextClass = "leading-[1.9] text-slate-800 dark:text-gray-300 text-justify";
  
  switch (block.type) {
    case 'document':
      return (
        <div className="space-y-8">
          {block.children?.map((child, i) => (
            <BlockRenderer key={child.id || i} block={child} level={level} />
          ))}
        </div>
      );

    case 'article':
      return (
        <div className="mb-16">
          <h2 className="uppercase tracking-[0.15em] border-b-2 border-slate-500 dark:border-gray-500 pb-4 mt-16 mb-8 text-2xl font-extrabold text-slate-900 dark:text-gray-100">
            <span className="inline-block w-1.5 h-8 bg-slate-900 dark:bg-gray-300 rounded-full mr-3 align-middle"></span>
            {block.props?.number ? `ARTICLE ${block.props.number}. ` : ''}{block.props?.title}
          </h2>
          <div className="space-y-8">
            {block.children?.map((child, i) => (
              <BlockRenderer key={child.id || i} block={child} level={level + 1} />
            ))}
          </div>
        </div>
      );

    case 'section':
      return (
        <div className="mb-8">
          {(block.props?.title || block.props?.number) && (
            <h3 className="font-bold mt-6 mb-4 text-slate-900 dark:text-gray-100 text-xl tracking-wide">
              {block.props?.number && <span className="text-slate-600 dark:text-gray-400 mr-2">{block.props.number}</span>}
              {block.props?.title}
            </h3>
          )}
          <div className="space-y-4">
            {block.children?.map((child, i) => (
              <BlockRenderer key={child.id || i} block={child} level={level + 1} />
            ))}
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <p className={`${baseTextClass} mb-4`}>
          {block.text}
        </p>
      );

    case 'list':
      const ListTag = block.props?.ordered ? 'ol' : 'ul';
      const listStyles = block.props?.ordered 
        ? "list-decimal space-y-5 marker:font-bold marker:text-slate-700 dark:marker:text-gray-400" 
        : "list-disc space-y-5 marker:text-slate-700 dark:marker:text-gray-400";
      
      return (
        <ListTag className={`${listStyles} pl-12 my-6`}>
          {block.children?.map((child, i) => (
            <BlockRenderer key={child.id || i} block={child} level={level + 1} />
          ))}
        </ListTag>
      );

    case 'list_item':
      return (
        <li className={`${baseTextClass} pl-3`}>
          {block.text}
          {block.children?.map((child, i) => (
            <div key={child.id || i} className="mt-3">
               <BlockRenderer block={child} level={level + 1} />
            </div>
          ))}
        </li>
      );

    case 'definition':
      return (
        <dl className="space-y-6 my-8">
          {block.children?.map((child, i) => (
            <BlockRenderer key={child.id || i} block={child} level={level + 1} />
          ))}
        </dl>
      );

    case 'definition_item':
      return (
        <div className="border-l-2 border-slate-300 dark:border-gray-700 pl-6">
          <dt className="font-extrabold text-lg text-slate-900 dark:text-gray-100 tracking-wide mb-2">
            {block.props?.term}
          </dt>
          <dd className={baseTextClass}>
            {block.text}
          </dd>
        </div>
      );

    default:
      // Render children for unknown blocks (fallback)
      return (
        <div className="my-4">
           {block.text && <p className={baseTextClass}>{block.text}</p>}
           {block.children?.map((child, i) => (
             <BlockRenderer key={child.id || i} block={child} level={level + 1} />
           ))}
        </div>
      );
  }
};

export function DocumentRendererJSON({ document }: DocumentRendererJSONProps) {
  const [docId] = React.useState(generateDocumentId);

  // ==================================================================
  // LEGACY RENDERING SUPPORT
  // ==================================================================
  if (isLegacyDocument(document)) {
    const formatAddress = (address: any) => {
      return [
        address.street,
        [address.city, address.state].filter(Boolean).join(', '),
        address.postalCode,
        address.country,
      ]
        .filter(Boolean)
        .join(', ');
    };

    const renderContentBlock = (block: ContentBlock, index: number) => {
      const alignment = block.formatting?.alignment || 'justify';
      const indent = block.formatting?.indent || 0;
      const baseClass = `mb-6 leading-[1.9] text-slate-800 dark:text-gray-300`;
      const alignClass = alignment === 'justify' ? 'text-justify' : `text-${alignment}`;
      const indentClass = indent > 0 ? `ml-${indent * 4}` : '';

      switch (block.type) {
        case 'paragraph':
          return (
            <p
              key={index}
              className={`${baseClass} ${alignClass} ${indentClass}`}
              style={{ textIndent: indent > 0 ? `${indent * 2}rem` : undefined }}
            >
              {block.content as string}
            </p>
          );

        case 'definition':
          const definitions = block.content as any[];
          return (
            <dl key={index} className="space-y-6 my-8">
              {definitions.map((def, idx) => (
                <div key={idx} className="border-l-2 border-slate-300 dark:border-gray-700 pl-6">
                  <dt className="font-extrabold text-lg text-slate-900 dark:text-gray-100 tracking-wide mb-2">
                    {def.number && <span className="text-slate-600 dark:text-gray-400 mr-3">{def.number}</span>}
                    {def.term}
                  </dt>
                  <dd className="text-slate-800 dark:text-gray-300 leading-[1.85] text-justify">
                    {def.definition}
                  </dd>
                </div>
              ))}
            </dl>
          );

        case 'list':
          const items = block.content as ListItem[];
          return (
            <ol key={index} className="list-decimal pl-12 my-8 space-y-5 marker:font-bold marker:text-slate-700 dark:marker:text-gray-400">
              {items.map((item, idx) => (
                <li key={idx} className="leading-[1.85] text-justify pl-3">
                  {item.content}
                  {item.subItems && item.subItems.length > 0 && (
                    <ol className="list-[lower-alpha] pl-8 mt-3 space-y-3 marker:text-slate-600">
                      {item.subItems.map((subItem, subIdx) => (
                        <li key={subIdx} className="leading-[1.85] text-justify">
                          {subItem.content}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          );

        case 'clause':
          return (
            <div key={index} className="my-5 leading-[1.9] text-justify indent-16 text-slate-800 dark:text-gray-300">
              {block.content as string}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="bg-white dark:bg-gray-900 shadow-2xl overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
        {/* Premium Document Header */}
        <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-16 py-12 border-b-4 border-slate-900 dark:border-gray-600">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
            <Scale className="w-96 h-96 text-gray-900" />
          </div>

          <div className="relative text-center space-y-4">
            {/* Professional Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-slate-700 rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-lg">
              <Shield className="w-3.5 h-3.5" />
              <span>Legal Document</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-gray-100 uppercase tracking-wider leading-tight"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {document.metadata.title}
            </h1>
          </div>
        </div>

        {/* Document Body - Premium Legal Typography */}
        <div className="px-8 md:px-20 py-16 bg-white dark:bg-gray-900 relative" style={{
          fontFamily: 'Georgia, "Times New Roman", Times, serif'
        }}>
          {/* Page margins indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-20 border-r border-slate-200 dark:border-gray-800 opacity-30"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-20 border-l border-slate-200 dark:border-gray-800 opacity-30"></div>

          <article className="relative">
            {/* Effective Date */}
            <div className="mb-8">
              <p className="text-slate-800 dark:text-gray-300 font-semibold">
                <strong>{document.metadata.effectiveDateLabel || 'Effective Date:'}</strong>{' '}
                {(() => {
                  const dateStr = document.metadata.effectiveDate;
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime()) && date.toString() !== 'Invalid Date') {
                    return date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                  }
                  return dateStr;
                })()}
              </p>
            </div>

            {/* Opening Paragraph with Parties */}
            <div className="mb-12 leading-[1.9] text-slate-800 dark:text-gray-300 text-justify space-y-6">
              <p>
                This Employment Agreement (the <strong>"AGREEMENT"</strong>) is entered into as of{' '}
                {new Date(document.metadata.effectiveDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}, by and between:
              </p>

              <div className="ml-8 space-y-4">
                <div>
                  <p className="font-bold text-lg mb-2">{document.parties.employer.legalName}</p>
                  <p className="text-sm">
                    {formatAddress(document.parties.employer.address)}
                    {document.parties.employer.email && <><br />Email: {document.parties.employer.email}</>}
                    {document.parties.employer.phone && <><br />Phone: {document.parties.employer.phone}</>}
                  </p>
                  <p className="mt-2 text-sm italic">
                    (hereinafter referred to as <strong>"{document.parties.employer.designatedTitle || 'EMPLOYER'}"</strong>)
                  </p>
                </div>

                <p className="text-center font-semibold">AND</p>

                <div>
                  <p className="font-bold text-lg mb-2">{document.parties.employee.legalName}</p>
                  <p className="text-sm">
                    {formatAddress(document.parties.employee.address)}
                    {document.parties.employee.email && <><br />Email: {document.parties.employee.email}</>}
                    {document.parties.employee.phone && <><br />Phone: {document.parties.employee.phone}</>}
                  </p>
                  <p className="mt-2 text-sm italic">
                    (hereinafter referred to as <strong>"{document.parties.employee.designatedTitle || 'EMPLOYEE'}"</strong>)
                  </p>
                </div>
              </div>
            </div>

            {/* Recitals */}
            {document.recitals && document.recitals.length > 0 && (
              <div className="mb-16">
                <h2 className="text-center uppercase tracking-widest font-bold text-xl mb-8 text-slate-900 dark:text-gray-100">
                  Recitals
                </h2>
                <div className="space-y-5">
                  {document.recitals.map((recital, index) => (
                    <p
                      key={index}
                      className="leading-[1.9] text-justify text-slate-800 dark:text-gray-300"
                      style={{ textIndent: '2em' }}
                    >
                      {recital}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {document.articles.map((article) => (
              <div key={article.number} className="mb-16">
                {/* Article Header */}
                <h2 className="uppercase tracking-[0.15em] border-b-2 border-slate-500 dark:border-gray-500 pb-4 mt-16 mb-8 text-2xl font-extrabold text-slate-900 dark:text-gray-100">
                  <span className="inline-block w-1.5 h-8 bg-slate-900 dark:bg-gray-300 rounded-full mr-3 align-middle"></span>
                  ARTICLE {article.number}. {article.title}
                </h2>

                {/* Article Sections */}
                {article.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-8">
                    {section.title && (
                      <h3 className="font-bold mt-10 mb-5 text-slate-900 dark:text-gray-100 text-xl tracking-wide">
                        {section.number && <span className="text-slate-600 dark:text-gray-400 mr-2">{section.number}</span>}
                        {section.title}
                      </h3>
                    )}
                    <div>
                      {section.content.map((block, blockIndex) => renderContentBlock(block, blockIndex))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Signature Blocks */}
            <div className="mt-20">
              <div className="border-t-2 border-slate-400 dark:border-gray-600 pt-8 mb-12"></div>

              <p className="text-center font-bold text-slate-900 dark:text-gray-100 uppercase tracking-widest text-sm mb-12">
                IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
              </p>

              <div className="space-y-12">
                {document.signatures.map((signature, index) => (
                  <div key={index}>
                    <div className="border-t-2 border-slate-300 dark:border-gray-700 pt-6 mb-6"></div>
                    <div className="bg-slate-50 dark:bg-gray-800/30 border-l-4 border-slate-800 dark:border-gray-400 p-8 shadow-sm">
                      <p className="font-extrabold text-lg mb-6 uppercase tracking-wide text-slate-900 dark:text-gray-100">
                        {signature.party === 'employer' ? 'EMPLOYER:' : 'EMPLOYEE:'}
                      </p>
                      <p className="font-bold text-lg mb-6">{signature.partyName}</p>

                      <div className="space-y-4">
                        {signature.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="flex items-end gap-4">
                            <span className="text-sm font-semibold text-slate-700 dark:text-gray-400 min-w-[80px]">
                              {field.label}:
                            </span>
                            <div className="flex-1 border-b-2 border-slate-400 dark:border-gray-600 pb-1 min-h-[32px]">
                              {field.value && <span className="font-semibold">{field.value}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>

        {/* Premium Document Footer */}
        <div className="bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-16 py-10 border-t-4 border-slate-900 dark:border-gray-600">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-sm text-slate-600 dark:text-gray-400">
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-slate-900 dark:text-gray-100 tracking-wide">
                {document.metadata.title}
              </p>
              <p>
                Prepared for{' '}
                <span className="font-semibold text-slate-800 dark:text-gray-200">
                  {document.parties.employee.legalName}
                </span>
              </p>
              <p>
                Prepared by{' '}
                <span className="font-semibold text-slate-800 dark:text-gray-200">
                  {document.parties.employer.legalName}
                </span>
              </p>
              {document.metadata.jurisdiction && (
                <p>Governing Law: {document.metadata.jurisdiction}</p>
              )}
            </div>

            {/* Document Metadata */}
            <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-3 border-l-2 border-slate-300 dark:border-gray-700 pl-6">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-slate-500 dark:text-gray-500">Document ID</span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-gray-300 bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded">
                  {docId}
                </span>
              </div>
              <div className="text-xs">
                Generated: {new Date(document.metadata.generatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Shield className="w-3 h-3" />
                <span>Confidential & Proprietary</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-6 pt-6 border-t border-slate-300 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Employment Agreement • Professional Legal Document</span>
            </div>
            <div className="font-mono">
              Page 1 of 1 • {document.articles.length} Articles
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  // NEW BLOCK-BASED RENDERING
  // ==================================================================
  return (
    <div className="bg-white dark:bg-gray-900 shadow-2xl overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
      {/* Premium Document Header */}
      <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-16 py-12 border-b-4 border-slate-900 dark:border-gray-600">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
          <Scale className="w-96 h-96 text-gray-900" />
        </div>

        <div className="relative text-center space-y-4">
          {/* Professional Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-slate-700 rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-lg">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal Document</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-gray-100 uppercase tracking-wider leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {document.metadata.title}
          </h1>
        </div>
      </div>

      {/* Document Body - Premium Legal Typography */}
      <div className="px-8 md:px-20 py-16 bg-white dark:bg-gray-900 relative" style={{
        fontFamily: 'Georgia, "Times New Roman", Times, serif'
      }}>
        {/* Page margins indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-20 border-r border-slate-200 dark:border-gray-800 opacity-30"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-20 border-l border-slate-200 dark:border-gray-800 opacity-30"></div>

        <div className="relative">
          {/* Effective Date */}
          <div className="mb-8">
            <p className="text-slate-800 dark:text-gray-300 font-semibold">
              <strong>{document.metadata.effectiveDateLabel || 'Effective Date:'}</strong>{' '}
              {(() => {
                const dateStr = document.metadata.effectiveDate;
                const date = new Date(dateStr);
                if (!isNaN(date.getTime()) && date.toString() !== 'Invalid Date') {
                  return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                }
                return dateStr;
              })()}
            </p>
          </div>

          {/* Block Content */}
          {document.content.map((block, index) => (
            <BlockRenderer key={block.id || index} block={block} />
          ))}

          {/* Signature Blocks */}
          <div className="mt-20">
            <div className="border-t-2 border-slate-400 dark:border-gray-600 pt-8 mb-12"></div>

            <p className="text-center font-bold text-slate-900 dark:text-gray-100 uppercase tracking-widest text-sm mb-12">
              IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
            </p>

            <div className="space-y-12">
              {document.signatories.map((signatory, index) => (
                <div key={index}>
                  <div className="border-t-2 border-slate-300 dark:border-gray-700 pt-6 mb-6"></div>
                  <div className="bg-slate-50 dark:bg-gray-800/30 border-l-4 border-slate-800 dark:border-gray-400 p-8 shadow-sm">
                    <p className="font-extrabold text-lg mb-6 uppercase tracking-wide text-slate-900 dark:text-gray-100">
                      {signatory.party === 'employer' ? 'EMPLOYER:' : 'EMPLOYEE:'}
                    </p>
                    <p className="font-bold text-lg mb-6">{signatory.name}</p>

                    <div className="space-y-4">
                       {/* Standard Signature Fields */}
                       <div className="flex items-end gap-4">
                          <span className="text-sm font-semibold text-slate-700 dark:text-gray-400 min-w-[80px]">
                            Signature:
                          </span>
                          <div className="flex-1 border-b-2 border-slate-400 dark:border-gray-600 pb-1 min-h-[32px]">
                          </div>
                        </div>

                        <div className="flex items-end gap-4">
                          <span className="text-sm font-semibold text-slate-700 dark:text-gray-400 min-w-[80px]">
                            Name:
                          </span>
                          <div className="flex-1 border-b-2 border-slate-400 dark:border-gray-600 pb-1 min-h-[32px]">
                             <span className="font-semibold">{signatory.name}</span>
                          </div>
                        </div>

                        {signatory.title && (
                          <div className="flex items-end gap-4">
                            <span className="text-sm font-semibold text-slate-700 dark:text-gray-400 min-w-[80px]">
                              Title:
                            </span>
                            <div className="flex-1 border-b-2 border-slate-400 dark:border-gray-600 pb-1 min-h-[32px]">
                               <span className="font-semibold">{signatory.title}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-end gap-4">
                          <span className="text-sm font-semibold text-slate-700 dark:text-gray-400 min-w-[80px]">
                            Date:
                          </span>
                          <div className="flex-1 border-b-2 border-slate-400 dark:border-gray-600 pb-1 min-h-[32px]">
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Document Footer */}
      <div className="bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-16 py-10 border-t-4 border-slate-900 dark:border-gray-600">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-sm text-slate-600 dark:text-gray-400">
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-slate-900 dark:text-gray-100 tracking-wide">
              {document.metadata.title}
            </p>
            {document.metadata.jurisdiction && (
              <p>Governing Law: {document.metadata.jurisdiction}</p>
            )}
          </div>

          {/* Document Metadata */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-3 border-l-2 border-slate-300 dark:border-gray-700 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-500 dark:text-gray-500">Document ID</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-gray-300 bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded">
                {docId}
              </span>
            </div>
            <div className="text-xs">
              Generated: {new Date(document.metadata.generatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="w-3 h-3" />
              <span>Confidential & Proprietary</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-slate-300 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Employment Agreement • Professional Legal Document</span>
          </div>
          <div className="font-mono">
            Page 1 of 1 • {document.content.length} Blocks
          </div>
        </div>
      </div>
    </div>
  );
}

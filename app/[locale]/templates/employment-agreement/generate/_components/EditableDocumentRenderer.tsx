'use client';

import React, { useState, useCallback } from 'react';
import { Scale, Shield, FileText, Edit2, Save, RotateCcw } from 'lucide-react';
import type { EmploymentAgreement, ContentBlock, ListItem } from '@/app/api/templates/employment-agreement/schema';

interface EditableDocumentRendererProps {
  document: EmploymentAgreement;
  onDocumentChange?: (updatedDocument: EmploymentAgreement) => void;
  isEditable?: boolean;
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

export function EditableDocumentRenderer({
  document: initialDocument,
  onDocumentChange,
  isEditable = true
}: EditableDocumentRendererProps) {
  const [document, setDocument] = useState(initialDocument);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [docId] = React.useState(generateDocumentId);

  const updateDocument = useCallback((updatedDoc: EmploymentAgreement) => {
    setDocument(updatedDoc);
    setHasChanges(true);
    onDocumentChange?.(updatedDoc);
  }, [onDocumentChange]);

  const handleSaveChanges = () => {
    setEditMode(false);
    setHasChanges(false);
  };

  const handleResetChanges = () => {
    setDocument(initialDocument);
    setHasChanges(false);
    onDocumentChange?.(initialDocument);
  };

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

  const EditableText = ({
    value,
    onChange,
    className = '',
    multiline = false,
    placeholder = 'Click to edit...'
  }: {
    value: string;
    onChange: (newValue: string) => void;
    className?: string;
    multiline?: boolean;
    placeholder?: string;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);

    const handleBlur = () => {
      setIsEditing(false);
      if (localValue !== value) {
        onChange(localValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLocalValue(value);
        setIsEditing(false);
      }
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
    };

    if (!editMode) {
      return <span className={className}>{value}</span>;
    }

    if (isEditing) {
      if (multiline) {
        return (
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${className} w-full min-h-[80px] bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            autoFocus
            placeholder={placeholder}
          />
        );
      }

      return (
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${className} bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          autoFocus
          placeholder={placeholder}
        />
      );
    }

    return (
      <span
        onClick={() => setIsEditing(true)}
        className={`${className} cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded px-1 transition-colors border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700`}
        title="Click to edit"
      >
        {value}
      </span>
    );
  };

  const renderContentBlock = (block: ContentBlock, index: number, articleIndex: number, sectionIndex: number) => {
    const alignment = block.formatting?.alignment || 'justify';
    const indent = block.formatting?.indent || 0;
    const baseClass = `mb-6 leading-[1.9] text-[hsl(var(--eerie-black))] dark:text-gray-200`;
    const alignClass = alignment === 'justify' ? 'text-justify' : `text-${alignment}`;
    const indentClass = indent > 0 ? `ml-${indent * 4}` : '';

    const updateBlockContent = (newContent: string) => {
      const updatedDoc = { ...document };
      const article = updatedDoc.articles[articleIndex];
      const section = article.sections[sectionIndex];
      section.content[index] = { ...block, content: newContent };
      updateDocument(updatedDoc);
    };

    switch (block.type) {
      case 'paragraph':
        return (
          <p
            key={index}
            className={`${baseClass} ${alignClass} ${indentClass}`}
            style={{ textIndent: indent > 0 ? `${indent * 2}rem` : undefined }}
          >
            <EditableText
              value={block.content as string}
              onChange={updateBlockContent}
              multiline
            />
          </p>
        );

      case 'definition':
        const definitions = block.content as any[];
        return (
          <dl key={index} className="space-y-6 my-8">
            {definitions.map((def, idx) => (
              <div key={idx} className="border-l-4 border-[hsl(var(--selise-blue))] dark:border-[hsl(var(--sky-blue))] pl-6 py-2">
                <dt className="font-extrabold text-lg text-[hsl(var(--eerie-black))] dark:text-gray-100 tracking-wide mb-2">
                  {def.number && <span className="text-[hsl(var(--globe-grey))] dark:text-gray-400 mr-3">{def.number}</span>}
                  <EditableText
                    value={def.term}
                    onChange={(newTerm) => {
                      const updatedDefs = [...definitions];
                      updatedDefs[idx] = { ...def, term: newTerm };
                      const updatedDoc = { ...document };
                      updatedDoc.articles[articleIndex].sections[sectionIndex].content[index] = {
                        ...block,
                        content: updatedDefs
                      };
                      updateDocument(updatedDoc);
                    }}
                  />
                </dt>
                <dd className="text-[hsl(var(--eerie-black))] dark:text-gray-200 leading-[1.85] text-justify">
                  <EditableText
                    value={def.definition}
                    onChange={(newDef) => {
                      const updatedDefs = [...definitions];
                      updatedDefs[idx] = { ...def, definition: newDef };
                      const updatedDoc = { ...document };
                      updatedDoc.articles[articleIndex].sections[sectionIndex].content[index] = {
                        ...block,
                        content: updatedDefs
                      };
                      updateDocument(updatedDoc);
                    }}
                    multiline
                  />
                </dd>
              </div>
            ))}
          </dl>
        );

      case 'list':
        const items = block.content as ListItem[];
        return (
          <ol key={index} className="list-decimal pl-12 my-8 space-y-5 marker:font-bold marker:text-[hsl(var(--selise-blue))] dark:marker:text-[hsl(var(--sky-blue))]">
            {items.map((item, idx) => (
              <li key={idx} className="leading-[1.85] text-justify pl-3">
                <EditableText
                  value={item.content}
                  onChange={(newContent) => {
                    const updatedItems = [...items];
                    updatedItems[idx] = { ...item, content: newContent };
                    const updatedDoc = { ...document };
                    updatedDoc.articles[articleIndex].sections[sectionIndex].content[index] = {
                      ...block,
                      content: updatedItems
                    };
                    updateDocument(updatedDoc);
                  }}
                  multiline
                />
                {item.subItems && item.subItems.length > 0 && (
                  <ol className="list-[lower-alpha] pl-8 mt-3 space-y-3 marker:text-[hsl(var(--globe-grey))]">
                    {item.subItems.map((subItem, subIdx) => (
                      <li key={subIdx} className="leading-[1.85] text-justify">
                        <EditableText
                          value={subItem.content}
                          onChange={(newContent) => {
                            const updatedItems = [...items];
                            const updatedSubItems = [...(updatedItems[idx].subItems || [])];
                            updatedSubItems[subIdx] = { ...subItem, content: newContent };
                            updatedItems[idx] = { ...item, subItems: updatedSubItems };
                            const updatedDoc = { ...document };
                            updatedDoc.articles[articleIndex].sections[sectionIndex].content[index] = {
                              ...block,
                              content: updatedItems
                            };
                            updateDocument(updatedDoc);
                          }}
                          multiline
                        />
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
          <div key={index} className="my-5 leading-[1.9] text-justify indent-16 text-[hsl(var(--eerie-black))] dark:text-gray-200">
            <EditableText
              value={block.content as string}
              onChange={updateBlockContent}
              multiline
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Edit Mode Controls */}
      {isEditable && (
        <div className="sticky top-4 z-20 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-[hsl(var(--selise-blue))] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {editMode ? (
                <>
                  <div className="flex items-center gap-2 text-[hsl(var(--selise-blue))] dark:text-[hsl(var(--sky-blue))]">
                    <Edit2 className="w-5 h-5 animate-pulse" />
                    <span className="font-semibold">Edit Mode Active</span>
                  </div>
                  {hasChanges && (
                    <span className="text-xs bg-[hsl(var(--lime-green))]/20 text-[hsl(var(--poly-green))] dark:text-[hsl(var(--lime-green))] px-3 py-1 rounded-full font-semibold">
                      Unsaved Changes
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[hsl(var(--globe-grey))] dark:text-gray-400 text-sm">
                  Click Edit to modify the document
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={handleResetChanges}
                    disabled={!hasChanges}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-[hsl(var(--globe-grey))] text-[hsl(var(--globe-grey))] dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[hsl(var(--lime-green))] to-[hsl(var(--poly-green))] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Document
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document */}
      <div className="bg-white dark:bg-gray-900 shadow-2xl overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700">
        {/* Premium Document Header */}
        <div className="relative bg-gradient-to-br from-[hsl(var(--gradient-light-from))] via-white to-[hsl(var(--gradient-light-to))] dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-16 py-12 border-b-4 border-[hsl(var(--oxford-blue))] dark:border-[hsl(var(--sky-blue))]">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
            <Scale className="w-96 h-96 text-[hsl(var(--eerie-black))]" />
          </div>

          <div className="relative text-center space-y-4">
            {/* Professional Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[hsl(var(--oxford-blue))] to-[hsl(var(--selise-blue))] rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-lg">
              <Shield className="w-3.5 h-3.5" />
              <span>Legal Document</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--oxford-blue))] dark:text-gray-100 uppercase tracking-wider leading-tight"
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
              <p className="text-[hsl(var(--eerie-black))] dark:text-gray-200 font-semibold">
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
            <div className="mb-12 leading-[1.9] text-[hsl(var(--eerie-black))] dark:text-gray-200 text-justify space-y-6">
              <p>
                This Employment Agreement (the <strong>"AGREEMENT"</strong>) is entered into as of{' '}
                {new Date(document.metadata.effectiveDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}, by and between:
              </p>

              <div className="ml-8 space-y-4">
                <div className="bg-[hsl(var(--selise-blue))]/5 dark:bg-[hsl(var(--selise-blue))]/10 border-l-4 border-[hsl(var(--selise-blue))] p-6 rounded-r-lg">
                  <p className="font-bold text-xl mb-3 text-[hsl(var(--oxford-blue))] dark:text-[hsl(var(--sky-blue))]">
                    {document.parties.employer.legalName}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {formatAddress(document.parties.employer.address)}
                    {document.parties.employer.email && <><br />Email: {document.parties.employer.email}</>}
                    {document.parties.employer.phone && <><br />Phone: {document.parties.employer.phone}</>}
                  </p>
                  <p className="mt-3 text-sm italic text-[hsl(var(--globe-grey))] dark:text-gray-400">
                    (hereinafter referred to as <strong>"{document.parties.employer.designatedTitle || 'EMPLOYER'}"</strong>)
                  </p>
                </div>

                <p className="text-center font-bold text-lg text-[hsl(var(--oxford-blue))] dark:text-gray-300">AND</p>

                <div className="bg-[hsl(var(--lime-green))]/5 dark:bg-[hsl(var(--lime-green))]/10 border-l-4 border-[hsl(var(--lime-green))] p-6 rounded-r-lg">
                  <p className="font-bold text-xl mb-3 text-[hsl(var(--poly-green))] dark:text-[hsl(var(--lime-green))]">
                    {document.parties.employee.legalName}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {formatAddress(document.parties.employee.address)}
                    {document.parties.employee.email && <><br />Email: {document.parties.employee.email}</>}
                    {document.parties.employee.phone && <><br />Phone: {document.parties.employee.phone}</>}
                  </p>
                  <p className="mt-3 text-sm italic text-[hsl(var(--globe-grey))] dark:text-gray-400">
                    (hereinafter referred to as <strong>"{document.parties.employee.designatedTitle || 'EMPLOYEE'}"</strong>)
                  </p>
                </div>
              </div>
            </div>

            {/* Recitals */}
            {document.recitals && document.recitals.length > 0 && (
              <div className="mb-16">
                <h2 className="text-center uppercase tracking-widest font-bold text-xl mb-8 text-[hsl(var(--oxford-blue))] dark:text-gray-100 border-b-2 border-[hsl(var(--selise-blue))] pb-4">
                  Recitals
                </h2>
                <div className="space-y-5">
                  {document.recitals.map((recital, index) => (
                    <p
                      key={index}
                      className="leading-[1.9] text-justify text-[hsl(var(--eerie-black))] dark:text-gray-200"
                      style={{ textIndent: '2em' }}
                    >
                      <EditableText
                        value={recital}
                        onChange={(newRecital) => {
                          const updatedDoc = { ...document };
                          updatedDoc.recitals[index] = newRecital;
                          updateDocument(updatedDoc);
                        }}
                        multiline
                      />
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {document.articles.map((article, articleIndex) => (
              <div key={article.number} className="mb-16">
                {/* Article Header */}
                <h2 className="uppercase tracking-[0.15em] border-b-4 border-[hsl(var(--selise-blue))] dark:border-[hsl(var(--sky-blue))] pb-4 mt-16 mb-8 text-2xl font-extrabold text-[hsl(var(--oxford-blue))] dark:text-gray-100">
                  <span className="inline-block w-1.5 h-8 bg-gradient-to-b from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] rounded-full mr-3 align-middle"></span>
                  ARTICLE {article.number}.{' '}
                  <EditableText
                    value={article.title}
                    onChange={(newTitle) => {
                      const updatedDoc = { ...document };
                      updatedDoc.articles[articleIndex].title = newTitle;
                      updateDocument(updatedDoc);
                    }}
                  />
                </h2>

                {/* Article Sections */}
                {article.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-8">
                    {section.title && (
                      <h3 className="font-bold mt-10 mb-5 text-[hsl(var(--eerie-black))] dark:text-gray-100 text-xl tracking-wide">
                        {section.number && <span className="text-[hsl(var(--globe-grey))] dark:text-gray-400 mr-2">{section.number}</span>}
                        <EditableText
                          value={section.title}
                          onChange={(newTitle) => {
                            const updatedDoc = { ...document };
                            updatedDoc.articles[articleIndex].sections[sectionIndex].title = newTitle;
                            updateDocument(updatedDoc);
                          }}
                        />
                      </h3>
                    )}
                    <div>
                      {section.content.map((block, blockIndex) =>
                        renderContentBlock(block, blockIndex, articleIndex, sectionIndex)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Signature Blocks */}
            <div className="mt-20">
              <div className="border-t-4 border-[hsl(var(--oxford-blue))] dark:border-[hsl(var(--sky-blue))] pt-8 mb-12"></div>

              <p className="text-center font-bold text-[hsl(var(--oxford-blue))] dark:text-gray-100 uppercase tracking-widest text-sm mb-12">
                IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
              </p>

              <div className="space-y-12">
                {document.signatures.map((signature, index) => (
                  <div key={index}>
                    <div className="border-t-2 border-[hsl(var(--globe-grey))]/30 dark:border-gray-700 pt-6 mb-6"></div>
                    <div className={`${
                      signature.party === 'employer'
                        ? 'bg-[hsl(var(--selise-blue))]/5 dark:bg-[hsl(var(--selise-blue))]/10 border-l-4 border-[hsl(var(--selise-blue))]'
                        : 'bg-[hsl(var(--lime-green))]/5 dark:bg-[hsl(var(--lime-green))]/10 border-l-4 border-[hsl(var(--lime-green))]'
                    } p-8 shadow-md rounded-r-lg`}>
                      <p className="font-extrabold text-lg mb-6 uppercase tracking-wide text-[hsl(var(--eerie-black))] dark:text-gray-100">
                        {signature.party === 'employer' ? 'EMPLOYER:' : 'EMPLOYEE:'}
                      </p>
                      <p className="font-bold text-lg mb-6">{signature.partyName}</p>

                      <div className="space-y-4">
                        {signature.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="flex items-end gap-4">
                            <span className="text-sm font-semibold text-[hsl(var(--globe-grey))] dark:text-gray-400 min-w-[80px]">
                              {field.label}:
                            </span>
                            <div className="flex-1 border-b-2 border-[hsl(var(--oxford-blue))] dark:border-gray-500 pb-1 min-h-[32px]">
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
        <div className="bg-gradient-to-br from-[hsl(var(--gradient-light-from))] via-[hsl(var(--gradient-light-to))] to-[hsl(var(--gradient-light-from))] dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-16 py-10 border-t-4 border-[hsl(var(--oxford-blue))] dark:border-[hsl(var(--sky-blue))]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-sm text-[hsl(var(--globe-grey))] dark:text-gray-400">
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-[hsl(var(--eerie-black))] dark:text-gray-100 tracking-wide">
                {document.metadata.title}
              </p>
              <p>
                Prepared for{' '}
                <span className="font-semibold text-[hsl(var(--oxford-blue))] dark:text-[hsl(var(--sky-blue))]">
                  {document.parties.employee.legalName}
                </span>
              </p>
              <p>
                Prepared by{' '}
                <span className="font-semibold text-[hsl(var(--oxford-blue))] dark:text-[hsl(var(--sky-blue))]">
                  {document.parties.employer.legalName}
                </span>
              </p>
              {document.metadata.jurisdiction && (
                <p>Governing Law: {document.metadata.jurisdiction}</p>
              )}
            </div>

            {/* Document Metadata */}
            <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-3 border-l-2 border-[hsl(var(--selise-blue))]/30 dark:border-gray-700 pl-6">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[hsl(var(--globe-grey))] dark:text-gray-500">Document ID</span>
                <span className="font-mono text-xs font-bold text-[hsl(var(--oxford-blue))] dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-[hsl(var(--selise-blue))]/30">
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
          <div className="mt-6 pt-6 border-t border-[hsl(var(--selise-blue))]/20 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[hsl(var(--globe-grey))] dark:text-gray-500">
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
    </div>
  );
}

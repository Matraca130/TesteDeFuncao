// ============================================================
// Axon v4.4 — Study View: Content Rendering Helpers
// ============================================================
// renderStudyContent  — Markdown-like rendering with keyword detection
// renderInline        — Inline bold/keyword rendering
// renderMarkdownContent — Standard markdown content rendering
// ============================================================
import React from 'react';
import { headingStyle } from '@/app/design-system';
import { findKeyword, masteryConfig } from '@/app/data/keywords';
import clsx from 'clsx';

export function renderStudyContent(text: string): React.ReactNode {
  if (!text) return null;
  const elements: React.ReactNode[] = [];
  text.split('\n\n').forEach((para, pIdx) => {
    const trimmed = para.trim();
    if (!trimmed) return;
    trimmed.split('\n').forEach((line, lIdx) => {
      const ln = line.trim();
      if (!ln) return;
      const key = `${pIdx}-${lIdx}`;
      if (ln.startsWith('**') && ln.endsWith('**')) {
        elements.push(
          <h4 key={key} className="text-sm font-bold text-gray-900 mt-5 mb-2" style={headingStyle}>
            {ln.slice(2, -2).replace(/:$/, '')}
          </h4>
        );
      } else if (ln.startsWith('- ')) {
        elements.push(
          <div key={key} className="flex items-start gap-2.5 ml-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
            <span className="text-sm text-gray-700 leading-relaxed">{renderInline(ln.slice(2))}</span>
          </div>
        );
      } else if (ln.startsWith('*') && ln.endsWith('*') && !ln.startsWith('**')) {
        elements.push(
          <p key={key} className="text-sm text-gray-600 italic mt-3 mb-1 font-medium">
            {ln.slice(1, -1)}
          </p>
        );
      } else {
        elements.push(
          <p key={key} className="text-sm text-gray-700 leading-relaxed mb-3">
            {renderInline(ln)}
          </p>
        );
      }
    });
  });
  return <>{elements}</>;
}

export function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      const kw = findKeyword(inner);
      if (kw) {
        const config = masteryConfig[kw.masteryLevel];
        return (
          <span
            key={i}
            className={clsx(
              'keyword-mark font-semibold cursor-pointer underline decoration-2',
              config.underlineClass
            )}
            data-keyword={kw.term}
          >
            {inner}
          </span>
        );
      }
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {inner}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function renderMarkdownContent(text: string): React.ReactNode {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <br key={i} />;
    if (t.startsWith('### '))
      return (
        <h4 key={i} className="text-sm font-bold text-gray-900 mt-5 mb-2" style={headingStyle}>
          {t.slice(4)}
        </h4>
      );
    if (t.startsWith('## '))
      return (
        <h3 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2" style={headingStyle}>
          {t.slice(3)}
        </h3>
      );
    if (t.startsWith('# '))
      return (
        <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3" style={headingStyle}>
          {t.slice(2)}
        </h2>
      );
    if (t.startsWith('- '))
      return (
        <div key={i} className="flex items-start gap-2 ml-1 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
          <span className="text-sm text-gray-700 leading-relaxed">{t.slice(2)}</span>
        </div>
      );
    return (
      <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">
        {t}
      </p>
    );
  });
}

// ============================================================
// Axon v4.4 — Study View: Session Page Content
// ============================================================
// Priority: canvasBlocks > studyContent fallback
// Renders the correct content for the current page.
// ============================================================
import React from 'react';
import { headingStyle } from '@/app/design-system';
import type { Topic } from '@/app/data/courses';
import { getSectionImage } from '@/app/data/sectionImages';
import { CanvasBlocksRenderer } from '../CanvasBlocksRenderer';
import { KeywordPopoverProvider } from '../canvas/KeywordPopover';
import { renderStudyContent, renderMarkdownContent } from './content-renderers';
import type { StudySummary } from '@/app/types/student';

export function SessionPageContent({ summary, topic, contentSections, currentPage }: {
  summary: StudySummary | null; topic: Topic;
  contentSections: { title: string; content: string }[]; currentPage: number;
}) {
  if (summary?.canvasBlocks && currentPage === 0) {
    return <CanvasBlocksRenderer blocksJson={summary.canvasBlocks} />;
  }

  const section = contentSections[currentPage];
  if (!section) {
    return (
      <KeywordPopoverProvider>
        <div className="prose prose-sm max-w-none">
          {summary?.content
            ? renderMarkdownContent(summary.content)
            : <p className="text-gray-500 italic">{topic.summary || 'Conteudo do resumo ainda nao disponivel para este topico.'}</p>}
        </div>
      </KeywordPopoverProvider>
    );
  }

  const sectionImage = getSectionImage(topic.id, section.title);

  return (
    <KeywordPopoverProvider>
      <div>
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{currentPage + 1}</span>
          <h2 className="text-2xl font-bold text-gray-900" style={headingStyle}>{section.title}</h2>
        </div>
        <div className="relative">
          {sectionImage && (
            <figure className="float-right ml-6 mb-4 w-[280px] rounded-xl overflow-hidden shadow-lg border border-gray-100">
              <div className="relative">
                <img src={sectionImage.url} alt={sectionImage.alt} className="w-full h-auto object-cover" />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">{sectionImage.caption.split(' \u2014 ')[0]}</div>
              </div>
              <figcaption className="px-3 py-2 bg-gray-50 text-[11px] text-gray-500 leading-relaxed">{sectionImage.caption}</figcaption>
            </figure>
          )}
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">{renderStudyContent(section.content)}</div>
          <div className="clear-both" />
        </div>
      </div>
    </KeywordPopoverProvider>
  );
}

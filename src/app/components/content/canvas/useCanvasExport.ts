// ══════════════════════════════════════════════════════════════
// CANVAS EXPORT — PDF export with html2pdf + print fallback
// ══════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import type { TopicOption } from './types';

export interface UseCanvasExportParams {
  pdfRef: React.RefObject<HTMLDivElement | null>;
  selectedTopic: TopicOption | undefined;
}

export function useCanvasExport(params: UseCanvasExportParams) {
  const { pdfRef, selectedTopic } = params;
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!pdfRef.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const title = selectedTopic?.topicTitle || 'Resumo';
      const courseName = selectedTopic?.courseName || '';
      const filename = `${courseName ? courseName + ' - ' : ''}${title}.pdf`.replace(/[/\\?%*:|"<>]/g, '-');

      await html2pdf()
        .set({
          margin: [12, 14, 12, 14],
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            onclone: (clonedDoc: Document) => {
              clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
            },
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(pdfRef.current)
        .save();
    } catch (err: any) {
      console.error('[ResumoCanvas] html2pdf failed, using print fallback:', err);
      try {
        const printWin = window.open('', '_blank');
        if (printWin && pdfRef.current) {
          const pTitle = selectedTopic?.topicTitle || 'Resumo';
          printWin.document.write(`<!DOCTYPE html><html><head><title>${pTitle}</title><style>
            body{font-family:Georgia,serif;padding:40px;color:#111;max-width:800px;margin:0 auto}
            img{max-width:100%;border-radius:8px}
            @media print{body{padding:20px}}
          </style></head><body>${pdfRef.current.innerHTML}</body></html>`);
          printWin.document.close();
          setTimeout(() => { printWin.print(); }, 500);
        }
      } catch (fallbackErr: any) {
        console.error('[ResumoCanvas] print fallback also failed:', fallbackErr);
        alert('Erro ao exportar. Tente Ctrl+P para imprimir como PDF.');
      }
    } finally {
      setExporting(false);
    }
  }, [pdfRef, selectedTopic]);

  return { exporting, handleExportPDF };
}

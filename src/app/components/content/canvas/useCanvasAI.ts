// ══════════════════════════════════════════════════════════════
// CANVAS AI — generate content with Gemini
// ══════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import type { CanvasBlock, TopicOption } from './types';
import { makeBlock, contentToBlocks } from './helpers';

export interface UseCanvasAIParams {
  topicId: string;
  selectedTopic: TopicOption | undefined;
  pushUndo: () => void;
  setBlocks: React.Dispatch<React.SetStateAction<CanvasBlock[]>>;
}

export function useCanvasAI(params: UseCanvasAIParams) {
  const { topicId, selectedTopic, pushUndo, setBlocks } = params;
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = useCallback(async () => {
    if (!topicId) return;
    setGenerating(true);
    try {
      const { projectId, publicAnonKey } = await import('/utils/supabase/info');
      const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0c4f6a3c`;
      const res = await fetch(`${BASE}/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          concept: selectedTopic?.topicTitle || topicId,
          context: `Materia: ${selectedTopic?.courseName}. Secao: ${selectedTopic?.sectionTitle}. Formato: resumo detalhado para estudo de medicina com secoes, bullet points e termos importantes em negrito.`,
        }),
      });
      if (!res.ok) throw new Error(`AI error ${res.status}`);
      const data = await res.json();
      if (data.explanation) {
        pushUndo();
        const aiBlocks = contentToBlocks(data.explanation);
        setBlocks(prev => [...prev, makeBlock('divider'), ...aiBlocks]);
      }
    } catch (err: any) {
      console.error('[ResumoCanvas] AI:', err);
      alert(`Erro IA: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }, [topicId, selectedTopic, pushUndo, setBlocks]);

  return { generating, handleGenerateAI };
}

import { useState, useCallback } from 'react';
import type {
  TextAnnotation,
  PendingAnnotation,
  AnnotationColor,
  AnnotationTabType,
} from './types';

/**
 * Hook for managing text annotations (highlights, notes, MedBot questions).
 */
export function useTextAnnotationManager() {
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
  const [annotationNoteInput, setAnnotationNoteInput] = useState('');
  const [annotationQuestionInput, setAnnotationQuestionInput] = useState('');
  const [annotationBotLoading, setAnnotationBotLoading] = useState(false);
  const [annotationActiveTab, setAnnotationActiveTab] = useState<AnnotationTabType>('highlight');
  const [annotationColor, setAnnotationColor] = useState<AnnotationColor>('yellow');

  const createTextAnnotation = useCallback((
    text: string,
    type: 'highlight' | 'note' | 'question',
    note: string = '',
    color: AnnotationColor = 'yellow',
  ) => {
    const newId = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newAnnotation: TextAnnotation = {
      id: newId,
      originalText: text,
      displayText: text.length > 200 ? text.slice(0, 200) + '\u2026' : text,
      color,
      note,
      type,
      timestamp: Date.now(),
    };
    setTextAnnotations(prev => [...prev, newAnnotation]);

    // Simulate MedBot response for questions
    if (type === 'question') {
      setAnnotationBotLoading(true);
      setTimeout(() => {
        setTextAnnotations(prev =>
          prev.map(a =>
            a.id === newId
              ? {
                  ...a,
                  botReply: `Com base no trecho selecionado, posso explicar que: "${text.slice(0, 60)}..." Este conceito e fundamental na medicina porque se relaciona com os mecanismos fisiologicos e anatomicos da regiao estudada. Deseja que eu aprofunde algum aspecto especifico?`,
                }
              : a,
          ),
        );
        setAnnotationBotLoading(false);
      }, 1500);
    }

    // Reset pending state
    setPendingAnnotation(null);
    setAnnotationNoteInput('');
    setAnnotationQuestionInput('');
  }, []);

  const deleteTextAnnotation = useCallback((id: string) => {
    setTextAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  const openAnnotationFor = useCallback((text: string, rect: DOMRect) => {
    setPendingAnnotation({ text, rect });
    setAnnotationActiveTab('highlight');
  }, []);

  const closeAnnotation = useCallback(() => {
    setPendingAnnotation(null);
  }, []);

  return {
    // State
    textAnnotations,
    setTextAnnotations,
    pendingAnnotation,
    annotationNoteInput,
    setAnnotationNoteInput,
    annotationQuestionInput,
    setAnnotationQuestionInput,
    annotationBotLoading,
    annotationActiveTab,
    setAnnotationActiveTab,
    annotationColor,
    setAnnotationColor,
    // Actions
    createTextAnnotation,
    deleteTextAnnotation,
    openAnnotationFor,
    closeAnnotation,
  };
}

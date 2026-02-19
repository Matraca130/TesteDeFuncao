import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  X,
  StickyNote,
  Highlighter,
  Edit3,
  Bot,
  Send,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import type {
  AnnotationColor,
  AnnotationTabType,
  PendingAnnotation,
} from './types';
import { highlighterStyles, colorButtonMap, colorDotMap } from './types';

// ─── Text Annotation Popup ───────────────────────────────────────────────────

interface TextAnnotationPopupProps {
  pendingAnnotation: PendingAnnotation;
  annotationActiveTab: AnnotationTabType;
  setAnnotationActiveTab: (tab: AnnotationTabType) => void;
  annotationColor: AnnotationColor;
  setAnnotationColor: (color: AnnotationColor) => void;
  annotationNoteInput: string;
  setAnnotationNoteInput: (val: string) => void;
  annotationQuestionInput: string;
  setAnnotationQuestionInput: (val: string) => void;
  annotationBotLoading: boolean;
  onClose: () => void;
  onCreateAnnotation: (text: string, type: 'highlight' | 'note' | 'question', note: string, color: AnnotationColor) => void;
}

const tabs: { key: AnnotationTabType; icon: React.ReactNode; label: string }[] = [
  { key: 'highlight', icon: <Highlighter size={14} />, label: 'Destacar' },
  { key: 'note', icon: <Edit3 size={14} />, label: 'Anotar' },
  { key: 'question', icon: <Bot size={14} />, label: 'Perguntar' },
];

const colorOptions: AnnotationColor[] = ['yellow', 'blue', 'green', 'pink'];

export function TextAnnotationPopup({
  pendingAnnotation,
  annotationActiveTab,
  setAnnotationActiveTab,
  annotationColor,
  setAnnotationColor,
  annotationNoteInput,
  setAnnotationNoteInput,
  annotationQuestionInput,
  setAnnotationQuestionInput,
  annotationBotLoading,
  onClose,
  onCreateAnnotation,
}: TextAnnotationPopupProps) {
  return createPortal(
    <div
      id="text-annotation-popup"
      className="fixed z-[9999]"
      style={{
        top: Math.min(pendingAnnotation.rect.bottom + 8, window.innerHeight - 420),
        left: Math.max(12, Math.min(pendingAnnotation.rect.left, window.innerWidth - 380)),
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <StickyNote size={16} className="text-blue-500" />
            <span className="font-bold text-sm text-gray-800">Anotar Trecho</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>

        {/* Cited text */}
        <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/30">
          <p className="text-xs text-gray-500 mb-1 font-medium">Trecho selecionado:</p>
          <p className="text-sm text-gray-700 italic line-clamp-3 leading-relaxed">
            "{pendingAnnotation.text.length > 150 ? pendingAnnotation.text.slice(0, 150) + '\u2026' : pendingAnnotation.text}"
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setAnnotationActiveTab(tab.key)} className={clsx("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-b-2", annotationActiveTab === tab.key ? "text-blue-600 border-blue-500 bg-blue-50/50" : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50")}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {annotationActiveTab === 'highlight' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Escolha uma cor de marca-texto:</p>
              <div className="flex items-center gap-3">
                {colorOptions.map(color => (
                  <button key={color} onClick={() => setAnnotationColor(color)} className={clsx("w-9 h-9 rounded-full transition-all border-2", colorButtonMap[color], annotationColor === color ? "ring-2 ring-offset-2 scale-110 border-gray-600" : "hover:scale-105 border-transparent")} />
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Preview</p>
                <span className="text-sm text-gray-700" style={{ ...highlighterStyles[annotationColor], padding: '0 2px' } as React.CSSProperties}>
                  {pendingAnnotation.text.length > 60 ? pendingAnnotation.text.slice(0, 60) + '\u2026' : pendingAnnotation.text}
                </span>
              </div>
              <button onClick={() => onCreateAnnotation(pendingAnnotation.text, 'highlight', '', annotationColor)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><Highlighter size={14} />Destacar Trecho</button>
            </div>
          )}
          {annotationActiveTab === 'note' && (
            <div className="space-y-3">
              <textarea value={annotationNoteInput} onChange={(e) => setAnnotationNoteInput(e.target.value)} placeholder="Escreva sua anotacao sobre este trecho..." className="w-full h-24 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-gray-50 placeholder:text-gray-400" autoFocus />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">{colorOptions.map(color => (<button key={color} onClick={() => setAnnotationColor(color)} className={clsx("w-5 h-5 rounded-full transition-all", colorDotMap[color], annotationColor === color ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-105")} />))}</div>
                <button onClick={() => { if (annotationNoteInput.trim()) onCreateAnnotation(pendingAnnotation.text, 'note', annotationNoteInput.trim(), annotationColor); }} disabled={!annotationNoteInput.trim()} className={clsx("ml-auto py-2 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2", annotationNoteInput.trim() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 cursor-not-allowed")}><Edit3 size={14} />Salvar Nota</button>
              </div>
            </div>
          )}
          {annotationActiveTab === 'question' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><Bot size={12} className="text-white" /></div>
                <span className="text-xs font-bold text-gray-700">MedBot</span>
                <span className="text-[10px] text-gray-400">IA Assistente</span>
              </div>
              <textarea value={annotationQuestionInput} onChange={(e) => setAnnotationQuestionInput(e.target.value)} placeholder="Pergunte algo sobre este trecho ao MedBot..." className="w-full h-20 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-gray-50 placeholder:text-gray-400" autoFocus />
              <button onClick={() => { const q = annotationQuestionInput.trim() || 'Explique este trecho em detalhes'; onCreateAnnotation(pendingAnnotation.text, 'question', q, 'blue'); }} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2">
                {annotationBotLoading ? (<><Loader2 size={14} className="animate-spin" />Pensando...</>) : (<><Send size={14} />Perguntar ao MedBot</>)}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

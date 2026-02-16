// ══════════════════════════════════════════════════════════════
// CANVAS TOP BAR — Header do editor com acoes principais
// Extraido de ResumoCanvas para modularizacao
// ══════════════════════════════════════════════════════════════
import React from 'react';
import clsx from 'clsx';
import { headingStyle, components } from '@/app/design-system';
import {
  ArrowLeft, Edit3, Eye, Sparkles, Loader2,
  FileDown, Trash2, Save,
} from 'lucide-react';
import { CARD } from './types';

interface CanvasTopBarProps {
  isNew: boolean;
  topicTitle: string;
  wordCount: number;
  keywordCount: number;
  viewMode: 'edit' | 'preview';
  onViewModeChange: (m: 'edit' | 'preview') => void;
  generating: boolean;
  onGenerateAI: () => void;
  topicId: string;
  exporting: boolean;
  onExportPDF: () => void;
  onDelete?: () => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function CanvasTopBar({
  isNew, topicTitle, wordCount, keywordCount,
  viewMode, onViewModeChange,
  generating, onGenerateAI, topicId,
  exporting, onExportPDF,
  onDelete, saving, onSave, onCancel,
}: CanvasTopBarProps) {
  return (
    <div className={`${CARD} mx-0 rounded-none rounded-t-2xl px-5 py-3 flex items-center justify-between gap-3 border-b border-gray-200 sticky top-0 z-30`}>
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Voltar"><ArrowLeft size={18} /></button>
        <div className="h-6 w-px bg-gray-200" />
        <div>
          <h2 className="text-base font-bold text-gray-900 leading-tight" style={headingStyle}>{isNew ? 'Novo Resumo' : topicTitle}</h2>
          <p className="text-[11px] text-gray-400">{wordCount} palavras{keywordCount > 0 && <span className="text-teal-500"> &middot; {keywordCount} palavras-chave</span>}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => onViewModeChange('edit')} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-all', viewMode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}><Edit3 size={12} className="inline mr-1" />Editor</button>
          <button onClick={() => onViewModeChange('preview')} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-all', viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}><Eye size={12} className="inline mr-1" />Preview</button>
        </div>
        <div className="h-6 w-px bg-gray-200" />
        {/* AI */}
        <button onClick={onGenerateAI} disabled={generating || !topicId} className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all', generating ? 'bg-violet-100 text-violet-500' : 'bg-violet-50 text-violet-700 hover:bg-violet-100', (!topicId || generating) && 'opacity-50 cursor-not-allowed')}>
          {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}{generating ? 'Gerando...' : 'IA'}
        </button>
        {/* PDF */}
        <button onClick={onExportPDF} disabled={exporting} className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all', exporting ? 'bg-amber-100 text-amber-500' : 'bg-amber-50 text-amber-700 hover:bg-amber-100', exporting && 'opacity-50 cursor-not-allowed')}>
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}{exporting ? 'Exportando...' : 'PDF'}
        </button>
        {/* Delete */}
        {!isNew && onDelete && (
          <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all bg-red-50 text-red-600 hover:bg-red-100" title="Deletar resumo"><Trash2 size={13} />Deletar</button>
        )}
        {/* Save */}
        <button onClick={onSave} disabled={saving || !topicId} className={`${components.buttonPrimary.base} px-5 py-2 text-xs flex items-center gap-1.5 ${(saving || !topicId) ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}{saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

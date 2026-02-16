import clsx from 'clsx';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SaveStatus } from './admin-types';

interface FloatingSaveBarProps {
  itemCount: number;
  itemLabel: string;              // e.g. "questao" / "flashcard"
  itemLabelPlural: string;        // e.g. "questoes" / "flashcards"
  saveLabel: string;              // e.g. "Salvar Quiz" / "Salvar Flashcards"
  hasUnsavedChanges: boolean;
  partialCount: number;
  saving: boolean;
  saveStatus: SaveStatus;
  onSave: () => void;
}

export function FloatingSaveBar({
  itemCount, itemLabel, itemLabelPlural, saveLabel,
  hasUnsavedChanges, partialCount, saving, saveStatus, onSave,
}: FloatingSaveBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {itemCount} {itemCount === 1 ? itemLabel : itemLabelPlural}
            </span>
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Alteracoes nao salvas
              </span>
            )}
            {partialCount > 0 && (
              <span className="text-[10px] text-amber-500">
                ({partialCount} incompleto{partialCount > 1 ? 's' : ''} — ser{partialCount > 1 ? 'ao' : 'a'} salvo{partialCount > 1 ? 's' : ''} assim mesmo)
              </span>
            )}
          </div>
          <button onClick={onSave} disabled={saving}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
              saving && "bg-gray-200 text-gray-500 cursor-wait",
              !saving && saveStatus === 'idle' && "bg-teal-600 hover:bg-teal-700 text-white hover:shadow-md active:scale-[0.98]",
              !saving && saveStatus === 'success' && "bg-emerald-500 text-white",
              !saving && saveStatus === 'error' && "bg-rose-500 text-white",
            )}>
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> Salvando...</>
            ) : saveStatus === 'success' ? (
              <><CheckCircle2 size={15} /> Salvo com sucesso!</>
            ) : saveStatus === 'error' ? (
              <><AlertCircle size={15} /> Erro ao salvar</>
            ) : (
              <><Save size={15} /> {saveLabel}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

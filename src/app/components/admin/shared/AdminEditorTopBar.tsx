import React from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Eye, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import type { SelectedTopicInfo } from './admin-types';

interface AdminEditorTopBarProps {
  selectedTopic: SelectedTopicInfo;
  hasUnsavedChanges: boolean;
  previewMode: boolean;
  onTogglePreview: () => void;
  onBack: () => void;
  /** Icon component to show in the breadcrumb badge */
  icon: React.ElementType;
  /** Tailwind classes for the icon badge bg, e.g. "bg-violet-50" */
  iconBgClass: string;
  /** Tailwind classes for the icon color, e.g. "text-violet-600" */
  iconColorClass: string;
  /** Tailwind classes for the preview toggle when active */
  previewActiveClass?: string;
  /** Validation summary counts */
  completeCount: number;
  partialCount: number;
  emptyCount: number;
  totalItems: number;
}

export function AdminEditorTopBar({
  selectedTopic, hasUnsavedChanges, previewMode, onTogglePreview, onBack,
  icon: Icon, iconBgClass, iconColorClass,
  previewActiveClass = 'bg-violet-50 text-violet-700 border-violet-200',
  completeCount, partialCount, emptyCount, totalItems,
}: AdminEditorTopBarProps) {
  return (
    <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => {
            if (hasUnsavedChanges && !confirm('Voce tem alteracoes nao salvas. Deseja sair?')) return;
            onBack();
          }} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
            <ChevronLeft size={16} /> Voltar
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center", iconBgClass)}>
              <Icon size={14} className={iconColorClass} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{selectedTopic.topic.title}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="font-semibold text-gray-500">{selectedTopic.course.name}</span>
                <ChevronRight size={8} />
                <span>{selectedTopic.semesterTitle}</span>
                <ChevronRight size={8} />
                <span>{selectedTopic.sectionTitle}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status summary chips */}
          {totalItems > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              {completeCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200">
                  <CheckCircle2 size={10} />{completeCount}
                </span>
              )}
              {partialCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold border border-amber-200">
                  <AlertTriangle size={10} />{partialCount}
                </span>
              )}
              {emptyCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold border border-gray-200">
                  <AlertCircle size={10} />{emptyCount}
                </span>
              )}
            </div>
          )}
          <button onClick={onTogglePreview}
            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              previewMode ? previewActiveClass : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            )}>
            <Eye size={13} /> {previewMode ? 'Editar' : 'Preview'}
          </button>
        </div>
      </div>
    </div>
  );
}

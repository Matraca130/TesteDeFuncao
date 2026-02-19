import React from 'react';
import { Box, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { headingStyle, components, iconClasses } from '@/app/design-system';
import type { Model3D } from '@/app/data/courses';

interface Models3DGalleryProps {
  models: { topicTitle: string; model: Model3D; sectionTitle: string }[];
  onView3D: () => void;
}

export function Models3DGallery({ models, onView3D }: Models3DGalleryProps) {
  if (models.length === 0) return null;
  return (
    <div className="mt-16 pt-12 border-t border-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <div className={iconClasses('md')}><Box size={20} className={components.icon.default.text} /></div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={headingStyle}>Modelos 3D Relacionados</h2>
          <p className="text-sm text-gray-500">Explore as estruturas anatomicas em 3D interativo</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((item) => (
          <button key={item.model.id} onClick={onView3D} className="group text-left p-5 rounded-2xl border border-gray-200 bg-white hover:border-teal-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <div className="flex items-start gap-3">
              <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", item.model.available ? "bg-teal-50" : "bg-gray-100")}>
                <Box size={22} className={item.model.available ? "text-teal-500" : "text-gray-400"} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-gray-900 group-hover:text-teal-700 transition-colors truncate" style={headingStyle}>{item.model.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{item.sectionTitle}</p>
                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{item.model.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", item.model.available ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500")}>{item.model.available ? 'Disponivel' : 'Em breve'}</span>
              <span className="text-xs text-teal-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Explorar <ChevronRight size={12} /></span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

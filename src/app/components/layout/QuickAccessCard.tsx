// ============================================================
// AXON v4.4 — QuickAccessCard (Shared Component — BLOQUEADO)
// ============================================================
// Los cards de acceso rapido ("Resumos", "Flashcards", "Quiz", etc.)
//
// Uso:
//   <QuickAccessCard
//     icon={BookOpen}
//     title="Resumos"
//     subtitle="Acessar resumos"
//     onClick={() => navigate('/study/learn')}
//   />
// ============================================================

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface QuickAccessCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconColor?: string;       // tailwind text color, e.g. "text-teal-500"
  iconBg?: string;          // tailwind bg color, e.g. "bg-teal-50"
  onClick?: () => void;
}

export default function QuickAccessCard({
  icon: Icon, title, subtitle, iconColor = 'text-teal-500',
  iconBg = 'bg-teal-50', onClick,
}: QuickAccessCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-[--axon-card-bg] border border-[--axon-card-border] rounded-2xl p-4 text-left hover:shadow-md hover:border-gray-300 transition-all group flex flex-col w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        <ArrowRight size={16} className="text-gray-300 group-hover:text-[--axon-teal] group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-sm font-bold text-[--axon-text-primary]">{title}</p>
      <p className="text-xs text-[--axon-text-muted] mt-0.5">{subtitle}</p>
    </button>
  );
}

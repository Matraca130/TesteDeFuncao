// ============================================================
// AXON v4.4 — PageHeader (Shared Component — BLOQUEADO)
// ============================================================
// Cada pagina debe comenzar con este componente.
// Mantiene consistencia visual en todo el app.
//
// Uso:
//   <PageHeader
//     title="Bem-vindo, Dr. Reed"
//     subtitle="'A excelencia nao e um ato, mas um habito' — Aristoteles"
//   />
// ============================================================

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;  // acciones o filtros a la derecha
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-[--axon-text-primary] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[--axon-text-muted] mt-1 italic">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

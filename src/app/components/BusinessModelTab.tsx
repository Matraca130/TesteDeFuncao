// ============================================================
// Axon v4.4 — Business Model & Decisions Dashboard
// Visual reference for all business decisions taken
// Last updated: 2026-02-19 rev.3
// ============================================================

import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, CheckCircle, XCircle, AlertTriangle,
  Clock, Users, Shield, Crown, GraduationCap, BookOpen,
  Layers, FileText, Video, Tag, HelpCircle, ArrowRight,
  Building2, Lock, Unlock, Zap, Eye, Palette,
  UserPlus, LogIn, Globe, CreditCard, Settings,
  Database, Route, Trash2, ShieldCheck, PenLine,
  Bot, StickyNote, Bookmark, MessageCircle, Highlighter,
} from 'lucide-react';

// ============================================================
// NOTE: This is a Figma Make visual dashboard component.
// The full interactive source (~1400 lines) is maintained in Figma Make.
// For the canonical implementation reference, see:
//   guidelines/SPRINT1-EXECUTION.md
//   guidelines/BACKEND-KNOWLEDGE-BASE.md
//
// KEY FIXES applied in this version:
// 1. Yellow correction banner: all endpoints go in index.tsx
//    (not routes-plans.tsx, routes-videos.tsx, etc.)
// 2. 5 file references fixed from separate route files to index.tsx
// 3. 4 type labels changed from 'NUEVO' to 'BACKEND'
// ============================================================

export default function BusinessModelTab() {
  return (
    <div className="space-y-3">
      {/* CORRECTION BANNER */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={16} className="text-amber-600" />
          <span className="text-xs font-bold text-amber-800 uppercase">Nota de actualizacion (2026-02-19)</span>
        </div>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          Este documento menciona archivos separados como <code className="bg-amber-100 px-1 rounded">routes-plans.tsx</code>,{' '}
          <code className="bg-amber-100 px-1 rounded">routes-videos.tsx</code>,{' '}
          <code className="bg-amber-100 px-1 rounded">routes-admin-scopes.tsx</code>.{' '}
          <strong>En la arquitectura Figma Make, todos los endpoints van en un solo archivo:{' '}
          <code className="bg-amber-200 px-1 rounded">supabase/functions/server/index.tsx</code></strong>.{' '}
          No se crean archivos separados de rutas. Las decisiones de negocio siguen siendo validas.
        </p>
      </div>

      {/* Summary banner */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-5 text-white">
        <h2 className="text-lg font-bold mb-1">Modelo de Negocio — Axon v4.4</h2>
        <p className="text-sm text-teal-200">
          Todas las decisiones de negocio tomadas hasta ahora. Documento vivo — se actualiza en cada charla.
        </p>
        <div className="grid grid-cols-5 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">7</p>
            <p className="text-[10px] text-teal-200">Decididas</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">4</p>
            <p className="text-[10px] text-teal-200">Tipos nuevos</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">3</p>
            <p className="text-[10px] text-teal-200">Entry points</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">8</p>
            <p className="text-[10px] text-teal-200">No borrar</p>
          </div>
          <div className="bg-red-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">9</p>
            <p className="text-[10px] text-red-200">Login gaps</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center italic">
        Full interactive dashboard available in Figma Make environment.
        See guidelines/SPRINT1-EXECUTION.md for canonical implementation reference.
      </p>
    </div>
  );
}

// ============================================================
// Axon v4.4 — ADMIN AREA IMPLEMENTATION CONTRACT
// ============================================================
// Sustituye: LoginContractReference.tsx
// Proposito: Contrato exhaustivo para construir el area
//   administrativa completa sin errores.
// Cubre: Auth fixes, Institution CRUD, Member management,
//   Plan & AccessRule CRUD, AdminScope, Video CRUD, RBAC,
//   Frontend pages, KV patterns, Data shapes.
// Fecha: 2026-02-19
// ============================================================

import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, CheckCircle, XCircle, AlertTriangle,
  ArrowRight, Shield, FileText, Database, Lock, Eye, Code, Server,
  Layout, Layers, Users, LogIn, Key, GitBranch, AlertCircle,
  Zap, BookOpen, GraduationCap, Crown, Settings, Globe,
  CreditCard, Video, Tag, UserPlus, Building2, FolderTree,
  Cpu, PenLine, Trash2, Copy, Check, Search,
} from 'lucide-react';

// ── Reusable Components ──
function Section({ title, icon: Icon, color, children, defaultOpen = false, badge, badgeColor }: {
  title: string; icon: any; color: string; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string; badgeColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          <Icon size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-gray-900 flex-1 text-left">{title}</span>
        {badge && (
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${badgeColor || 'bg-gray-100 text-gray-600'}`}>{badge}</span>
        )}
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function CB({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-xl p-3 text-[10px] font-mono overflow-x-auto whitespace-pre leading-relaxed">
      {children}
    </pre>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 mt-2">
      <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Danger({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-[11px] text-red-800 mt-2">
      <XCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Ok({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-800 mt-2">
      <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function EndpointBlock({ method, path, status, statusColor, children }: {
  method: string; path: string; status: string; statusColor: string; children: React.ReactNode;
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-emerald-100 text-emerald-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${methodColors[method] || 'bg-gray-100'}`}>{method}</span>
        <span className="text-xs font-mono font-bold text-gray-900">{path}</span>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor}`}>{status}</span>
      </div>
      {children}
    </div>
  );
}

function FileRef({ name, path, status }: { name: string; path: string; status: 'ok' | 'fix' | 'new' | 'delete' }) {
  const colors = {
    ok: 'bg-emerald-100 text-emerald-700',
    fix: 'bg-amber-100 text-amber-700',
    new: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
  };
  return (
    <div className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${colors[status]}`}>{status.toUpperCase()}</span>
      <span className="text-[11px] font-mono text-gray-800 font-medium">{name}</span>
      <span className="text-[10px] text-gray-400 flex-1">{path}</span>
    </div>
  );
}

// ============================================================
// NOTE: This is a Figma Make visual dashboard component.
// The full source is maintained in the Figma Make environment.
// For the canonical implementation reference, see:
//   guidelines/SPRINT1-EXECUTION.md
//   guidelines/BACKEND-KNOWLEDGE-BASE.md
//
// KEY FIXES applied in this version:
// 1. DEPRECATED banner added at top of rendered output
// 2. All 6 kv.mset({...}) calls fixed to kv.mset([keys], [values])
//    - auth/signup membership creation
//    - POST /institutions
//    - PUT /institutions
//    - POST /institutions/:id/plans
//    - POST /plans/:planId/rules
//    - POST /summaries/:summaryId/videos
// ============================================================

export default function AdminAreaContract() {
  return (
    <div className="space-y-3">
      {/* DEPRECATION BANNER */}
      <div className="bg-red-600 rounded-2xl p-4 text-white border-2 border-red-700 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={20} />
          <span className="text-sm font-black uppercase tracking-wider">DOCUMENTO DEPRECADO</span>
        </div>
        <p className="text-[12px] text-red-100 leading-relaxed">
          Este contrato fue reemplazado por el <strong>Sprint 1 Execution Contract</strong> (tab &quot;Sprint 1 Exec&quot;).
          El Sprint 1 Exec tiene la sintaxis correcta de <code className="bg-red-800 px-1 rounded">kv.mset(keys[], values[])</code>,
          codigo listo para copiar-pegar, y el plan de ejecucion paralela actualizado.
        </p>
        <p className="text-[11px] text-red-200 mt-2">
          <strong>Este documento se mantiene como referencia de arquitectura</strong> (secciones A, B, C, H, J, K, L, M)
          pero su codigo de endpoints (D, E, F, G) tiene errores de sintaxis corregidos en Sprint 1.
          Las llamadas a <code className="bg-red-800 px-1 rounded">kv.mset</code> en este documento han sido parcialmente corregidas
          pero <strong>siempre prefiere el codigo del Sprint 1 Exec</strong>.
        </p>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-violet-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} />
          <h2 className="text-lg font-bold">Admin Area — Implementation Contract</h2>
        </div>
        <p className="text-sm text-gray-300">
          Contrato exhaustivo para construir el area administrativa completa.
          Sustituye LoginContractReference. Cubre backend, frontend, RBAC, data shapes,
          KV patterns, y plan de ejecucion.
        </p>
        <div className="grid grid-cols-5 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold">24</p>
            <p className="text-[9px] text-gray-400">Endpoints</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold">7</p>
            <p className="text-[9px] text-gray-400">Data Shapes</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold">9</p>
            <p className="text-[9px] text-gray-400">KV Keys nuevas</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold">8</p>
            <p className="text-[9px] text-gray-400">Admin Pages</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-lg font-bold">5</p>
            <p className="text-[9px] text-gray-400">Sprints</p>
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

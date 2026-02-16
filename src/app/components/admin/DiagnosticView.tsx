import React, { useState, useEffect } from 'react';
import { Loader2, Database, RefreshCw, CheckCircle2, XCircle, FolderTree, ClipboardCheck, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { headingStyle } from '@/app/design-system';
import { AxonPageHeader } from '@/app/components/shared/AxonPageHeader';
import { API_BASE, publicAnonKey } from './shared/admin-api';

interface DiagnosticData {
  summary: {
    curriculumCount: number;
    quizIndexCount: number;
    quizTopicCount: number;
    flashcardIndexCount: number;
    flashcardTopicCount: number;
  };
  curriculum: any[];
  quizIndexes: any[];
  quizzes: any[];
  flashcardIndexes: any[];
  flashcards: any[];
}

export function DiagnosticView() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['curriculum', 'quizzes', 'flashcards']));

  const fetchDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/diagnostic`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      console.error('[Diagnostic] Error:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDiagnostic(); }, []);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-dashboard">
      <AxonPageHeader
        title="Diagnostico KV Store"
        subtitle="Dados salvos no Supabase"
        statsLeft={<p className="text-gray-500 text-sm">Verificando curriculum, quizzes e flashcards persistidos</p>}
        actionButton={
          <button onClick={fetchDiagnostic} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-sm text-white text-sm font-semibold disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        }
      />

      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6 pb-12">
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500">Consultando KV Store...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-3">
            <XCircle size={20} className="text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-rose-800">Erro ao carregar diagnostico</p>
              <p className="text-sm text-rose-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-3 gap-4">
              <SummaryCard
                icon={<FolderTree size={20} className="text-amber-600" />}
                label="Curriculum Structures"
                count={data.summary.curriculumCount}
                color="amber"
              />
              <SummaryCard
                icon={<ClipboardCheck size={20} className="text-violet-600" />}
                label="Quiz Topics Salvos"
                count={data.summary.quizTopicCount}
                color="violet"
                subtext={data.summary.quizIndexCount > 0 ? `${data.summary.quizIndexCount} indice(s)` : undefined}
              />
              <SummaryCard
                icon={<Layers size={20} className="text-teal-600" />}
                label="Flashcard Topics Salvos"
                count={data.summary.flashcardTopicCount}
                color="teal"
                subtext={data.summary.flashcardIndexCount > 0 ? `${data.summary.flashcardIndexCount} indice(s)` : undefined}
              />
            </div>

            {/* ── Curriculum Section ── */}
            <CollapsibleSection
              id="curriculum"
              title="Curriculum Structures"
              icon={<FolderTree size={18} className="text-amber-600" />}
              count={data.curriculum.length}
              color="amber"
              isExpanded={expandedSections.has('curriculum')}
              onToggle={() => toggleSection('curriculum')}
            >
              {data.curriculum.length === 0 ? (
                <EmptyBadge text="Nenhuma estrutura curricular personalizada salva. Usando dados estaticos de courses.ts." />
              ) : (
                data.curriculum.map((item: any, i: number) => (
                  <CurriculumDetail key={i} item={item} />
                ))
              )}
            </CollapsibleSection>

            {/* ── Quizzes Section ── */}
            <CollapsibleSection
              id="quizzes"
              title="Quizzes Salvos"
              icon={<ClipboardCheck size={18} className="text-violet-600" />}
              count={data.quizzes.length}
              color="violet"
              isExpanded={expandedSections.has('quizzes')}
              onToggle={() => toggleSection('quizzes')}
            >
              {data.quizzes.length === 0 ? (
                <EmptyBadge text="Nenhum quiz salvo no KV Store. Todos os quizzes vem dos dados estaticos em courses.ts." />
              ) : (
                <div className="space-y-2">
                  {data.quizzes.map((q: any, i: number) => (
                    <DataRow key={i} color="violet" items={[
                      { label: 'Key', value: q.key },
                      { label: 'Topico', value: q.topicTitle || q.topicId },
                      { label: 'Secao', value: q.sectionTitle },
                      { label: 'Semestre', value: q.semesterTitle },
                      { label: 'Questoes', value: String(q.questionCount), highlight: true },
                      { label: 'Salvo em', value: q.updatedAt ? new Date(q.updatedAt).toLocaleString('pt-BR') : '\u2014' },
                    ]} />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* ── Flashcards Section ── */}
            <CollapsibleSection
              id="flashcards"
              title="Flashcards Salvos"
              icon={<Layers size={18} className="text-teal-600" />}
              count={data.flashcards.length}
              color="teal"
              isExpanded={expandedSections.has('flashcards')}
              onToggle={() => toggleSection('flashcards')}
            >
              {data.flashcards.length === 0 ? (
                <EmptyBadge text="Nenhum flashcard salvo no KV Store. Todos os flashcards vem dos dados estaticos em courses.ts." />
              ) : (
                <div className="space-y-2">
                  {data.flashcards.map((f: any, i: number) => (
                    <DataRow key={i} color="teal" items={[
                      { label: 'Key', value: f.key },
                      { label: 'Topico', value: f.topicTitle || f.topicId },
                      { label: 'Secao', value: f.sectionTitle },
                      { label: 'Semestre', value: f.semesterTitle },
                      { label: 'Flashcards', value: String(f.flashcardCount), highlight: true },
                      { label: 'Salvo em', value: f.updatedAt ? new Date(f.updatedAt).toLocaleString('pt-BR') : '\u2014' },
                    ]} />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* ── Quiz Indexes ── */}
            {data.quizIndexes.length > 0 && (
              <CollapsibleSection
                id="quiz-indexes"
                title="Quiz Indexes (raw)"
                icon={<Database size={18} className="text-gray-500" />}
                count={data.quizIndexes.length}
                color="gray"
                isExpanded={expandedSections.has('quiz-indexes')}
                onToggle={() => toggleSection('quiz-indexes')}
              >
                <pre className="text-[11px] text-gray-600 bg-gray-50 rounded-xl p-4 overflow-x-auto max-h-60 border border-gray-200">
                  {JSON.stringify(data.quizIndexes, null, 2)}
                </pre>
              </CollapsibleSection>
            )}

            {/* ── Flashcard Indexes ── */}
            {data.flashcardIndexes.length > 0 && (
              <CollapsibleSection
                id="flashcard-indexes"
                title="Flashcard Indexes (raw)"
                icon={<Database size={18} className="text-gray-500" />}
                count={data.flashcardIndexes.length}
                color="gray"
                isExpanded={expandedSections.has('flashcard-indexes')}
                onToggle={() => toggleSection('flashcard-indexes')}
              >
                <pre className="text-[11px] text-gray-600 bg-gray-50 rounded-xl p-4 overflow-x-auto max-h-60 border border-gray-200">
                  {JSON.stringify(data.flashcardIndexes, null, 2)}
                </pre>
              </CollapsibleSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ──

function SummaryCard({ icon, label, count, color, subtext }: {
  icon: React.ReactNode; label: string; count: number; color: string; subtext?: string;
}) {
  const hasData = count > 0;
  return (
    <div className={clsx(
      "rounded-2xl border p-5 flex items-center gap-4",
      hasData ? `bg-${color}-50/50 border-${color}-200` : "bg-gray-50 border-gray-200"
    )}>
      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center",
        hasData ? `bg-${color}-100` : "bg-gray-100"
      )}>
        {icon}
      </div>
      <div>
        <p className={clsx("text-2xl font-bold", hasData ? `text-${color}-700` : "text-gray-400")}>{count}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {subtext && <p className="text-[10px] text-gray-400">{subtext}</p>}
      </div>
      <div className="ml-auto">
        {hasData ? (
          <CheckCircle2 size={20} className={`text-${color}-500`} />
        ) : (
          <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full">Vazio</span>
        )}
      </div>
    </div>
  );
}

function CollapsibleSection({ id, title, icon, count, color, isExpanded, onToggle, children }: {
  id: string; title: string; icon: React.ReactNode; count: number; color: string;
  isExpanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900" style={headingStyle}>{title}</h3>
          <p className="text-xs text-gray-400">{count} registro(s)</p>
        </div>
        <ChevronDown size={16} className={clsx("text-gray-400 transition-transform", isExpanded && "rotate-180")} />
      </button>
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

function EmptyBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
      <Database size={16} className="text-gray-300 shrink-0" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

function DataRow({ color, items }: { color: string; items: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <div className={clsx("rounded-xl border px-4 py-3", `border-${color}-100 bg-${color}-50/30`)}>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{item.label}:</span>
            <span className={clsx(
              "text-xs font-medium",
              item.highlight ? `text-${color}-700 font-bold` : "text-gray-700"
            )}>{item.value || '\u2014'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurriculumDetail({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const val = item.value || item;
  const semesters = val.semesters || [];

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden mb-2">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors text-left">
        <FolderTree size={16} className="text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{val.courseName || val.courseId || item.key}</p>
          <p className="text-[10px] text-gray-400">
            Key: <code className="bg-white/60 px-1 rounded">{item.key}</code>
            {' \u00b7 '}{semesters.length} semestre(s)
            {val.updatedAt && ` \u00b7 Salvo: ${new Date(val.updatedAt).toLocaleString('pt-BR')}`}
          </p>
        </div>
        <ChevronRight size={14} className={clsx("text-gray-400 transition-transform", expanded && "rotate-90")} />
      </button>
      {expanded && (
        <div className="border-t border-amber-200 px-4 py-3 bg-white/50 space-y-3">
          {semesters.map((sem: any, si: number) => (
            <div key={si}>
              <p className="text-xs font-bold text-gray-700 mb-1 pl-2 border-l-2 border-amber-400">{sem.title}</p>
              {(sem.sections || []).map((sec: any, sci: number) => (
                <div key={sci} className="ml-4 mb-2">
                  <p className="text-[11px] font-semibold text-gray-600">{sec.title}</p>
                  <div className="ml-3 flex flex-wrap gap-1 mt-0.5">
                    {(sec.topics || []).map((t: any, ti: number) => (
                      <span key={ti} className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                        {t.title}
                      </span>
                    ))}
                    {(sec.topics || []).length === 0 && (
                      <span className="text-[10px] text-gray-400 italic">Sem topicos</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
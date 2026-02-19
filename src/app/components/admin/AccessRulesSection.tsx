// ============================================================
// Axon v4.4 — AccessRulesSection (Extracted from PlanManagement)
// Agent 5: FORGE
//
// Self-contained component that manages access rules for a plan.
// Has its own data fetching (plan rules + scope options),
// its own CRUD operations, and its own form state.
// ============================================================

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  getPlanRules,
  createPlanRule,
  deletePlanRule,
  getScopeOptions,
} from '../../lib/api-client';
import { CURRENT_INST_ID } from '../../lib/admin-constants';
import type {
  PlanAccessRule,
  ScopeOption,
  ScopeType,
  ContentType,
} from '../../../types/auth';

// ── Constants ────────────────────────────────

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'summaries', label: 'Resumos' },
  { value: 'flashcards', label: 'Flashcards' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'videos', label: 'Videos' },
  { value: 'ai_chat', label: 'AI Chat' },
];

// ── Component ────────────────────────────────

interface AccessRulesSectionProps {
  planId: string;
}

export function AccessRulesSection({ planId }: AccessRulesSectionProps) {
  const [rules, setRules] = useState<PlanAccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingRule, setAddingRule] = useState(false);
  const [scopeOptions, setScopeOptions] = useState<ScopeOption[]>([]);
  const [newRule, setNewRule] = useState({
    scope_type: '' as ScopeType | '',
    scope_id: '',
    content_types: [] as ContentType[],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [rulesData, scopes] = await Promise.all([
          getPlanRules(planId),
          getScopeOptions(CURRENT_INST_ID),
        ]);
        setRules(rulesData);
        setScopeOptions(scopes);
      } catch {
        toast.error('Erro ao carregar regras');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [planId]);

  const filteredScopes = scopeOptions.filter(
    (s) => !newRule.scope_type || s.type === newRule.scope_type
  );

  const handleAddRule = async () => {
    if (!newRule.scope_type || !newRule.scope_id || newRule.content_types.length === 0) {
      toast.error('Preencha todos os campos da regra');
      return;
    }
    try {
      const created = await createPlanRule(planId, {
        scope_type: newRule.scope_type as ScopeType,
        scope_id: newRule.scope_id,
        content_types: newRule.content_types,
      });
      setRules((prev) => [...prev, created]);
      setNewRule({ scope_type: '', scope_id: '', content_types: [] });
      setAddingRule(false);
      toast.success('Regra adicionada');
    } catch (e: any) {
      toast.error('Erro ao adicionar regra', { description: e?.message });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deletePlanRule(planId, ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success('Regra removida');
    } catch (e: any) {
      toast.error('Erro ao remover regra', { description: e?.message });
    }
  };

  const toggleContentType = (ct: ContentType) => {
    setNewRule((prev) => ({
      ...prev,
      content_types: prev.content_types.includes(ct)
        ? prev.content_types.filter((t) => t !== ct)
        : [...prev.content_types, ct],
    }));
  };

  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {rules.length === 0 && !addingRule && (
        <p className="text-xs text-zinc-400 italic">Nenhuma regra de acesso definida.</p>
      )}

      {rules.map((rule) => (
        <div
          key={rule.id}
          className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="bg-violet-50 text-violet-600 border-violet-200 text-xs">
                {rule.scope_type}
              </Badge>
              <span className="text-xs text-zinc-700 truncate">{rule.scope_name || rule.scope_id}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {rule.content_types.map((ct) => (
                <Badge key={ct} variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                  {ct}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-red-400 hover:text-red-600 shrink-0"
            onClick={() => handleDeleteRule(rule.id)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ))}

      {addingRule ? (
        <div className="space-y-3 rounded-lg border border-teal-200 bg-teal-50/50 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select
              value={newRule.scope_type}
              onValueChange={(v) =>
                setNewRule((prev) => ({ ...prev, scope_type: v as ScopeType, scope_id: '' }))
              }
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Tipo de escopo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Curso</SelectItem>
                <SelectItem value="semester">Semestre</SelectItem>
                <SelectItem value="section">Secao</SelectItem>
                <SelectItem value="topic">Topico</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={newRule.scope_id}
              onValueChange={(v) => setNewRule((prev) => ({ ...prev, scope_id: v }))}
              disabled={!newRule.scope_type}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Selecionar escopo" />
              </SelectTrigger>
              <SelectContent>
                {filteredScopes.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500">Tipos de conteudo:</p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((ct) => (
                <label
                  key={ct.value}
                  className="flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Checkbox
                    checked={newRule.content_types.includes(ct.value)}
                    onCheckedChange={() => toggleContentType(ct.value)}
                    className="size-3.5"
                  />
                  {ct.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddRule} className="bg-teal-500 hover:bg-teal-600 text-white">
              <Plus className="size-3 mr-1" />
              Adicionar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingRule(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAddingRule(true)}
          className="w-full text-teal-600 hover:text-teal-700 hover:bg-teal-50"
        >
          <Plus className="size-3 mr-1" />
          Adicionar Regra
        </Button>
      )}
    </div>
  );
}

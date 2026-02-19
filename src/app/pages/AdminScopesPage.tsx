// Axon v4.4 — Admin Scopes Page (A5-04)
// Agent 5: FORGE — Admin scopes management
// 3-Layer: [Component] → useAdminScopes → api-client
// SIGNAL: ADMIN_UI_CONNECTED

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Shield, Plus, Trash2, Loader2, AlertCircle, UserCircle, ShieldOff, Eye, Pencil, Trash, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../components/ui/utils';
import { ErrorState } from '../components/admin/ErrorState';
import { useAdminScopes } from '../hooks/useAdminScopes';
import { CURRENT_INST_ID } from '../lib/admin-constants';
import { getInitials } from '../lib/admin-helpers';
import { headingStyle } from '../lib/design-tokens';
import type { MembershipFull, AdminScope, ScopeOption, ScopeType, Permission } from '../../types/auth';

const PERMISSION_CONFIG: Record<Permission, { label: string; icon: React.ReactNode; className: string }> = {
  read:    { label: 'Leitura',   icon: <Eye className="size-3" />,         className: 'bg-blue-100 text-blue-700 border-blue-200' },
  write:   { label: 'Escrita',   icon: <Pencil className="size-3" />,      className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  delete:  { label: 'Exclusao',  icon: <Trash className="size-3" />,       className: 'bg-red-100 text-red-700 border-red-200' },
  approve: { label: 'Aprovacao', icon: <CheckSquare className="size-3" />, className: 'bg-amber-100 text-amber-700 border-amber-200' },
};
const SCOPE_TYPE_CONFIG: Record<ScopeType, { label: string; className: string }> = {
  course:   { label: 'Curso',    className: 'bg-violet-100 text-violet-700 border-violet-200' },
  semester: { label: 'Semestre',  className: 'bg-blue-100 text-blue-700 border-blue-200' },
  section:  { label: 'Secao',    className: 'bg-teal-100 text-teal-700 border-teal-200' },
  topic:    { label: 'Topico',   className: 'bg-amber-100 text-amber-700 border-amber-200' },
  summary:  { label: 'Resumo',   className: 'bg-pink-100 text-pink-700 border-pink-200' },
};

export function AdminScopesPage() {
  const { scopes, eligibleMembers, scopeOptions, loading, error, reload, createScope, removeScope } = useAdminScopes(CURRENT_INST_ID);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteScopeDialog, setDeleteScopeDialog] = useState<AdminScope | null>(null);

  React.useEffect(() => {
    if (eligibleMembers.length > 0 && !selectedMemberId) setSelectedMemberId(eligibleMembers[0].id);
  }, [eligibleMembers, selectedMemberId]);

  const selectedMember = useMemo(() => eligibleMembers.find((m) => m.id === selectedMemberId), [eligibleMembers, selectedMemberId]);
  const memberScopes = useMemo(() => scopes.filter((s) => s.member_id === selectedMemberId), [scopes, selectedMemberId]);

  const handleDeleteScope = async () => {
    if (!deleteScopeDialog) return;
    try { await removeScope(deleteScopeDialog.id); toast.success('Escopo removido'); }
    catch (e: any) { toast.error('Erro ao remover escopo', { description: e?.message }); }
    setDeleteScopeDialog(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={headingStyle} className="text-zinc-900">Permissoes e Alcances</h1>
          <p className="text-sm text-zinc-500 mt-1">Defina o que cada admin ou professor pode ver e fazer.</p>
        </div>
        <Button onClick={() => setAssignDialogOpen(true)} className="bg-teal-500 hover:bg-teal-600 text-white" disabled={eligibleMembers.length === 0}>
          <Plus className="size-4 mr-1" /> Atribuir Escopo
        </Button>
      </div>

      {loading ? <ScopesLoadingSkeleton /> : error ? <ErrorState message={error} onRetry={reload} /> : eligibleMembers.length === 0 ? <NoEligibleMembers /> : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <Card className="h-fit">
            <CardHeader className="pb-3"><CardTitle className="text-sm" style={headingStyle}>Membros Elegiveis</CardTitle></CardHeader>
            <CardContent className="space-y-1 pt-0">
              {eligibleMembers.map((member) => {
                const memberScopeCount = scopes.filter((s) => s.member_id === member.id).length;
                return (
                  <button key={member.id} onClick={() => setSelectedMemberId(member.id)}
                    className={cn('flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-colors', selectedMemberId === member.id ? 'bg-teal-50 border border-teal-200' : 'hover:bg-zinc-50')}>
                    <Avatar className="size-8 shrink-0"><AvatarFallback className="bg-teal-100 text-teal-700 text-xs">{getInitials(member.name, member.email)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-800 truncate">{member.name || member.email}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={cn('text-xs', member.role === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>{member.role}</Badge>
                        <span className="text-xs text-zinc-400">{memberScopeCount} escopo{memberScopeCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {selectedMember ? (
              <>
                <Card>
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="size-12 shrink-0"><AvatarFallback className="bg-teal-100 text-teal-700">{getInitials(selectedMember.name, selectedMember.email)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-900" style={headingStyle}>{selectedMember.name || '(sem nome)'}</p>
                      <p className="text-sm text-zinc-500">{selectedMember.email}</p>
                    </div>
                    <Badge variant="outline" className={cn(selectedMember.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>{selectedMember.role}</Badge>
                  </CardContent>
                </Card>
                {memberScopes.length === 0 ? (
                  <Card><CardContent className="flex flex-col items-center justify-center py-10">
                    <ShieldOff className="size-10 text-zinc-300 mb-3" />
                    <p className="text-zinc-600">Este membro nao tem permissoes atribuidas.</p>
                    <p className="text-sm text-zinc-400 mt-1">Sem escopos, o membro nao vera nenhum conteudo administrativo.</p>
                    <Button className="mt-4 bg-teal-500 hover:bg-teal-600 text-white" onClick={() => setAssignDialogOpen(true)}><Plus className="size-4 mr-1" /> Atribuir Primeiro Escopo</Button>
                  </CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {memberScopes.map((scope) => <ScopeCard key={scope.id} scope={scope} onDelete={() => setDeleteScopeDialog(scope)} />)}
                    <Button variant="outline" className="w-full text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-dashed" onClick={() => setAssignDialogOpen(true)}><Plus className="size-4 mr-1" /> Adicionar Mais Escopos</Button>
                  </div>
                )}
              </>
            ) : (
              <Card><CardContent className="flex flex-col items-center justify-center py-12"><UserCircle className="size-12 text-zinc-300 mb-3" /><p className="text-zinc-500">Selecione um membro para ver seus escopos.</p></CardContent></Card>
            )}
          </div>
        </div>
      )}

      <AssignScopeDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} members={eligibleMembers} scopeOptions={scopeOptions} preselectedMemberId={selectedMemberId} existingScopes={scopes}
        onCreated={async (data) => { const created = await createScope(data); toast.success('Escopo atribuido com sucesso'); return created; }} />

      <AlertDialog open={!!deleteScopeDialog} onOpenChange={(open) => !open && setDeleteScopeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remover Escopo</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza de que deseja remover o acesso de <strong>{deleteScopeDialog?.scope_name}</strong> para este membro?<br /><span className="text-red-600">Esta acao nao pode ser desfeita.</span></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteScope}>Remover</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScopeCard({ scope, onDelete }: { scope: AdminScope; onDelete: () => void; }) {
  const scopeConfig = SCOPE_TYPE_CONFIG[scope.scope_type];
  return (
    <Card className="border-zinc-200">
      <CardContent className="flex items-start gap-4 py-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 shrink-0"><Shield className="size-5 text-zinc-500" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', scopeConfig?.className)}>{scopeConfig?.label ?? scope.scope_type}</Badge>
            <span className="text-sm text-zinc-800">{scope.scope_name || scope.scope_id}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {scope.permissions.map((perm) => { const config = PERMISSION_CONFIG[perm]; return <Badge key={perm} variant="outline" className={cn('text-xs gap-1', config.className)}>{config.icon}{config.label}</Badge>; })}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-red-500 shrink-0" onClick={onDelete}><Trash2 className="size-4" /></Button>
      </CardContent>
    </Card>
  );
}

function AssignScopeDialog({ open, onOpenChange, members, scopeOptions, preselectedMemberId, existingScopes, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; members: MembershipFull[]; scopeOptions: ScopeOption[]; preselectedMemberId: string; existingScopes: AdminScope[]; onCreated: (data: Partial<AdminScope>) => Promise<AdminScope>; }) {
  const [memberId, setMemberId] = useState(preselectedMemberId || '');
  const [scopeType, setScopeType] = useState<ScopeType | ''>('');
  const [scopeId, setScopeId] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  React.useEffect(() => { if (open) { setMemberId(preselectedMemberId || ''); setScopeType(''); setScopeId(''); setPermissions([]); setValidationError(''); } }, [open, preselectedMemberId]);

  const filteredOptions = useMemo(() => (scopeType ? scopeOptions.filter((o) => o.type === scopeType) : []), [scopeOptions, scopeType]);
  const togglePermission = (perm: Permission) => { setPermissions((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]); };

  const handleSubmit = async () => {
    if (!memberId || !scopeType || !scopeId || permissions.length === 0) { setValidationError('Preencha todos os campos e selecione pelo menos uma permissao.'); return; }
    if (existingScopes.some((s) => s.member_id === memberId && s.scope_type === scopeType && s.scope_id === scopeId)) { setValidationError('Este escopo ja esta atribuido a este membro.'); return; }
    setSubmitting(true); setValidationError('');
    try { await onCreated({ member_id: memberId, scope_type: scopeType as ScopeType, scope_id: scopeId, permissions }); onOpenChange(false); }
    catch (e: any) { toast.error('Erro ao atribuir escopo', { description: e?.message }); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle style={headingStyle}>Atribuir Escopo</DialogTitle><DialogDescription>Defina o alcance e as permissoes para o membro selecionado.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Membro</Label>
            <Select value={memberId} onValueChange={setMemberId}><SelectTrigger><SelectValue placeholder="Selecionar membro" /></SelectTrigger>
              <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name || m.email} ({m.role})</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Tipo de Escopo</Label>
            <Select value={scopeType} onValueChange={(v) => { setScopeType(v as ScopeType); setScopeId(''); }}><SelectTrigger><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
              <SelectContent><SelectItem value="course">Curso</SelectItem><SelectItem value="semester">Semestre</SelectItem><SelectItem value="section">Secao</SelectItem><SelectItem value="topic">Topico</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Escopo</Label>
            <Select value={scopeId} onValueChange={setScopeId} disabled={!scopeType}><SelectTrigger><SelectValue placeholder={scopeType ? 'Selecionar escopo' : 'Escolha o tipo primeiro'} /></SelectTrigger>
              <SelectContent>{filteredOptions.map((opt) => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-3"><Label>Permissoes</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PERMISSION_CONFIG) as [Permission, typeof PERMISSION_CONFIG[Permission]][]).map(([perm, config]) => (
                <label key={perm} className={cn('flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all', permissions.includes(perm) ? 'border-teal-300 bg-teal-50' : 'border-zinc-200 hover:border-zinc-300')}>
                  <Checkbox checked={permissions.includes(perm)} onCheckedChange={() => togglePermission(perm)} />
                  <Badge variant="outline" className={cn('text-xs gap-1', config.className)}>{config.icon}{config.label}</Badge>
                </label>
              ))}
            </div>
          </div>
          {validationError && <div className="rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-sm text-red-700 flex items-center gap-2"><AlertCircle className="size-4 shrink-0" />{validationError}</p></div>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-500 hover:bg-teal-600 text-white">{submitting ? <Loader2 className="size-4 animate-spin" /> : <><Shield className="size-4 mr-1" /> Atribuir Escopo</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScopesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <Card><CardContent className="py-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-3"><Skeleton className="size-8 rounded-full" /><div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div></div>)}</CardContent></Card>
      <div className="space-y-3">{[1, 2].map((i) => <Card key={i}><CardContent className="py-4 space-y-3"><Skeleton className="h-5 w-48" /><div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" /></div></CardContent></Card>)}</div>
    </div>
  );
}

function NoEligibleMembers() {
  return (
    <Card><CardContent className="flex flex-col items-center justify-center py-12">
      <UserCircle className="size-12 text-zinc-300 mb-3" />
      <p className="text-zinc-600">Nenhum membro elegivel</p>
      <p className="text-sm text-zinc-400 mt-1 max-w-md text-center">Escopos podem ser atribuidos apenas a membros com rol de Admin ou Professor. Convide membros com esses rols na pagina de Membros.</p>
    </CardContent></Card>
  );
}

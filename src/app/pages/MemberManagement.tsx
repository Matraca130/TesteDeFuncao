// ═══════════════════════════════════════════════
// Axon v4.4 — Member Management (A5-02)
// Agent 5: FORGE — RBAC visual, invite, role change, suspend, remove
// 3-Layer: [Component] → useMembers → api-client
// ═══════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Users, UserPlus, Search, MoreHorizontal, ShieldCheck, UserX,
  Trash2, Loader2, Mail, AlertCircle, ArrowUpDown, UserCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../components/ui/utils';
import { RoleBadge } from '../components/admin/RoleBadge';
import { StatusBadge } from '../components/admin/StatusBadge';
import { ErrorState } from '../components/admin/ErrorState';
import { useMembers } from '../hooks/useMembers';
import { CURRENT_INST_ID, ROLE_CONFIG, ROLE_ORDER } from '../lib/admin-constants';
import { getInitials, relativeTime, isValidEmail } from '../lib/admin-helpers';
import { headingStyle } from '../lib/design-tokens';
import type { MembershipFull, MembershipRole } from '../../types/auth';

type SortField = 'name' | 'role' | 'created_at';
type SortDir = 'asc' | 'desc';

export function MemberManagement() {
  const { members, loading, error, reload, invite, updateRole, suspend, remove } = useMembers(CURRENT_INST_ID);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('role');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MembershipFull | null>(null);

  const filteredMembers = useMemo(() => {
    let result = members;
    if (filterRole !== 'all') result = result.filter((m) => m.role === filterRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => (m.name || '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = (a.name || a.email).localeCompare(b.name || b.email); break;
        case 'role': cmp = ROLE_ORDER[a.role] - ROLE_ORDER[b.role]; break;
        case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [members, filterRole, search, sortField, sortDir]);

  const stats = useMemo(() => {
    const byRole: Record<string, number> = {};
    members.forEach((m) => { byRole[m.role] = (byRole[m.role] || 0) + 1; });
    return { total: members.length, byRole };
  }, [members]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };
  const isOwner = (m: MembershipFull) => m.role === 'owner';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={headingStyle} className="text-zinc-900">Miembros</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie os membros da sua instituicao.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-teal-500 hover:bg-teal-600 text-white">
          <UserPlus className="size-4 mr-1" /> Convidar Membro
        </Button>
      </div>

      {!loading && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2">
            <Users className="size-4 text-zinc-400" />
            <span className="text-sm text-zinc-700">{stats.total} total</span>
          </div>
          {Object.entries(stats.byRole).map(([role, count]) => (
            <div key={role} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2">
              <RoleBadge role={role} />
              <span className="text-sm text-zinc-600">{count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou email..." className="pl-9" />
        </div>
        <Tabs value={filterRole} onValueChange={setFilterRole}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="owner">Owners</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
            <TabsTrigger value="professor">Professors</TabsTrigger>
            <TabsTrigger value="student">Students</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <MembersLoadingSkeleton />
      ) : error ? (
        <ErrorState title="Erro ao carregar membros" message={error} onRetry={reload} />
      ) : filteredMembers.length === 0 ? (
        <EmptyState hasFilter={search.length > 0 || filterRole !== 'all'} onInvite={() => setInviteOpen(true)} />
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-zinc-900">Membro <ArrowUpDown className="size-3" /></button></TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead><button onClick={() => toggleSort('role')} className="flex items-center gap-1 hover:text-zinc-900">Rol <ArrowUpDown className="size-3" /></button></TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead><button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-zinc-900">Ingresso <ArrowUpDown className="size-3" /></button></TableHead>
                    <TableHead className="w-12">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8"><AvatarFallback className="bg-teal-100 text-teal-700 text-xs">{getInitials(member.name, member.email)}</AvatarFallback></Avatar>
                          <span className="text-zinc-800">{member.name || '(sem nome)'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-500">{member.email}</TableCell>
                      <TableCell><RoleBadge role={member.role} /></TableCell>
                      <TableCell><StatusBadge status={member.status} /></TableCell>
                      <TableCell className="text-zinc-500 text-sm">{relativeTime(member.created_at)}</TableCell>
                      <TableCell>
                        <MemberActions member={member} isOwnerMember={isOwner(member)}
                          onChangeRole={() => { setSelectedMember(member); setRoleDialogOpen(true); }}
                          onSuspend={() => { setSelectedMember(member); setSuspendDialogOpen(true); }}
                          onRemove={() => { setSelectedMember(member); setRemoveDialogOpen(true); }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
          <div className="md:hidden space-y-3">
            {filteredMembers.map((member) => (
              <MemberCard key={member.id} member={member} isOwnerMember={isOwner(member)}
                onChangeRole={() => { setSelectedMember(member); setRoleDialogOpen(true); }}
                onSuspend={() => { setSelectedMember(member); setSuspendDialogOpen(true); }}
                onRemove={() => { setSelectedMember(member); setRemoveDialogOpen(true); }} />
            ))}
          </div>
        </>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen}
        onInvite={async (email, role) => {
          const member = await invite({ email, role });
          toast.success('Convite enviado!', { description: `Convite enviado para ${email}` });
          return member;
        }} />

      {selectedMember && (
        <ChangeRoleDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen} member={selectedMember}
          onConfirm={async (newRole) => {
            const updated = await updateRole(selectedMember.id, newRole);
            toast.success('Rol atualizado', { description: `${selectedMember.name || selectedMember.email} agora e ${ROLE_CONFIG[newRole].label}` });
            setSelectedMember(null);
            return updated;
          }} />
      )}

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender Membro</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza de que deseja suspender <strong>{selectedMember?.name || selectedMember?.email}</strong>? O membro perdera acesso temporariamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-amber-600 hover:bg-amber-700 text-white" onClick={async () => {
              if (!selectedMember) return;
              try { await suspend(selectedMember.id); toast.success('Membro suspenso'); } catch (e: any) { toast.error('Erro ao suspender', { description: e?.message }); }
              setSelectedMember(null);
            }}>Suspender</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza de que deseja remover <strong>{selectedMember?.name || selectedMember?.email}</strong>?<br /><span className="text-red-600">Esta acao nao pode ser desfeita.</span></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => {
              if (!selectedMember) return;
              try { await remove(selectedMember.id); toast.success('Membro removido'); } catch (e: any) { toast.error('Erro ao remover', { description: e?.message }); }
              setSelectedMember(null);
            }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MemberActions({ member, isOwnerMember, onChangeRole, onSuspend, onRemove }: { member: MembershipFull; isOwnerMember: boolean; onChangeRole: () => void; onSuspend: () => void; onRemove: () => void; }) {
  if (isOwnerMember) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center size-8 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"><MoreHorizontal className="size-4" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acoes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onChangeRole}><ShieldCheck className="size-4" /> Alterar Rol</DropdownMenuItem>
        {member.status !== 'suspended' && <DropdownMenuItem onClick={onSuspend}><UserX className="size-4" /> Suspender</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRemove}><Trash2 className="size-4" /> Remover</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MemberCard({ member, isOwnerMember, onChangeRole, onSuspend, onRemove }: { member: MembershipFull; isOwnerMember: boolean; onChangeRole: () => void; onSuspend: () => void; onRemove: () => void; }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-4">
        <Avatar className="size-10 shrink-0"><AvatarFallback className="bg-teal-100 text-teal-700 text-sm">{getInitials(member.name, member.email)}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-800 truncate">{member.name || '(sem nome)'}</p>
          <p className="text-sm text-zinc-500 truncate">{member.email}</p>
          <div className="flex items-center gap-2 mt-2"><RoleBadge role={member.role} /><StatusBadge status={member.status} /></div>
          <p className="text-xs text-zinc-400 mt-1">{relativeTime(member.created_at)}</p>
        </div>
        <MemberActions member={member} isOwnerMember={isOwnerMember} onChangeRole={onChangeRole} onSuspend={onSuspend} onRemove={onRemove} />
      </CardContent>
    </Card>
  );
}

function InviteDialog({ open, onOpenChange, onInvite }: { open: boolean; onOpenChange: (v: boolean) => void; onInvite: (email: string, role: Exclude<MembershipRole, 'owner'>) => Promise<MembershipFull>; }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<MembershipRole, 'owner'>>('student');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setEmailError('Email e obrigatorio'); return; }
    if (!isValidEmail(email)) { setEmailError('Email invalido'); return; }
    setSubmitting(true);
    try { await onInvite(email.trim(), role); setEmail(''); setRole('student'); onOpenChange(false); }
    catch (e: any) { toast.error('Erro ao convidar', { description: e?.message }); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle style={headingStyle}>Convidar Membro</DialogTitle><DialogDescription>Envie um convite por email para adicionar um novo membro a instituicao.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} placeholder="membro@exemplo.com" type="email" aria-invalid={!!emailError} />
            {emailError && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="size-3" /> {emailError}</p>}
          </div>
          <div className="space-y-2">
            <Label>Rol Inicial</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Exclude<MembershipRole, 'owner'>)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="professor">Professor</SelectItem><SelectItem value="student">Student</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-500 hover:bg-teal-600 text-white">
            {submitting ? <><Loader2 className="size-4 mr-1 animate-spin" /> Enviando...</> : <><Mail className="size-4 mr-1" /> Enviar Convite</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({ open, onOpenChange, member, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; member: MembershipFull; onConfirm: (newRole: Exclude<MembershipRole, 'owner'>) => Promise<MembershipFull>; }) {
  const [newRole, setNewRole] = useState<Exclude<MembershipRole, 'owner'>>(member.role === 'owner' ? 'admin' : (member.role as Exclude<MembershipRole, 'owner'>));
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    setSubmitting(true);
    try { await onConfirm(newRole); onOpenChange(false); } catch (e: any) { toast.error('Erro ao alterar rol', { description: e?.message }); } finally { setSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle style={headingStyle}>Alterar Rol</DialogTitle><DialogDescription>Alterar o rol de <strong>{member.name || member.email}</strong>.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <Avatar className="size-8"><AvatarFallback className="bg-teal-100 text-teal-700 text-xs">{getInitials(member.name, member.email)}</AvatarFallback></Avatar>
            <div><p className="text-sm text-zinc-800">{member.name || '(sem nome)'}</p><p className="text-xs text-zinc-500">{member.email}</p></div>
            <div className="ml-auto"><RoleBadge role={member.role} /></div>
          </div>
          <div className="space-y-2">
            <Label>Novo Rol</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as Exclude<MembershipRole, 'owner'>)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="professor">Professor</SelectItem><SelectItem value="student">Student</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || newRole === member.role} className="bg-teal-500 hover:bg-teal-600 text-white">{submitting ? <Loader2 className="size-4 animate-spin" /> : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MembersLoadingSkeleton() {
  return (
    <Card><CardContent className="py-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-60" /></div>
          <Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </CardContent></Card>
  );
}

function EmptyState({ hasFilter, onInvite }: { hasFilter: boolean; onInvite: () => void; }) {
  return (
    <Card><CardContent className="flex flex-col items-center justify-center py-12">
      <UserCircle className="size-12 text-zinc-300 mb-3" />
      {hasFilter ? (<><p className="text-zinc-600">Nenhum membro encontrado</p><p className="text-sm text-zinc-400 mt-1">Tente alterar os filtros de busca.</p></>) : (<><p className="text-zinc-600">Nenhum membro ainda</p><p className="text-sm text-zinc-400 mt-1">Convide o primeiro membro da sua instituicao.</p><Button className="mt-4 bg-teal-500 hover:bg-teal-600 text-white" onClick={onInvite}><UserPlus className="size-4 mr-1" /> Convidar Primeiro Membro</Button></>)}
    </CardContent></Card>
  );
}

// ═══════════════════════════════════════════════
// Axon v4.4 — Admin Student Management
// Admin area for managing students in an institution.
// Uses: api-admin-students.ts → routes-admin-students.tsx
// Pattern: same as MemberManagement.tsx
// ═══════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  GraduationCap,
  UserPlus,
  Search,
  MoreHorizontal,
  UserX,
  UserCheck,
  CreditCard,
  Loader2,
  Mail,
  AlertCircle,
  ArrowUpDown,
  UserCircle,
  TrendingUp,
  Clock,
  CalendarPlus,
  Eye,
  X,
  Flame,
  BookOpen,
  Brain,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../components/ui/utils';
import { headingStyle } from '../lib/design-tokens';
import { CURRENT_INST_ID } from '../lib/admin-constants';
import { getInitials, relativeTime, isValidEmail } from '../lib/admin-helpers';
import {
  listStudents,
  getStudentStats,
  getStudentDetail,
  toggleStudentStatus,
  inviteStudent,
  type AdminStudent,
  type StudentStats,
  type StudentDetail,
  type ListStudentsFilters,
} from '../lib/api-admin-students';

type SortField = 'name' | 'created_at';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

export function AdminStudentManagement() {
  // ── State ──
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Dialogs
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const instId = CURRENT_INST_ID;

  // ── Load data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ListStudentsFilters = {};
      if (statusFilter === 'active') filters.is_active = true;
      if (statusFilter === 'inactive') filters.is_active = false;

      const [studentsData, statsData] = await Promise.all([
        listStudents(instId, filters),
        getStudentStats(instId),
      ]);
      setStudents(studentsData);
      setStats(statsData);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar estudantes');
      console.error('[AdminStudents] loadData error:', e);
    } finally {
      setLoading(false);
    }
  }, [instId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtered & sorted ──
  const filteredStudents = useMemo(() => {
    let result = students;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = (a.name || a.email || '').localeCompare(b.name || b.email || '');
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [students, search, sortField, sortDir]);

  // ── Actions ──
  const handleToggleStatus = async (student: AdminStudent) => {
    const newStatus = !student.is_active;
    try {
      await toggleStudentStatus(student.user_id, instId, newStatus);
      toast.success(
        newStatus ? 'Estudante ativado' : 'Estudante desativado',
        { description: student.name || student.email || '' }
      );
      loadData();
    } catch (e: any) {
      toast.error('Erro ao alterar status', { description: e?.message });
    }
  };

  const handleViewDetail = async (student: AdminStudent) => {
    setSelectedStudent(student);
    setDetailOpen(true);
    setDetailLoading(true);
    setStudentDetail(null);
    try {
      const detail = await getStudentDetail(student.user_id, instId);
      setStudentDetail(detail);
    } catch (e: any) {
      console.error('[AdminStudents] detail error:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleInvite = async (email: string, name?: string) => {
    const result = await inviteStudent({
      institution_id: instId,
      email,
      name,
    });
    toast.success('Estudante convidado!', {
      description: `Convite enviado para ${email}`,
    });
    loadData();
    return result;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ── Render ──
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={headingStyle} className="text-zinc-900">
            Estudiantes
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gerencie os estudantes da sua instituicao.
          </p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-teal-500 hover:bg-teal-600 text-white"
        >
          <UserPlus className="size-4 mr-1" /> Convidar Estudante
        </Button>
      </div>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard
            title="Total"
            value={stats.total_students}
            icon={<GraduationCap className="size-5 text-teal-500" />}
          />
          <StatsCard
            title="Ativos"
            value={stats.active_students}
            icon={<UserCheck className="size-5 text-emerald-500" />}
          />
          <StatsCard
            title="Novos (mes)"
            value={stats.new_this_month}
            icon={<CalendarPlus className="size-5 text-blue-500" />}
          />
          <StatsCard
            title="Novos (semana)"
            value={stats.new_this_week}
            icon={<TrendingUp className="size-5 text-violet-500" />}
          />
        </div>
      )}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <Skeleton className="size-10 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-9"
          />
        </div>
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="inactive">Inativos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-red-300 mb-3" />
            <p className="text-zinc-600">{error}</p>
            <Button
              className="mt-4 bg-teal-500 hover:bg-teal-600 text-white"
              onClick={loadData}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          hasFilter={search.length > 0 || statusFilter !== 'all'}
          onInvite={() => setInviteOpen(true)}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => toggleSort('name')}
                        className="flex items-center gap-1 hover:text-zinc-900"
                      >
                        Estudante <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>
                      <button
                        onClick={() => toggleSort('created_at')}
                        className="flex items-center gap-1 hover:text-zinc-900"
                      >
                        Ingresso <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-12">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.membership_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                              {getInitials(student.name || undefined, student.email || undefined)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-zinc-800">
                            {student.name || '(sem nome)'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {student.email}
                      </TableCell>
                      <TableCell>
                        {student.plan ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            <CreditCard className="size-3" />
                            {student.plan.name}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">Sem plano</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                            student.is_active
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          )}
                        >
                          {student.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm">
                        {relativeTime(student.created_at)}
                      </TableCell>
                      <TableCell>
                        <StudentActions
                          student={student}
                          onView={() => handleViewDetail(student)}
                          onToggleStatus={() => handleToggleStatus(student)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.membership_id}
                student={student}
                onView={() => handleViewDetail(student)}
                onToggleStatus={() => handleToggleStatus(student)}
              />
            ))}
          </div>
        </>
      )}

      {/* Invite Dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
      />

      {/* Detail Dialog */}
      <StudentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        student={selectedStudent}
        detail={studentDetail}
        loading={detailLoading}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 shrink-0">
          {icon}
        </div>
        <div>
          <p
            className="text-zinc-900"
            style={{ ...headingStyle, fontSize: '1.5rem' }}
          >
            {value}
          </p>
          <p className="text-sm text-zinc-500">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentActions({
  student,
  onView,
  onToggleStatus,
}: {
  student: AdminStudent;
  onView: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center size-8 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acoes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onView}>
          <Eye className="size-4" /> Ver Detalhes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleStatus}>
          {student.is_active ? (
            <>
              <UserX className="size-4" /> Desativar
            </>
          ) : (
            <>
              <UserCheck className="size-4" /> Ativar
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StudentCard({
  student,
  onView,
  onToggleStatus,
}: {
  student: AdminStudent;
  onView: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-4">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
            {getInitials(student.name || undefined, student.email || undefined)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-800 truncate">
            {student.name || '(sem nome)'}
          </p>
          <p className="text-sm text-zinc-500 truncate">{student.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                student.is_active
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-red-100 text-red-700 border-red-200'
              )}
            >
              {student.is_active ? 'Ativo' : 'Inativo'}
            </span>
            {student.plan && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                <CreditCard className="size-3" />
                {student.plan.name}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {relativeTime(student.created_at)}
          </p>
        </div>
        <StudentActions
          student={student}
          onView={onView}
          onToggleStatus={onToggleStatus}
        />
      </CardContent>
    </Card>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInvite: (email: string, name?: string) => Promise<any>;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setEmailError('Email e obrigatorio');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Email invalido');
      return;
    }
    setSubmitting(true);
    try {
      await onInvite(email.trim(), name.trim() || undefined);
      setEmail('');
      setName('');
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Erro ao convidar', { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={headingStyle}>Convidar Estudante</DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um novo estudante.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Nome (opcional)</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do estudante"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              placeholder="estudante@exemplo.com"
              type="email"
              aria-invalid={!!emailError}
              disabled={submitting}
            />
            {emailError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-3" /> {emailError}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-1 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Mail className="size-4 mr-1" /> Enviar Convite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudentDetailDialog({
  open,
  onOpenChange,
  student,
  detail,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: AdminStudent | null;
  detail: StudentDetail | null;
  loading: boolean;
}) {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={headingStyle}>Detalhes do Estudante</DialogTitle>
        </DialogHeader>

        {/* Profile header */}
        <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <Avatar className="size-12">
            <AvatarFallback className="bg-emerald-100 text-emerald-700">
              {getInitials(student.name || undefined, student.email || undefined)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-zinc-900 font-medium truncate">
              {student.name || '(sem nome)'}
            </p>
            <p className="text-sm text-zinc-500 truncate">{student.email}</p>
          </div>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
              student.is_active
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-red-100 text-red-700 border-red-200'
            )}
          >
            {student.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="text-zinc-400 text-xs mb-1">Plano</p>
            <p className="text-zinc-700">
              {student.plan?.name || 'Sem plano'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="text-zinc-400 text-xs mb-1">Ingresso</p>
            <p className="text-zinc-700">{relativeTime(student.created_at)}</p>
          </div>
        </div>

        {/* Learning stats */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
        ) : detail?.stats ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">Estatisticas de Estudo</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailStatCard
                icon={<Clock className="size-4 text-blue-500" />}
                label="Tempo de estudo"
                value={`${detail.stats.totalStudyMinutes} min`}
              />
              <DetailStatCard
                icon={<BookOpen className="size-4 text-teal-500" />}
                label="Sessoes"
                value={String(detail.stats.totalSessions)}
              />
              <DetailStatCard
                icon={<Brain className="size-4 text-violet-500" />}
                label="Cards revisados"
                value={String(detail.stats.totalCardsReviewed)}
              />
              <DetailStatCard
                icon={<Flame className="size-4 text-orange-500" />}
                label="Streak atual"
                value={`${detail.stats.currentStreak} dias`}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center">
            <p className="text-sm text-zinc-400">
              Nenhuma estatistica de estudo disponivel ainda.
            </p>
          </div>
        )}

        {/* Strengths / Weaknesses */}
        {detail?.learning_profile && (
          <div className="space-y-3">
            {detail.learning_profile.strengths?.length > 0 && (
              <div>
                <p className="text-xs text-zinc-400 mb-1">Pontos Fortes</p>
                <div className="flex flex-wrap gap-1">
                  {detail.learning_profile.strengths.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {detail.learning_profile.weaknesses?.length > 0 && (
              <div>
                <p className="text-xs text-zinc-400 mb-1">Areas a Melhorar</p>
                <div className="flex flex-wrap gap-1">
                  {detail.learning_profile.weaknesses.map((w, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
      <div className="flex size-8 items-center justify-center rounded-md bg-zinc-100">
        {icon}
      </div>
      <div>
        <p className="text-zinc-900 font-medium text-sm">{value}</p>
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  hasFilter,
  onInvite,
}: {
  hasFilter: boolean;
  onInvite: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <UserCircle className="size-12 text-zinc-300 mb-3" />
        {hasFilter ? (
          <>
            <p className="text-zinc-600">Nenhum estudante encontrado</p>
            <p className="text-sm text-zinc-400 mt-1">
              Tente alterar os filtros de busca.
            </p>
          </>
        ) : (
          <>
            <p className="text-zinc-600">Nenhum estudante ainda</p>
            <p className="text-sm text-zinc-400 mt-1">
              Convide o primeiro estudante da sua instituicao.
            </p>
            <Button
              className="mt-4 bg-teal-500 hover:bg-teal-600 text-white"
              onClick={onInvite}
            >
              <UserPlus className="size-4 mr-1" /> Convidar Primeiro Estudante
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

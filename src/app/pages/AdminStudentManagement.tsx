// ============================================================
// Axon v4.4 — Admin Student Management Page
// Full UI for admin/owner to manage students:
//   - Stats overview cards
//   - Student list with search, filter, sort
//   - Invite student dialog
//   - Toggle active/inactive
//   - View student detail (modal)
//
// Route: /admin/students (inside AdminShell)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  GraduationCap,
  Search,
  UserPlus,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  Eye,
  Mail,
  Users,
  TrendingUp,
  UserX,
  CalendarPlus,
  X,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { headingStyle, bodyStyle } from '../lib/design-tokens';
import { CURRENT_INST_ID } from '../lib/admin-constants';
import {
  listStudents,
  getStudentStats,
  getStudentDetail,
  toggleStudentStatus,
  inviteStudent,
  type StudentListItem,
  type StudentStats,
  type StudentDetail,
} from '../lib/api-admin-students';
import { toast } from 'sonner';

export function AdminStudentManagement() {
  // State
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch students + stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentList, studentStats] = await Promise.all([
        listStudents({
          institution_id: CURRENT_INST_ID,
          search: search || undefined,
          is_active: filterActive || undefined,
        }),
        getStudentStats(CURRENT_INST_ID),
      ]);
      setStudents(studentList);
      setStats(studentStats);
    } catch (err) {
      console.error('[AdminStudentManagement] fetchData error:', err);
      toast.error('Error al cargar datos de estudiantes');
    } finally {
      setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // View student detail
  const handleViewDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const detail = await getStudentDetail(userId, CURRENT_INST_ID);
      setSelectedStudent(detail);
    } catch (err) {
      toast.error('Error al cargar detalle del estudiante');
    } finally {
      setDetailLoading(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (student: StudentListItem) => {
    setActionLoading(student.user_id);
    try {
      await toggleStudentStatus(student.user_id, CURRENT_INST_ID, !student.is_active);
      toast.success(
        student.is_active
          ? `${student.name || student.email} desactivado`
          : `${student.name || student.email} activado`
      );
      await fetchData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'No se pudo cambiar estado'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Invite student
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('El email es obligatorio');
      return;
    }
    setInviteLoading(true);
    try {
      await inviteStudent(CURRENT_INST_ID, inviteEmail.trim(), inviteName.trim() || undefined);
      toast.success(`Estudiante ${inviteEmail} invitado correctamente`);
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteName('');
      await fetchData();
    } catch (err: any) {
      toast.error(`Error al invitar: ${err?.message || 'Error desconocido'}`);
    } finally {
      setInviteLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={headingStyle} className="text-zinc-900">
            Gestion de Estudiantes
          </h1>
          <p className="mt-1 text-zinc-500" style={bodyStyle}>
            Administra los alumnos de tu institucion.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`size-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            className="bg-teal-500 hover:bg-teal-600 text-white"
            size="sm"
            onClick={() => setShowInviteDialog(true)}
          >
            <UserPlus className="size-4 mr-1" />
            Invitar Estudiante
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          title="Total"
          value={stats?.total_students}
          icon={<Users className="size-5 text-teal-500" />}
          loading={loading}
        />
        <StatsCard
          title="Activos"
          value={stats?.active_students}
          icon={<GraduationCap className="size-5 text-emerald-500" />}
          loading={loading}
        />
        <StatsCard
          title="Inactivos"
          value={stats?.inactive_students}
          icon={<UserX className="size-5 text-red-400" />}
          loading={loading}
        />
        <StatsCard
          title="Nuevos (mes)"
          value={stats?.new_this_month}
          icon={<CalendarPlus className="size-5 text-blue-500" />}
          loading={loading}
        />
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-10"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle style={headingStyle} className="flex items-center gap-2">
            <GraduationCap className="size-5 text-teal-500" />
            Estudiantes
            {!loading && (
              <span className="text-sm text-zinc-400 font-normal ml-1">
                ({students.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="size-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500" style={bodyStyle}>
                {search ? 'No se encontraron estudiantes con esa busqueda.' : 'No hay estudiantes registrados aun.'}
              </p>
              <Button
                className="mt-4 bg-teal-500 hover:bg-teal-600 text-white"
                size="sm"
                onClick={() => setShowInviteDialog(true)}
              >
                <UserPlus className="size-4 mr-1" />
                Invitar primer estudiante
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {students.map((student) => (
                <div
                  key={student.membership_id}
                  className="flex items-center gap-4 py-3 px-2 hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex size-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-medium shrink-0">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.name || ''}
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      (student.name || student.email || '?').charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 font-medium truncate">
                      {student.name || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {student.email || 'Sin email'}
                    </p>
                  </div>

                  {/* Plan */}
                  <div className="hidden sm:block">
                    {student.plan ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs text-blue-700">
                        {student.plan.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-500">
                        Sin plan
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border ${
                      student.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {student.is_active ? 'Activo' : 'Inactivo'}
                  </span>

                  {/* Joined */}
                  <span className="hidden md:inline text-xs text-zinc-400">
                    {formatDate(student.created_at)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title="Ver detalle"
                      onClick={() => handleViewDetail(student.user_id)}
                    >
                      <Eye className="size-4 text-zinc-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title={student.is_active ? 'Desactivar' : 'Activar'}
                      disabled={actionLoading === student.user_id}
                      onClick={() => handleToggleStatus(student)}
                    >
                      {actionLoading === student.user_id ? (
                        <Loader2 className="size-4 animate-spin text-zinc-400" />
                      ) : student.is_active ? (
                        <ToggleRight className="size-4 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="size-4 text-red-400" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Invite Student Dialog ═══ */}
      {showInviteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 style={headingStyle} className="text-zinc-900">
                Invitar Estudiante
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInviteDialog(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-700 mb-1">Email *</label>
                <Input
                  type="email"
                  placeholder="alumno@universidad.edu"
                  value={inviteEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-700 mb-1">Nombre (opcional)</label>
                <Input
                  placeholder="Nombre completo"
                  value={inviteName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                disabled={inviteLoading}
              >
                Cancelar
              </Button>
              <Button
                className="bg-teal-500 hover:bg-teal-600 text-white"
                onClick={handleInvite}
                disabled={inviteLoading || !inviteEmail.trim()}
              >
                {inviteLoading ? (
                  <><Loader2 className="size-4 mr-1 animate-spin" /> Invitando...</>
                ) : (
                  <><Mail className="size-4 mr-1" /> Enviar Invitacion</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Student Detail Modal ═══ */}
      {(selectedStudent || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="size-8 animate-spin text-teal-500 mb-3" />
                <p className="text-zinc-500">Cargando detalle...</p>
              </div>
            ) : selectedStudent ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 style={headingStyle} className="text-zinc-900">
                    Detalle del Estudiante
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedStudent(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Profile */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-lg font-semibold">
                    {(selectedStudent.name || selectedStudent.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg text-zinc-900 font-medium">
                      {selectedStudent.name || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {selectedStudent.email || 'Sin email'}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                          selectedStudent.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {selectedStudent.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      {selectedStudent.plan && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
                          {selectedStudent.plan.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <InfoField label="Ingreso" value={formatDate(selectedStudent.joined_at)} />
                  <InfoField label="User ID" value={selectedStudent.user_id.slice(0, 8) + '...'} />
                  <InfoField
                    label="Plan"
                    value={selectedStudent.plan?.name || 'Sin plan asignado'}
                  />
                  <InfoField
                    label="Estado"
                    value={selectedStudent.is_active ? 'Activo' : 'Inactivo'}
                  />
                </div>

                {/* KV Stats (if available) */}
                {selectedStudent.stats && (
                  <div className="border-t border-zinc-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-zinc-700 mb-3">
                      Estadisticas de Aprendizaje
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedStudent.stats.totalStudyMinutes !== undefined && (
                        <InfoField
                          label="Minutos estudiados"
                          value={String(selectedStudent.stats.totalStudyMinutes)}
                        />
                      )}
                      {selectedStudent.stats.totalSessions !== undefined && (
                        <InfoField
                          label="Sesiones"
                          value={String(selectedStudent.stats.totalSessions)}
                        />
                      )}
                      {selectedStudent.stats.totalCardsReviewed !== undefined && (
                        <InfoField
                          label="Cards revisadas"
                          value={String(selectedStudent.stats.totalCardsReviewed)}
                        />
                      )}
                      {selectedStudent.stats.currentStreak !== undefined && (
                        <InfoField
                          label="Racha actual"
                          value={`${selectedStudent.stats.currentStreak} dias`}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Learning Profile (if available) */}
                {selectedStudent.learning_profile && (
                  <div className="border-t border-zinc-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-zinc-700 mb-3">
                      Perfil de Aprendizaje
                    </h3>
                    {selectedStudent.learning_profile.strengths && (
                      <div className="mb-2">
                        <p className="text-xs text-zinc-500 mb-1">Fortalezas:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedStudent.learning_profile.strengths.map((s: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedStudent.learning_profile.weaknesses && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Debilidades:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedStudent.learning_profile.weaknesses.map((w: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!selectedStudent.stats && !selectedStudent.learning_profile && (
                  <div className="border-t border-zinc-200 pt-4 mt-4 text-center">
                    <p className="text-sm text-zinc-400">
                      Este estudiante aun no tiene datos de aprendizaje registrados.
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StatsCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value?: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 shrink-0">
          {icon}
        </div>
        <div>
          {loading ? (
            <>
              <Skeleton className="h-5 w-10 mb-1" />
              <Skeleton className="h-3 w-16" />
            </>
          ) : (
            <>
              <p className="text-zinc-900 text-lg font-semibold">
                {value ?? 0}
              </p>
              <p className="text-xs text-zinc-500">{title}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm text-zinc-700">{value}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ═══════════════════════════════════════════════
// Axon v4.4 — Admin Dashboard (A5-05)
// Agent 5: FORGE — Overview + Quick Actions + Setup Banner
// Phase 4: imports from api-admin.ts (no barrel)
// ═══════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  CreditCard,
  GraduationCap,
  Mail,
  ArrowRight,
  Wand2,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { RoleBadge } from '../components/admin/RoleBadge';
import { getDashboardStats, type DashboardStats } from '../lib/api-admin';
import { CURRENT_INST_ID } from '../lib/admin-constants';
import { headingStyle } from '../lib/design-tokens';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats(CURRENT_INST_ID)
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    {
      title: 'Wizard de Institucion',
      description: 'Crear o reconfigurar tu institucion',
      icon: <Wand2 className="size-5 text-teal-500" />,
      path: '/admin/wizard',
    },
    {
      title: 'Gestionar Miembros',
      description: 'Invitar, editar roles y permisos',
      icon: <Users className="size-5 text-teal-500" />,
      path: '/admin/members',
    },
    {
      title: 'Planes de Precios',
      description: 'Crear y administrar planes de acceso',
      icon: <CreditCard className="size-5 text-teal-500" />,
      path: '/admin/plans',
    },
    {
      title: 'Permisos y Alcances',
      description: 'Definir que puede ver cada admin',
      icon: <Shield className="size-5 text-teal-500" />,
      path: '/admin/scopes',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 style={headingStyle} className="text-zinc-900">
          {loading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <>Dashboard {stats?.institutionName && `\u2014 ${stats.institutionName}`}</>
          )}
        </h1>
        <p className="mt-1 text-zinc-500">
          Visao geral da sua instituicao e acoes rapidas.
        </p>
      </div>

      {/* Setup Banner (conditional) */}
      {!loading && stats && !stats.hasInstitution && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-amber-800" style={headingStyle}>
                  Complete a configuracao da sua instituicao
                </p>
                <p className="text-sm text-amber-600 mt-0.5">
                  Use o wizard para configurar os dados basicos e comecar a convidar membros.
                </p>
              </div>
            </div>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white shrink-0 sm:ml-auto"
              onClick={() => navigate('/admin/wizard')}
            >
              Iniciar Wizard
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Miembros"
          value={stats?.totalMembers}
          icon={<Users className="size-5 text-teal-500" />}
          loading={loading}
        />
        <StatsCard
          title="Planes Activos"
          value={stats?.totalPlans}
          icon={<CreditCard className="size-5 text-teal-500" />}
          loading={loading}
        />
        <StatsCard
          title="Alumnos Activos"
          value={stats?.activeStudents}
          icon={<GraduationCap className="size-5 text-teal-500" />}
          loading={loading}
        />
        <StatsCard
          title="Invitaciones Pendientes"
          value={stats?.pendingInvites}
          icon={<Mail className="size-5 text-amber-500" />}
          loading={loading}
        />
      </div>

      {/* Members by Role */}
      {!loading && stats?.membersByRole && (
        <Card>
          <CardHeader>
            <CardTitle style={headingStyle}>
              Distribucion por Rol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.membersByRole).map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2"
                >
                  <RoleBadge role={role} />
                  <span className="text-sm text-zinc-600">
                    {count} {count === 1 ? 'miembro' : 'miembros'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-zinc-900" style={headingStyle}>
          Acoes Rapidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer transition-all hover:border-teal-200 hover:shadow-sm"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-teal-50 shrink-0">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900" style={headingStyle}>
                    {action.title}
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">{action.description}</p>
                </div>
                <ArrowRight className="size-4 text-zinc-400 shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────

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
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 shrink-0">
          {icon}
        </div>
        <div>
          {loading ? (
            <>
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-4 w-24" />
            </>
          ) : (
            <>
              <p className="text-zinc-900" style={{ ...headingStyle, fontSize: '1.5rem' }}>
                {value ?? 0}
              </p>
              <p className="text-sm text-zinc-500">{title}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

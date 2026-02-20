// ============================================================
// Axon v4.4 — Owner Dashboard
// Shows all institutions owned by the logged-in user.
// This is the OWNER level — separate from institution admin.
//
// Data flow:
//   1. AuthContext.memberships.filter(role === 'owner') → institution IDs
//   2. GET /institutions/:id/dashboard-stats → stats per institution
//   3. Cards auto-update when institutions are created
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AxonLogo } from '../components/AxonLogo';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  Plus,
  ArrowRight,
  LogOut,
  Loader2,
  Crown,
  RefreshCw,
} from 'lucide-react';
import { apiBaseUrl } from '../lib/config';
import { authHeaders } from '../lib/api-core';
import { headingStyle, bodyStyle } from '../lib/design-tokens';

import type { Membership, Institution } from '../../types/auth';

interface InstitutionStats {
  institutionName: string;
  hasInstitution: boolean;
  totalMembers: number;
  totalPlans: number;
  activeStudents: number;
  pendingInvites: number;
  membersByRole: Record<string, number>;
}

interface InstitutionCard {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  stats: InstitutionStats | null;
  loading: boolean;
}

export function OwnerDashboard() {
  const navigate = useNavigate();
  const {
    user,
    accessToken,
    memberships,
    isAuthenticated,
    isLoading: authLoading,
    logout,
    selectInstitution,
  } = useAuth();
  const [institutions, setInstitutions] = useState<InstitutionCard[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);

  // Get institutions where user is owner
  const ownerMemberships = memberships.filter((m: Membership) => m.role === 'owner');

  const fetchStats = useCallback(
    async (instId: string): Promise<InstitutionStats | null> => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/institutions/${instId}/dashboard-stats`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        if (data.success) return data.data;
        return null;
      } catch (err) {
        console.error(`[OwnerDashboard] Stats fetch error for ${instId}:`, err);
        return null;
      }
    },
    []
  );

  const loadInstitutions = useCallback(async () => {
    if (!accessToken || ownerMemberships.length === 0) {
      setLoadingInstitutions(false);
      return;
    }

    // Initialize cards from memberships
    const cards: InstitutionCard[] = ownerMemberships.map((m: Membership) => ({
      id: m.institution_id,
      name: (m as any).institution?.name || m.institution_id,
      slug: (m as any).institution?.slug || '',
      logo_url: (m as any).institution?.logo_url,
      stats: null,
      loading: true,
    }));
    setInstitutions(cards);
    setLoadingInstitutions(false);

    // Fetch stats for each institution in parallel
    const statsPromises = cards.map(async (card) => {
      const stats = await fetchStats(card.id);
      return { id: card.id, stats };
    });

    const results = await Promise.all(statsPromises);

    setInstitutions((prev) =>
      prev.map((card) => {
        const result = results.find((r) => r.id === card.id);
        return {
          ...card,
          name: result?.stats?.institutionName || card.name,
          stats: result?.stats || null,
          loading: false,
        };
      })
    );
  }, [accessToken, ownerMemberships.length, fetchStats]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadInstitutions();
    }
  }, [isAuthenticated, authLoading]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ea]">
        <Loader2 size={24} className="animate-spin text-teal-500" />
      </div>
    );
  }

  const handleManageInstitution = (instId: string) => {
    selectInstitution(instId);
    navigate('/admin');
  };

  const handleCreateNew = () => {
    navigate('/admin/wizard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AxonLogo size="md" />
            <div>
              <h1 className="text-lg font-bold text-gray-900" style={headingStyle}>
                Axon
              </h1>
              <p className="text-[11px] text-gray-400" style={bodyStyle}>
                Area del Dueno
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Crown size={14} className="text-violet-600" />
              </div>
              <span style={bodyStyle}>{user?.name || user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
              <LogOut size={16} />
              <span className="hidden sm:inline ml-1">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900" style={headingStyle}>
            Bienvenido, {user?.name || 'Dueno'}
          </h2>
          <p className="text-sm text-gray-500 mt-1" style={bodyStyle}>
            Gestiona tus instituciones desde aqui. Cada institucion que creas aparece automaticamente.
          </p>
        </div>

        {/* Institutions Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900" style={headingStyle}>
              Tus Instituciones
            </h3>
            {!loadingInstitutions && (
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                {institutions.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadInstitutions}
              className="text-gray-400 hover:text-gray-600"
            >
              <RefreshCw size={14} />
            </Button>
            <Button
              onClick={handleCreateNew}
              className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm"
              size="sm"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Crear Nueva</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loadingInstitutions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="border-gray-200 bg-white rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingInstitutions && institutions.length === 0 && (
          <Card className="border-gray-200 bg-white rounded-2xl border-dashed">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <Building2 size={28} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2" style={headingStyle}>
                Aun no tienes instituciones
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto" style={bodyStyle}>
                Crea tu primera institucion para empezar a invitar profesores,
                alumnos y gestionar planes de estudio.
              </p>
              <Button
                onClick={handleCreateNew}
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
              >
                <Plus size={16} />
                Crear tu primera institucion
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Institution Cards */}
        {!loadingInstitutions && institutions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {institutions.map((inst) => (
              <Card
                key={inst.id}
                className="border-gray-200 bg-white rounded-2xl hover:shadow-md transition-all hover:border-violet-200 cursor-pointer group"
                onClick={() => handleManageInstitution(inst.id)}
              >
                <CardContent className="p-6">
                  {/* Institution Name + Slug */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                        <Building2 size={18} className="text-violet-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900" style={headingStyle}>
                          {inst.name}
                        </h4>
                        {inst.slug && (
                          <p className="text-[11px] text-gray-400 mt-0.5">/i/{inst.slug}</p>
                        )}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-gray-300 group-hover:text-violet-500 transition-colors mt-2"
                    />
                  </div>

                  {/* Stats */}
                  {inst.loading ? (
                    <div className="grid grid-cols-3 gap-3">
                      <Skeleton className="h-14 rounded-xl" />
                      <Skeleton className="h-14 rounded-xl" />
                      <Skeleton className="h-14 rounded-xl" />
                    </div>
                  ) : inst.stats ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <Users size={14} className="text-teal-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{inst.stats.totalMembers}</p>
                        <p className="text-[10px] text-gray-400">Miembros</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <GraduationCap size={14} className="text-teal-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{inst.stats.activeStudents}</p>
                        <p className="text-[10px] text-gray-400">Alumnos</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <CreditCard size={14} className="text-teal-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{inst.stats.totalPlans}</p>
                        <p className="text-[10px] text-gray-400">Planes</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-600">No se pudieron cargar las estadisticas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Cada vez que crees una nueva institucion, aparecera aqui automaticamente.
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Axon v4.4</p>
        </div>
      </main>
    </div>
  );
}

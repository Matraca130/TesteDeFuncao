// ============================================================
// Axon v4.4 — Diagnostics: Initial Test Layer Definitions
// ============================================================
// Pure data — no React, no side effects.
// ============================================================
import { Server, Shield, Database, Zap } from 'lucide-react';
import type { TestLayer } from './types';

export function createInitialLayers(): TestLayer[] {
  return [
    {
      id: 'infra',
      name: 'Camada 1 \u2014 Infraestrutura',
      icon: Server,
      description: 'Health check, KV store, rotas registradas',
      status: 'idle',
      tests: [
        { id: 'health',  name: 'GET /health',       description: 'Verifica se o backend responde e retorna status: ok', status: 'idle' },
        { id: 'kv-test', name: 'GET /diag/kv-test',  description: 'Roundtrip set\u2192get\u2192del no KV store',              status: 'idle' },
        { id: 'routes',  name: 'GET /diag/routes',   description: 'Lista rotas registradas no servidor',               status: 'idle' },
      ],
    },
    {
      id: 'auth',
      name: 'Camada 2 \u2014 Autentica\u00e7\u00e3o',
      icon: Shield,
      description: 'Signin, sess\u00e3o persistida, token JWT v\u00e1lido',
      status: 'idle',
      tests: [
        { id: 'auth-token',  name: 'Token JWT presente',     description: 'Verifica se existe token salvo no localStorage',             status: 'idle' },
        { id: 'auth-me',     name: 'GET /auth/me',           description: 'Valida token com endpoint /auth/me',                        status: 'idle' },
        { id: 'auth-header', name: 'Authorization header',   description: 'Confirma que requests autenticados usam Bearer token',      status: 'idle' },
      ],
    },
    {
      id: 'crud',
      name: 'Camada 3 \u2014 CRUD de Entidades',
      icon: Database,
      description: 'Leitura de cada entidade via endpoints reais',
      status: 'idle',
      tests: [
        { id: 'crud-courses',     name: 'GET /courses',      description: 'Lista cursos da institui\u00e7\u00e3o',       status: 'idle' },
        { id: 'crud-semesters',   name: 'GET /semesters',    description: 'Lista semestres (por curso)',       status: 'idle' },
        { id: 'crud-sections',    name: 'GET /sections',     description: 'Lista se\u00e7\u00f5es (por semestre)',       status: 'idle' },
        { id: 'crud-topics',      name: 'GET /topics',       description: 'Lista t\u00f3picos (por se\u00e7\u00e3o)',          status: 'idle' },
        { id: 'crud-summaries',   name: 'GET /summaries',    description: 'Lista resumos (por t\u00f3pico)',        status: 'idle' },
        { id: 'crud-keywords',    name: 'GET /keywords',     description: 'Lista keywords da institui\u00e7\u00e3o',  status: 'idle' },
        { id: 'crud-connections', name: 'GET /connections',  description: 'Lista conex\u00f5es entre keywords',       status: 'idle' },
      ],
    },
    {
      id: 'gaps',
      name: 'Camada 4 \u2014 Verifica\u00e7\u00e3o dos 4 Gaps',
      icon: Zap,
      description: 'Gap 3: ApprovalQueue real | Gap 4: DeleteSummary | Gap 5: UpdateSubTopic | Gap 6: Toasts',
      status: 'idle',
      tests: [
        { id: 'gap3-approval',   name: 'Gap 3: ApprovalQueue items',     description: 'Verifica que approval queue tem items derivados de dados reais',                   status: 'idle' },
        { id: 'gap4-delete-sum', name: 'Gap 4: DELETE /summaries/:id',   description: 'Confirma que endpoint de delete summary existe e aceita requests',                 status: 'idle' },
        { id: 'gap5-update-st',  name: 'Gap 5: PUT /subtopics/:id',      description: 'Confirma que endpoint de update subtopic existe e aceita requests',                 status: 'idle' },
        { id: 'gap6-batch',      name: 'Gap 6: PUT /content/batch-status', description: 'Verifica endpoint de batch status para aprova\u00e7\u00e3o em massa', status: 'idle' },
      ],
    },
  ];
}

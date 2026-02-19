// ============================================================
// Axon v4.4 — Diagnostics: Step-by-step guide card
// ============================================================
import React from 'react';
import { Sparkles } from 'lucide-react';

export function InstructionsCard() {
  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 p-5">
      <h3 className="text-sm font-semibold text-teal-800 mb-2 flex items-center gap-2">
        <Sparkles size={14} />
        Guia Paso a Paso
      </h3>
      <div className="space-y-2 text-xs text-teal-700">
        <div className="flex items-start gap-2">
          <span className="font-bold text-teal-500 shrink-0">1.</span>
          <span>
            <strong>Camada 1 (Infra)</strong> \u2014 Clique \u25b6 ao lado. Se todos
            ficarem verdes, o servidor est\u00e1 vivo e o KV funciona. Se vermelho:
            verifique se a Edge Function est\u00e1 deployada.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-teal-500 shrink-0">2.</span>
          <span>
            <strong>Camada 2 (Auth)</strong> \u2014 Precisa estar logado. Se
            &quot;Token JWT presente&quot; falhar, volte \u00e0 tela de login, fa\u00e7a signin,
            e retorne. Se &quot;GET /auth/me&quot; falhar, o token expirou.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-teal-500 shrink-0">3.</span>
          <span>
            <strong>Camada 3 (CRUD)</strong> \u2014 Testa leitura de cada entidade.
            Se 0 dados retornados, pode ser que o seed n\u00e3o rodou. Os testes s\u00e3o
            leitura apenas \u2014 n\u00e3o cria/deleta nada.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-bold text-teal-500 shrink-0">4.</span>
          <span>
            <strong>Camada 4 (Gaps)</strong> \u2014 Verifica que os 4 gaps est\u00e3o
            wired: rota de delete summary, rota de update subtopic, approval
            queue com dados reais, e batch status. Nenhum dado \u00e9 modificado.
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-teal-200/60">
          <p className="font-semibold text-teal-800">
            Se algum teste falhar:
          </p>
          <ul className="mt-1 space-y-1 list-disc ml-4">
            <li>Clique &quot;Ver detalhes&quot; para informa\u00e7\u00f5es t\u00e9cnicas</li>
            <li>Abra o Log de execu\u00e7\u00e3o para timeline completa</li>
            <li>Rode apenas a camada com falha (bot\u00e3o \u25b6 individual)</li>
            <li>Ap\u00f3s corrigir, clique Reset e rode novamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Axon — Complete Keyword System Demo
// Shows the full integration: keywords → gap detection → AI generation
// ============================================================

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, Sparkles, TrendingUp, Activity } from 'lucide-react';
import { KeywordQuizDemo } from './KeywordQuizDemo';
import { SmartFlashcardGenerator } from '../ai/SmartFlashcardGenerator';
import {
  KeywordCollection,
  getKeywordStats,
  getKeywordsNeedingCards,
} from '@/app/services/keywordManager';
import { estimateFlashcardNeeds } from '@/app/services/aiFlashcardGenerator';
import { saveTopicKeywords } from '@/app/services/studentApi';

type ViewMode = 'overview' | 'quiz' | 'generator';

export function KeywordSystemDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [keywords, setKeywords] = useState<KeywordCollection>({});
  const [showGenerator, setShowGenerator] = useState(false);

  const courseId = 'anatomy';
  const topicId = 'shoulder';
  const courseName = 'Anatomia';
  const topicTitle = 'Ombro e Axila';

  const stats = getKeywordStats(keywords);
  const estimate = estimateFlashcardNeeds(keywords);
  const needingCards = getKeywordsNeedingCards(keywords, 3, 3);

  const handleKeywordsUpdated = async (updated: KeywordCollection) => {
    setKeywords(updated);
    
    // Persist to backend
    try {
      await saveTopicKeywords(courseId, topicId, updated);
      console.log('[KeywordSystemDemo] Keywords persisted to backend');
    } catch (err) {
      console.error('[KeywordSystemDemo] Failed to persist keywords:', err);
    }
  };

  if (viewMode === 'quiz') {
    return (
      <div className="min-h-screen bg-[#f5f6fa] py-8">
        <KeywordQuizDemo
          courseId={courseId}
          topicId={topicId}
          initialKeywords={keywords}
          onKeywordsUpdated={handleKeywordsUpdated}
        />
        <div className="max-w-4xl mx-auto px-8 mt-4">
          <button
            onClick={() => setViewMode('overview')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Voltar para visão geral
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] py-8">
      <div className="max-w-6xl mx-auto px-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#ec43ef] to-[#b830e8] text-white mb-4">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sistema de Keywords com IA
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Demonstração completa do spaced repetition baseado em keywords, com
            geração inteligente de flashcards pela IA Gemini.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Estado Atual</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de Keywords</span>
                <span className="text-lg font-bold text-gray-900">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Domínio Médio</span>
                <span className="text-lg font-bold text-gray-900">
                  {Math.round(stats.averageMastery * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pendentes Revisão</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.dueCount}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Distribuição</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600 flex-1">Vermelho</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.byColor.red}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600 flex-1">Amarelo</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.byColor.yellow}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600 flex-1">Verde</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.byColor.green}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Gaps de Cobertura</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  {estimate.totalGap}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Críticos</span>
                <span className="text-lg font-bold text-red-600">
                  {estimate.byUrgency.critical}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recomendados</span>
                <span className="text-lg font-bold text-[#ec43ef]">
                  {estimate.recommendedGeneration}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#ec43ef]/10 to-[#b830e8]/10 rounded-2xl p-8 border border-[#ec43ef]/20"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ec43ef] to-[#b830e8] flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Praticar com Quiz
                </h2>
                <p className="text-sm text-gray-700">
                  Responda questões e veja as keywords sendo atualizadas em tempo
                  real com o algoritmo de spaced repetition.
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode('quiz')}
              className="w-full py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-[#ec43ef] to-[#b830e8] text-white hover:shadow-lg transition-all"
            >
              Iniciar Quiz Interativo
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Gerar Flashcards com IA
                </h2>
                <p className="text-sm text-gray-700">
                  A IA identifica keywords com baixa cobertura e gera flashcards
                  automaticamente para preencher os gaps.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGenerator(true)}
              disabled={stats.total === 0}
              className="w-full py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Abrir Gerador Inteligente
            </button>
            {stats.total === 0 && (
              <p className="text-xs text-gray-600 mt-2 text-center">
                ⚠️ Complete o quiz primeiro para popular keywords
              </p>
            )}
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Como Funciona o Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#ec43ef]/10 text-[#ec43ef] flex items-center justify-center font-bold text-lg mb-3">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Rastreamento de Keywords
              </h3>
              <p className="text-sm text-gray-700">
                Cada keyword tem <strong>mastery</strong> (domínio),{' '}
                <strong>stability</strong> (estabilidade da memória),{' '}
                <strong>due_at</strong> (agenda de revisão) e{' '}
                <strong>card_coverage</strong> (flashcards disponíveis).
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-[#ec43ef]/10 text-[#ec43ef] flex items-center justify-center font-bold text-lg mb-3">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Peso Inteligente</h3>
              <p className="text-sm text-gray-700">
                O <strong>need score</strong> combina 4 fatores: atraso (45%), baixo
                domínio (30%), fragilidade (15%) e cobertura (10%). Keywords com alto
                peso são priorizadas.
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-[#ec43ef]/10 text-[#ec43ef] flex items-center justify-center font-bold text-lg mb-3">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Geração Automática
              </h3>
              <p className="text-sm text-gray-700">
                A IA Gemini gera flashcards focados em keywords com{' '}
                <strong>baixa cobertura</strong> e <strong>alta urgência</strong>,
                preenchendo gaps de forma controlada.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recursos Implementados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ec43ef] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Suavização EMA:</strong>{' '}
                <span className="text-gray-700 text-sm">
                  Evita mudanças bruscas por eventos únicos
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ec43ef] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Histerese nas Cores:</strong>{' '}
                <span className="text-gray-700 text-sm">
                  Requer 2 eventos consecutivos para mudar de nível
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ec43ef] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Keywords Primary/Secondary:</strong>{' '}
                <span className="text-gray-700 text-sm">
                  Primárias recebem 100% de impacto, secundárias 60%
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ec43ef] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Persistência no Supabase:</strong>{' '}
                <span className="text-gray-700 text-sm">
                  Tudo salvo no kv_store via backend
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ec43ef] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Curva de Esquecimento:</strong>{' '}
                <span className="text-gray-700 text-sm">
                  R = exp(-t/S) com agendamento automático
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ec43ef] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-gray-900">Integração com Gemini AI:</strong>{' '}
                <span className="text-gray-700 text-sm">
                  Geração inteligente de flashcards keyword-aware
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Smart Flashcard Generator Modal */}
      {showGenerator && (
        <SmartFlashcardGenerator
          courseId={courseId}
          topicId={topicId}
          courseName={courseName}
          topicTitle={topicTitle}
          keywords={keywords}
          onFlashcardsGenerated={(flashcards, updatedKeywords) => {
            handleKeywordsUpdated(updatedKeywords);
          }}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// AXON — QuizResultsScreen (post-quiz score display)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCw } from 'lucide-react';

export function QuizResultsScreen({ score, total, onReview, onBack, onRestart }: {
  score: number; total: number;
  onReview: () => void; onBack: () => void; onRestart: () => void;
}) {
  const pct = total > 0 ? (score / total) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full items-center justify-center p-8 bg-white">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Trophy size={48} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Quiz Concluido!</h2>
        <p className="text-xl text-gray-600 mb-8">
          Voce acertou <span className="font-bold text-gray-900">{score}</span> de <span className="font-bold text-gray-900">{total}</span> questoes
        </p>
        <div className="relative w-56 h-56 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="112" cy="112" r="100" stroke="#f1f5f9" strokeWidth="14" fill="none" />
            <motion.circle cx="112" cy="112" r="100" stroke="#0d9488" strokeWidth="14" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 100}
              initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 100 * (1 - pct / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-gray-900">{pct.toFixed(0)}%</span>
            <span className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">Aproveitamento</span>
          </div>
        </div>
        <button onClick={onReview} className="text-sm text-teal-600 hover:text-teal-800 font-semibold mb-6 block mx-auto">
          Revisar respostas
        </button>
        <div className="flex gap-4 justify-center">
          <button onClick={onBack} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">Voltar ao Menu</button>
          <button onClick={onRestart} className="px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3 bg-teal-600 hover:bg-teal-700">
            <RotateCw size={20} /> Tentar Novamente
          </button>
        </div>
      </div>
    </motion.div>
  );
}

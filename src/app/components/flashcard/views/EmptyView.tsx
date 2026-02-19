// ============================================================
// Axon v4.4 — EmptyView
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 4.2: Vista cuando no hay cards pendientes
// ============================================================

import { motion } from 'motion/react';
import { CheckCircle, Calendar, Sparkles, Plus } from 'lucide-react';

interface EmptyViewProps {
  onCreateCard?: () => void;
  onGoBack?: () => void;
}

export function EmptyView({ onCreateCard, onGoBack }: EmptyViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      {/* Celebration icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-lg"
      >
        <CheckCircle size={36} className="text-emerald-500" />
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h2 className="text-gray-800">Tudo em dia!</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Nenhum flashcard pendente para revisão. Volte mais tarde ou crie
          seus próprios cards para reforçar o estudo.
        </p>
      </motion.div>

      {/* Info chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-2"
      >
        <div className="flex items-center gap-1.5 text-[11px] text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
          <Calendar size={12} />
          Próxima revisão amanhã
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full">
          <Sparkles size={12} />
          SRS otimizando intervalos
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex items-center gap-3 mt-2"
      >
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Voltar
          </button>
        )}
        {onCreateCard && (
          <button
            onClick={onCreateCard}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={14} /> Criar Card Pessoal
          </button>
        )}
      </motion.div>
    </div>
  );
}

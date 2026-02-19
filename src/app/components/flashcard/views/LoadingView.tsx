// ============================================================
// Axon v4.4 — LoadingView
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 4.1: Vista de carga con skeleton animado
// ============================================================

import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      {/* Spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 size={32} className="text-teal-500" />
      </motion.div>

      {/* Skeleton card preview */}
      <div className="w-full max-w-md space-y-4">
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          {/* Skeleton header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-2 bg-gray-100 rounded w-1/3" />
            </div>
          </div>

          {/* Skeleton body lines */}
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-100 rounded w-4/6" />
          </div>

          {/* Skeleton button row */}
          <div className="flex gap-2 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-10 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </motion.div>
      </div>

      <p className="text-xs text-gray-400">Carregando flashcards...</p>
    </div>
  );
}

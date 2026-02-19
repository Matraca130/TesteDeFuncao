// ============================================================
// Axon v4.4 — StudentCardCreator
// EXTRAIDO DE: flashcard-session.tsx (monolito de 32KB)
// PASO 2.4: Modal para crear flashcards personales
// ============================================================

import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus } from 'lucide-react';

interface StudentCardCreatorProps {
  onClose: () => void;
  onSubmit: (data: { front: string; back: string }) => void;
}

export function StudentCardCreator({ onClose, onSubmit }: StudentCardCreatorProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus size={18} className="text-violet-500" /> Criar Flashcard Pessoal
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-400">
          D39: Cards pessoais alimentam o BKT com FLASHCARD_MULTIPLIER = 1.00.
        </p>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Pergunta (front) *
            </label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 resize-none placeholder:text-gray-300"
              placeholder="Qual e o principal efeito..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Resposta (back) *
            </label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 resize-none placeholder:text-gray-300"
              placeholder="O principal efeito e..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (front.trim() && back.trim()) {
                onSubmit({ front, back });
                onClose();
              }
            }}
            disabled={!front.trim() || !back.trim()}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white text-sm rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            Criar Card
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

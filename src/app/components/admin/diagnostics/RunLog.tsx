// ============================================================
// Axon v4.4 — Diagnostics: Collapsible execution log
// ============================================================
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  runLog: string[];
  showLog: boolean;
  onToggleLog: () => void;
}

export function RunLog({ runLog, showLog, onToggleLog }: Props) {
  if (runLog.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggleLog}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FileText size={14} className="text-gray-400" />
          Log de execu\u00e7\u00e3o ({runLog.length} entradas)
        </span>
        {showLog ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-gray-100 pt-3">
              <div className="bg-gray-900 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs">
                {runLog.map((line, i) => (
                  <div
                    key={i}
                    className={`py-0.5 ${
                      line.includes('\u2705')
                        ? 'text-emerald-400'
                        : line.includes('\u274c')
                          ? 'text-red-400'
                          : line.includes('\u26a0\ufe0f')
                            ? 'text-amber-400'
                            : line.includes('\u2500\u2500')
                              ? 'text-teal-400 font-semibold'
                              : 'text-gray-400'
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

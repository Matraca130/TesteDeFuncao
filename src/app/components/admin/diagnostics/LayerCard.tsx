// ============================================================
// Axon v4.4 — Diagnostics: Layer accordion card + test items
// ============================================================
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, Loader2, Play } from 'lucide-react';
import type { TestLayer } from './types';
import { STATUS_CONFIG } from './types';

interface Props {
  layer: TestLayer;
  layerIdx: number;
  isExpanded: boolean;
  isRunning: boolean;
  onToggle: () => void;
  onRunLayer: () => void;
}

export function LayerCard({
  layer,
  layerIdx,
  isExpanded,
  isRunning,
  onToggle,
  onRunLayer,
}: Props) {
  const LayerIcon = layer.icon;
  const statusCfg = STATUS_CONFIG[layer.status];
  const StatusIcon = statusCfg.icon;
  const layerPassCount = layer.tests.filter(t => t.status === 'pass').length;
  const layerTotal = layer.tests.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Layer header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        <span className="text-gray-400">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <div
          className={`w-9 h-9 rounded-xl ${statusCfg.bg} flex items-center justify-center`}
        >
          <LayerIcon size={18} className={statusCfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {layer.name}
            </span>
            {layer.status !== 'idle' && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.color}`}
              >
                {layer.status === 'running' ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <StatusIcon size={10} />
                )}
                {statusCfg.label}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{layer.description}</p>
        </div>
        {layer.status !== 'idle' && (
          <span className="text-xs font-medium text-gray-400 tabular-nums">
            {layerPassCount}/{layerTotal}
          </span>
        )}
        <button
          onClick={e => {
            e.stopPropagation();
            onRunLayer();
          }}
          disabled={isRunning}
          className="p-2 rounded-lg hover:bg-teal-50 text-teal-600 transition-colors disabled:opacity-30"
          title={`Executar camada ${layerIdx + 1}`}
        >
          <Play size={14} />
        </button>
      </div>

      {/* Test items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-2">
              {layer.tests.map(test => {
                const testCfg = STATUS_CONFIG[test.status];
                const TestIcon = testCfg.icon;
                return (
                  <div
                    key={test.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${
                      test.status === 'pass'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : test.status === 'fail'
                          ? 'bg-red-50/50 border-red-200'
                          : test.status === 'running'
                            ? 'bg-blue-50/50 border-blue-200'
                            : 'bg-gray-50/50 border-gray-100'
                    }`}
                  >
                    <div className="mt-0.5">
                      {test.status === 'running' ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-blue-500"
                        />
                      ) : (
                        <TestIcon size={16} className={testCfg.color} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {test.name}
                        </span>
                        {test.duration !== undefined && (
                          <span className="text-[10px] text-gray-400 tabular-nums">
                            {test.duration}ms
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {test.description}
                      </p>
                      {test.message && (
                        <p
                          className={`text-xs mt-1.5 font-medium ${
                            test.status === 'fail'
                              ? 'text-red-600'
                              : test.status === 'pass'
                                ? 'text-emerald-600'
                                : 'text-gray-600'
                          }`}
                        >
                          \u2192 {test.message}
                        </p>
                      )}
                      {test.details && test.status !== 'idle' && (
                        <details className="mt-2">
                          <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">
                            Ver detalhes
                          </summary>
                          <pre className="text-[10px] text-gray-500 bg-gray-100 rounded-lg p-2 mt-1 overflow-x-auto max-h-32">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

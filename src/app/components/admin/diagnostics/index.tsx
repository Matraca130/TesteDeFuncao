// ============================================================
// Axon v4.4 — DiagnosticsPanel (Orchestrator)
// ============================================================
// Thin orchestrator that composes:
//   - use-diagnostics.ts      (all state + test runners)
//   - DiagnosticsHeader.tsx   (header + stats + actions)
//   - ProgressBar.tsx         (animated progress)
//   - LayerCard.tsx           (accordion + test items)
//   - RunLog.tsx              (terminal-style log)
//   - InstructionsCard.tsx    (step-by-step guide)
// ============================================================
import React from 'react';
import { useDiagnostics } from './use-diagnostics';
import { DiagnosticsHeader } from './DiagnosticsHeader';
import { ProgressBar } from './ProgressBar';
import { LayerCard } from './LayerCard';
import { RunLog } from './RunLog';
import { InstructionsCard } from './InstructionsCard';

export function DiagnosticsPanel() {
  const {
    layers,
    expandedLayers,
    isRunning,
    runLog,
    showLog,
    passCount,
    failCount,
    totalCount,
    toggleLayer,
    runSingleLayer,
    runAllLayers,
    resetAll,
    setShowLog,
  } = useDiagnostics();

  return (
    <div className="space-y-6">
      <DiagnosticsHeader
        passCount={passCount}
        failCount={failCount}
        totalCount={totalCount}
        isRunning={isRunning}
        onRunAll={runAllLayers}
        onReset={resetAll}
      />

      <ProgressBar
        passCount={passCount}
        failCount={failCount}
        totalCount={totalCount}
      />

      <div className="space-y-3">
        {layers.map((layer, layerIdx) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            layerIdx={layerIdx}
            isExpanded={expandedLayers.has(layer.id)}
            isRunning={isRunning}
            onToggle={() => toggleLayer(layer.id)}
            onRunLayer={() => runSingleLayer(layerIdx)}
          />
        ))}
      </div>

      <RunLog
        runLog={runLog}
        showLog={showLog}
        onToggleLog={() => setShowLog(!showLog)}
      />

      <InstructionsCard />
    </div>
  );
}

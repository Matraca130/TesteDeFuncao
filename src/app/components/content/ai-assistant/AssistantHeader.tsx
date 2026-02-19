// ============================================================
// AssistantHeader — Gradient header with Axon AI branding
// ============================================================

import { Sparkles, X } from 'lucide-react';

interface AssistantHeaderProps {
  onClose: () => void;
}

export function AssistantHeader({ onClose }: AssistantHeaderProps) {
  return (
    <div className="shrink-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-4 flex items-center justify-between relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h2
            className="text-white font-bold text-lg leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Axon AI
          </h2>
          <p className="text-white/60 text-xs">Powered by Gemini</p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="relative w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

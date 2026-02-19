// ============================================================
// Axon v4.4 — Standalone AxonLogo (reusable)
// Used by auth pages. AppShell has its own internal version.
// ============================================================

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

export function AxonLogo({ size = 'md' }: Props) {
  return (
    <div
      className={`${sizeMap[size]} rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg`}
    >
      <span className="text-white font-black">A</span>
    </div>
  );
}

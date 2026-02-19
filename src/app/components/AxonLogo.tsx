// ============================================================
// Axon v4.4 — Shared Axon Logo Component
// ============================================================

interface AxonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-20 h-20 text-3xl',
};

export function AxonLogo({ size = 'md' }: AxonLogoProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg`}
    >
      <span className="text-white font-black">A</span>
    </div>
  );
}

import React from 'react';
import { Brain } from 'lucide-react';

interface AxonLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

export function AxonLogo({ size = 'md', theme = 'dark' }: AxonLogoProps) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg', gap: 'gap-2', box: 'w-8 h-8' },
    md: { icon: 24, text: 'text-xl', gap: 'gap-2.5', box: 'w-10 h-10' },
    lg: { icon: 32, text: 'text-2xl', gap: 'gap-3', box: 'w-12 h-12' },
  };
  const s = sizes[size];
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <div className={`flex items-center ${s.gap}`}>
      <div className={`${s.box} rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center`}>
        <Brain size={s.icon} className="text-white" />
      </div>
      <span className={`font-bold ${s.text} ${textColor} tracking-tight`}>Axon</span>
    </div>
  );
}

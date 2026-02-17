/**
 * Quick Navigation buttons used in both schedule views.
 * Light variant → StudyPlanDashboard right sidebar
 * Dark variant  → DefaultScheduleView dark sidebar
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  QUICK_NAV_COLORS_LIGHT,
  QUICK_NAV_COLORS_DARK,
  type QuickNavColor,
  type QuickNavColorSet,
} from './types';

interface QuickNavButtonProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: QuickNavColor;
  onClick: () => void;
}

// ─── Shared renderer ────────────────────────────
function NavButton({
  icon,
  label,
  sub,
  colors: c,
  hoverClass,
  onClick,
}: QuickNavButtonProps & { colors: QuickNavColorSet; hoverClass: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 ${c.bg} border ${c.border} ${c.text} rounded-xl text-sm font-semibold ${hoverClass} transition-all group`}
    >
      <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
        <span className={c.iconText}>{icon}</span>
      </div>
      <div className="flex-1 text-left">
        <span className="block">{label}</span>
        <span className={`text-[10px] ${c.subText} font-normal`}>{sub}</span>
      </div>
      <ArrowRight size={14} className={`${c.arrow} group-hover:translate-x-0.5 transition-transform`} />
    </button>
  );
}

// ─── Public components ──────────────────────────
export function QuickNavButton(props: QuickNavButtonProps) {
  const c = QUICK_NAV_COLORS_LIGHT[props.color] ?? QUICK_NAV_COLORS_LIGHT.teal;
  return <NavButton {...props} colors={c} hoverClass="hover:opacity-90" />;
}

export function QuickNavButtonDark(props: QuickNavButtonProps) {
  const c = QUICK_NAV_COLORS_DARK[props.color] ?? QUICK_NAV_COLORS_DARK.teal;
  return <NavButton {...props} colors={c} hoverClass="hover:opacity-80" />;
}

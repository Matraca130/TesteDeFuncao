// ============================================================
// EmptyState — Rich empty state with inline SVG illustrations
// Added by Agent 6 — PRISM — P4 polish
// Variants: keywords, flashcards, quiz, videos, notes, plans,
//           study, search, generic
// ============================================================
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

type Variant = 'keywords' | 'flashcards' | 'quiz' | 'videos' | 'notes' | 'plans' | 'study' | 'search' | 'generic';

interface EmptyStateProps {
  variant?: Variant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyIllustration({ variant }: { variant: Variant }) {
  const baseClass = 'w-32 h-32 mx-auto';

  switch (variant) {
    case 'keywords':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <rect x="30" y="38" width="60" height="44" rx="8" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="2" />
          <circle cx="60" cy="32" r="12" fill="#5eead4" stroke="#14b8a6" strokeWidth="2" />
          <path d="M56 30l4 4 8-8" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="40" y="50" width="40" height="4" rx="2" fill="#99f6e4" />
          <rect x="40" y="58" width="28" height="4" rx="2" fill="#99f6e4" />
          <rect x="40" y="66" width="34" height="4" rx="2" fill="#99f6e4" />
        </svg>
      );

    case 'flashcards':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <rect x="32" y="34" width="56" height="52" rx="6" fill="#e2e8f0" transform="rotate(-4 32 34)" />
          <rect x="28" y="30" width="56" height="52" rx="6" fill="white" stroke="#14b8a6" strokeWidth="2" />
          <rect x="36" y="42" width="32" height="4" rx="2" fill="#99f6e4" />
          <rect x="36" y="50" width="24" height="4" rx="2" fill="#ccfbf1" />
          <path d="M72 70a8 8 0 01-8 8H56" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
          <path d="M58 75l-4 3 4 3" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'quiz':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <rect x="30" y="28" width="60" height="64" rx="8" fill="white" stroke="#14b8a6" strokeWidth="2" />
          <text x="60" y="52" textAnchor="middle" fill="#14b8a6" fontSize="24" fontFamily="Georgia, serif" fontWeight="bold">?</text>
          <circle cx="42" cy="68" r="4" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="1.5" />
          <rect x="50" y="66" width="30" height="4" rx="2" fill="#99f6e4" />
          <circle cx="42" cy="80" r="4" fill="#5eead4" stroke="#0f766e" strokeWidth="1.5" />
          <path d="M40 80l2 2 4-4" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="50" y="78" width="24" height="4" rx="2" fill="#99f6e4" />
        </svg>
      );

    case 'videos':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <rect x="24" y="36" width="72" height="48" rx="8" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="2" />
          <circle cx="60" cy="60" r="14" fill="white" fillOpacity="0.8" />
          <path d="M55 52l14 8-14 8V52z" fill="#14b8a6" />
          <rect x="30" y="74" width="20" height="3" rx="1.5" fill="#5eead4" />
        </svg>
      );

    case 'notes':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <rect x="32" y="24" width="56" height="72" rx="6" fill="white" stroke="#14b8a6" strokeWidth="2" />
          <line x1="40" y1="24" x2="40" y2="96" stroke="#ccfbf1" strokeWidth="1" />
          <rect x="46" y="36" width="34" height="3" rx="1.5" fill="#99f6e4" />
          <rect x="46" y="44" width="28" height="3" rx="1.5" fill="#ccfbf1" />
          <rect x="46" y="52" width="32" height="3" rx="1.5" fill="#99f6e4" />
          <rect x="46" y="60" width="20" height="3" rx="1.5" fill="#ccfbf1" />
          <line x1="70" y1="70" x2="82" y2="82" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
          <polygon points="68,72 70,66 74,70" fill="#5eead4" />
        </svg>
      );

    case 'plans':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <rect x="30" y="28" width="60" height="64" rx="8" fill="white" stroke="#14b8a6" strokeWidth="2" />
          <rect x="30" y="28" width="60" height="16" rx="8" fill="#14b8a6" />
          <rect x="36" y="32" width="12" height="8" rx="2" fill="white" fillOpacity="0.3" />
          <rect x="52" y="32" width="12" height="8" rx="2" fill="white" fillOpacity="0.3" />
          <rect x="68" y="32" width="12" height="8" rx="2" fill="white" fillOpacity="0.3" />
          <rect x="38" y="52" r="3" width="6" height="6" rx="1" fill="#5eead4" stroke="#14b8a6" strokeWidth="1" />
          <rect x="48" y="53" width="34" height="4" rx="2" fill="#99f6e4" />
          <rect x="38" y="64" width="6" height="6" rx="1" fill="#ccfbf1" stroke="#d1d5db" strokeWidth="1" />
          <rect x="48" y="65" width="28" height="4" rx="2" fill="#e5e7eb" />
          <rect x="38" y="76" width="6" height="6" rx="1" fill="#ccfbf1" stroke="#d1d5db" strokeWidth="1" />
          <rect x="48" y="77" width="32" height="4" rx="2" fill="#e5e7eb" />
        </svg>
      );

    case 'study':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <ellipse cx="52" cy="50" rx="18" ry="20" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="2" />
          <ellipse cx="68" cy="50" rx="18" ry="20" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="2" />
          <path d="M60 30v40" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M56 76l4-8h6l-4 8h6l-10 14 3-10h-5z" fill="#5eead4" stroke="#0f766e" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );

    case 'search':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <circle cx="52" cy="52" r="20" fill="white" stroke="#14b8a6" strokeWidth="2" />
          <line x1="66" y1="66" x2="82" y2="82" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
          <rect x="42" y="48" width="20" height="3" rx="1.5" fill="#99f6e4" />
          <rect x="42" y="54" width="14" height="3" rx="1.5" fill="#ccfbf1" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 120 120" fill="none" className={baseClass}>
          <circle cx="60" cy="60" r="50" fill="#f0fdfa" />
          <rect x="34" y="34" width="52" height="52" rx="10" fill="white" stroke="#14b8a6" strokeWidth="2" />
          <circle cx="60" cy="54" r="8" fill="#ccfbf1" />
          <rect x="48" y="66" width="24" height="4" rx="2" fill="#99f6e4" />
          <rect x="52" y="74" width="16" height="3" rx="1.5" fill="#ccfbf1" />
        </svg>
      );
  }
}

export function EmptyState({ variant = 'generic', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="py-12 flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <EmptyIllustration variant={variant} />
      </motion.div>

      <motion.p
        className="text-gray-600 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {title}
      </motion.p>

      {description && (
        <motion.p
          className="text-gray-400 mt-1 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: '0.875rem' }}
        >
          {description}
        </motion.p>
      )}

      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <Button onClick={onAction} className="bg-teal-500 hover:bg-teal-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

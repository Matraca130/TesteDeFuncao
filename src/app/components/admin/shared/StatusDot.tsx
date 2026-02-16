import clsx from 'clsx';
import type { ValidationStatus } from './admin-types';

export function StatusDot({ status }: { status: ValidationStatus }) {
  return (
    <div className={clsx('w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white',
      status === 'complete' && 'bg-emerald-500',
      status === 'partial' && 'bg-amber-400',
      status === 'empty' && 'bg-gray-300',
    )} />
  );
}

// ============================================================
// ConfirmDeleteDialog.tsx | Agent 6 — PRISM — P6 DRY
// Reusable destructive action confirmation dialog.
// Uses shadcn AlertDialog. Trigger is a Trash2 icon button.
// Used by: VideoCard, PlanDetailPanel, and any CRUD card
// that needs a "Confirmar exclusao" pattern.
// ============================================================
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';

interface ConfirmDeleteDialogProps {
  /** Dialog title, e.g. "Eliminar video?" */
  title: string;
  /** Dialog description, e.g. 'O video "X" sera removido.' */
  description: string;
  /** Called when user confirms deletion */
  onConfirm: () => void;
  /** Optional className for the trigger button */
  triggerClassName?: string;
  /** Optional custom trigger label (default: Trash2 icon) */
  triggerLabel?: string;
}

export function ConfirmDeleteDialog({
  title,
  description,
  onConfirm,
  triggerClassName,
  triggerLabel,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={triggerClassName || 'text-gray-400 hover:text-red-500'}
        >
          <Trash2 className="w-4 h-4" />
          {triggerLabel && (
            <span className="ml-1" style={{ fontSize: '0.875rem' }}>
              {triggerLabel}
            </span>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

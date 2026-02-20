// ============================================================
// KeywordPopover.tsx — Extended by Agent 6 — PRISM
//
// Orchestrator component for keyword detail popover.
// Contains header + quick stats + 3 sub-component tabs:
//   - StudentNotesTab  (A6-05: SACRED student notes)
//   - DiagnosticoTab   (A6-07: BKT diagnostic)
//   - ProfessorNotesTab (A6-06: Professor annotations)
//
// P3: Refactored StudentNotesSection to use useStudentNotes hook
// P4: Extracted all 3 sections to independent components
// P4-fix: Restored KeywordPopoverProvider (pre-existing missing export)
// ============================================================
import { createContext, useContext } from 'react';
import { X, StickyNote, BarChart3, Layers, HelpCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Separator } from '../../ui/separator';

// Added by Agent 6 — PRISM — P4 Extraction imports
import { StudentNotesTab } from './StudentNotesTab';
import { ProfessorNotesTab } from './ProfessorNotesTab';
import { DiagnosticoTab } from './DiagnosticoTab';

// ── KeywordPopoverProvider (consumed by Canvas/Study views) ───
// Added by Agent 6 — PRISM — P4-fix: restoring missing export
// TODO: Implement full keyword-click context when Canvas agent delivers
const KeywordPopoverContext = createContext<null>(null);

/**
 * Context provider for keyword popover interactions.
 * Wraps content areas so child keyword chips can trigger the popover.
 * Currently a pass-through; full context TBD with Canvas agent.
 */
export function KeywordPopoverProvider({ children }: { children: React.ReactNode }) {
  return (
    <KeywordPopoverContext.Provider value={null}>
      {children}
    </KeywordPopoverContext.Provider>
  );
}

// ── Types ─────────────────────────────────────────────────────
interface KeywordPopoverProps {
  keywordId: string;
  term: string;
  definition: string;
  pKnow?: number;
  flashcardCount?: number;
  quizCount?: number;
  quizAccuracy?: number;
  onClose?: () => void;
}

// ── Component ─────────────────────────────────────────────────
/**
 * Rich keyword detail popover.
 *
 * Layout:
 * ┌──────────────────────────────────┐
 * │  Header: term + definition + [X] │
 * │  Quick stats badges              │
 * ├──────────────────────────────────┤
 * │  Tabs: [Mis Notas] [Diagnostico] │
 * │  ─── tab content ───             │
 * ├──────────────────────────────────┤
 * │  Notas do Professor (always)     │
 * └──────────────────────────────────┘
 */
export function KeywordPopover({
  keywordId,
  term,
  definition,
  pKnow = 0.45,
  flashcardCount = 3,
  quizCount = 2,
  quizAccuracy = 65,
  onClose,
}: KeywordPopoverProps) {
  return (
    <Card
      className="w-full max-w-md border-gray-200 shadow-xl"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Header ── */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle
              style={{ fontFamily: "'Georgia', serif" }}
              className="text-gray-900"
            >
              {term}
            </CardTitle>
            <p className="text-gray-500 mt-1" style={{ fontSize: '0.875rem' }}>
              {definition}
            </p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 -mt-1 -mr-2"
              aria-label="Fechar popover"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 mt-3">
          <Badge variant="secondary" className="bg-teal-50 text-teal-700 gap-1">
            <Layers className="w-3 h-3" /> {flashcardCount} flashcards
          </Badge>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 gap-1">
            <HelpCircle className="w-3 h-3" /> {quizCount} quiz
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      {/* ── Tabs ── */}
      <Tabs defaultValue="notas" className="w-full">
        <TabsList
          className="grid w-full grid-cols-2 mx-4 mt-2"
          style={{ width: 'calc(100% - 2rem)' }}
        >
          <TabsTrigger value="notas" className="gap-1">
            <StickyNote className="w-3 h-3" /> Mis Notas
          </TabsTrigger>
          <TabsTrigger value="diagnostico" className="gap-1">
            <BarChart3 className="w-3 h-3" /> Diagnostico
          </TabsTrigger>
        </TabsList>

        {/* Added by Agent 6 — PRISM — P4: StudentNotesTab */}
        <TabsContent value="notas" className="px-4 pb-2">
          <StudentNotesTab keywordId={keywordId} />
        </TabsContent>

        {/* Added by Agent 6 — PRISM — P4: DiagnosticoTab */}
        <TabsContent value="diagnostico" className="px-4 pb-2">
          <DiagnosticoTab
            pKnow={pKnow}
            flashcardCount={flashcardCount}
            quizCount={quizCount}
            quizAccuracy={quizAccuracy}
          />
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Added by Agent 6 — PRISM — P4: ProfessorNotesTab */}
      <ProfessorNotesTab keywordId={keywordId} />
    </Card>
  );
}

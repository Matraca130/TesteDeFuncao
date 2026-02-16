// ══════════════════════════════════════════════════════════════
// AXON — Curriculum Admin Sub-components barrel
// ══════════════════════════════════════════════════════════════

export type { EditableTopic, EditableSection, EditableSemester } from './curriculum-admin-types';
export { countItems, staticToEditable, genId } from './curriculum-admin-types';
export { InlineEdit, DeleteButton, ContentBadges } from './CurriculumWidgets';
export { TopicNode } from './TopicNode';
export { SectionNode } from './SectionNode';
export { SemesterNode } from './SemesterNode';
export { useCurriculumCrud } from './useCurriculumCrud';

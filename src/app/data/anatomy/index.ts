// ══════════════════════════════════════════════════════════════
// AXON — Anatomia Course Assembly
// Imports region modules and assembles the complete Anatomy course
// ══════════════════════════════════════════════════════════════

import type { Course } from '../course-types';
import { membroSuperiorSections } from './membro-superior';
import { membroInferiorSections } from './membro-inferior';
import { toraxSections } from './torax';

// Re-export individual sections for granular access
export { membroSuperiorSections } from './membro-superior';
export { membroInferiorSections } from './membro-inferior';
export { toraxSections } from './torax';

// Re-export individual named sections
export {
  shoulderSection,
  axillaSection,
  armSection,
  elbowForearmSection,
  handSection,
} from './membro-superior';

export {
  hipSection,
  thighSection,
  kneeSection,
  legSection,
  ankleSection,
  footSection,
} from './membro-inferior';

export {
  heartSection,
  lungsSection,
} from './torax';

export const anatomyCourse: Course = {
  id: 'anatomy',
  name: 'Anatomia',
  color: 'bg-rose-400',
  accentColor: 'text-rose-400',
  semesters: [
    // ════════════════════════════════════════
    // 1o ANO - 1o SEMESTRE
    // ════════════════════════════════════════
    {
      id: 'sem1',
      title: '1o Ano · 1o Semestre',
      year: 1,
      sections: [
        ...membroSuperiorSections,
        ...membroInferiorSections,
      ],
    },
    // ════════════════════════════════════════
    // 1o ANO - 2o SEMESTRE
    // ════════════════════════════════════════
    {
      id: 'sem2',
      title: '1o Ano · 2o Semestre',
      year: 1,
      sections: [
        ...toraxSections,
      ],
    },
  ],
};

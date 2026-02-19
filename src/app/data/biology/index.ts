// ══════════════════════════════════════════════════════════════
// AXON — Biologia Course
// Sections: Celula
// ══════════════════════════════════════════════════════════════

import type { Course, Section } from '../course-types';

// ── CELULA ────────────────────────────────────────────────────
export const cellSection: Section = {
  id: 'cell',
  title: 'Celula',
  topics: [
    {
      id: 'organelles',
      title: 'Organelas',
      summary: 'Estruturas funcionais da celula.',
      flashcards: [
        { id: 1, question: 'Qual organela produz ATP?', answer: 'Mitocondria', mastery: 5 },
        { id: 2, question: 'Qual e a funcao do reticulo endoplasmatico rugoso?', answer: 'Sintese de proteinas', mastery: 4 },
        { id: 3, question: 'Qual organela realiza a digestao intracelular?', answer: 'Lisossomo', mastery: 4 },
      ],
      quizzes: [
        { id: 1, question: 'Qual organela e conhecida como a "usina da celula"?', options: ['Nucleo', 'Mitocondria', 'Lisossomo', 'Complexo de Golgi'], correctAnswer: 1, explanation: 'A mitocondria e responsavel pela producao de ATP.' },
      ],
    },
  ],
};

export const biologyCourse: Course = {
  id: 'biology',
  name: 'Biologia',
  color: 'bg-green-500',
  accentColor: 'text-green-500',
  semesters: [
    {
      id: 'sem1',
      title: '1o Ano · 1o Semestre',
      year: 1,
      sections: [
        cellSection,
      ],
    },
  ],
};

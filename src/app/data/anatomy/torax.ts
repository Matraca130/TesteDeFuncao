// ══════════════════════════════════════════════════════════════
// AXON — Anatomia: Torax
// Sections: Coracao, Pulmoes
// ══════════════════════════════════════════════════════════════

import type { Section } from '../course-types';

// ── CORACAO ───────────────────────────────────────────────────
export const heartSection: Section = {
  id: 'heart-section',
  title: 'Coracao',
  region: 'Torax',
  topics: [
    {
      id: 'heart',
      title: 'Coracao',
      summary: 'O coracao bombeia sangue para todo o corpo.',
      flashcards: [
        { id: 1, question: 'Quantas camaras tem o coracao?', answer: '4 camaras: 2 atrios e 2 ventriculos', mastery: 5 },
        { id: 2, question: 'O que caracteriza a sistole ventricular?', answer: 'Contracao dos ventriculos e ejecao de sangue para as grandes arterias', mastery: 4 },
        { id: 3, question: 'Qual valva separa o atrio esquerdo do ventriculo esquerdo?', answer: 'Valva mitral (bicuspide)', mastery: 3 },
        { id: 4, question: 'Qual arteria irriga o musculo cardiaco?', answer: 'Arterias coronarias (direita e esquerda)', mastery: 4 },
      ],
      quizzes: [
        { id: 1, question: 'Qual camara do coracao possui a parede mais espessa?', options: ['Atrio direito', 'Atrio esquerdo', 'Ventriculo direito', 'Ventriculo esquerdo'], correctAnswer: 3, explanation: 'O ventriculo esquerdo precisa gerar pressao para bombear sangue para todo o corpo.' },
      ],
    },
  ],
};

// ── PULMOES ───────────────────────────────────────────────────
export const lungsSection: Section = {
  id: 'lungs-section',
  title: 'Pulmoes',
  region: 'Torax',
  topics: [
    {
      id: 'lungs',
      title: 'Pulmoes',
      summary: 'Os pulmoes realizam as trocas gasosas.',
      flashcards: [
        { id: 1, question: 'Quantos lobos tem o pulmao direito?', answer: '3 lobos: superior, medio e inferior', mastery: 5 },
        { id: 2, question: 'Quantos lobos tem o pulmao esquerdo?', answer: '2 lobos: superior e inferior', mastery: 5 },
        { id: 3, question: 'Qual a funcao dos alveolos pulmonares?', answer: 'Realizar as trocas gasosas (hematose)', mastery: 4 },
        { id: 4, question: 'O que e a pleura?', answer: 'Membrana serosa que reveste os pulmoes e a cavidade toracica', mastery: 3 },
      ],
      quizzes: [
        { id: 1, question: 'Por que o pulmao esquerdo e menor que o direito?', options: ['Presenca do figado', 'Presenca do coracao', 'Presenca do estomago', 'Presenca do baco'], correctAnswer: 1, explanation: 'O pulmao esquerdo e menor para acomodar o coracao.' },
      ],
    },
  ],
};

/** All thorax sections in order */
export const toraxSections: Section[] = [
  heartSection,
  lungsSection,
];

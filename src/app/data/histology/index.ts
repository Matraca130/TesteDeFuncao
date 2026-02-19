// ══════════════════════════════════════════════════════════════
// AXON — Histologia Course
// Sections: Tecido Epitelial, Tecido Conjuntivo, Tecido Muscular
// ══════════════════════════════════════════════════════════════

import type { Course, Section } from '../course-types';

// ── TECIDO EPITELIAL ──────────────────────────────────────────
export const epithelialSection: Section = {
  id: 'epithelial',
  title: 'Tecido Epitelial',
  topics: [
    {
      id: 'simple',
      title: 'Epitelio Simples',
      summary: 'Camada unica de celulas com funcoes de absorcao e secrecao.',
      flashcards: [
        { id: 1, question: 'O que caracteriza o epitelio simples?', answer: 'Uma unica camada de celulas apoiadas na lamina basal', mastery: 5 },
        { id: 2, question: 'Onde e encontrado o epitelio simples pavimentoso?', answer: 'Alveolos pulmonares, endotelio vascular e mesotelio', mastery: 3 },
        { id: 3, question: 'Qual e a funcao do epitelio simples cubico?', answer: 'Secrecao e absorcao (ex: tubulos renais)', mastery: 4 },
      ],
      quizzes: [
        { id: 1, question: 'Qual tipo de epitelio simples reveste os intestinos?', options: ['Pavimentoso', 'Cubico', 'Colunar', 'Pseudoestratificado'], correctAnswer: 2, explanation: 'O epitelio simples colunar com microvilosidades reveste o intestino.' },
      ],
    },
    {
      id: 'stratified',
      title: 'Epitelio Estratificado',
      summary: 'Multiplas camadas de celulas com funcao de protecao.',
      flashcards: [
        { id: 1, question: 'O que caracteriza o epitelio estratificado?', answer: 'Multiplas camadas de celulas sobrepostas', mastery: 5 },
        { id: 2, question: 'Onde e encontrado o epitelio estratificado pavimentoso queratinizado?', answer: 'Pele (epiderme)', mastery: 5 },
        { id: 3, question: 'Qual e a funcao principal do epitelio estratificado?', answer: 'Protecao contra agressoes mecanicas e quimicas', mastery: 4 },
      ],
      quizzes: [
        { id: 1, question: 'Qual estrutura possui epitelio estratificado pavimentoso nao-queratinizado?', options: ['Pele', 'Esofago', 'Intestino', 'Traqueia'], correctAnswer: 1, explanation: 'O esofago e revestido por epitelio estratificado pavimentoso nao-queratinizado.' },
      ],
    },
  ],
};

// ── TECIDO CONJUNTIVO ─────────────────────────────────────────
export const connectiveSection: Section = {
  id: 'connective',
  title: 'Tecido Conjuntivo',
  topics: [
    {
      id: 'proper',
      title: 'Conjuntivo Propriamente Dito',
      summary: 'O tecido mais abundante.',
      flashcards: [
        { id: 1, question: 'Quais sao os dois tipos de tecido conjuntivo propriamente dito?', answer: 'Frouxo (areolar) e denso (modelado e nao modelado)', mastery: 3 },
        { id: 2, question: 'Qual e a celula mais abundante do tecido conjuntivo?', answer: 'Fibroblasto', mastery: 4 },
        { id: 3, question: 'Quais sao os tres tipos de fibras do conjuntivo?', answer: 'Colagenas, elasticas e reticulares', mastery: 2 },
      ],
      quizzes: [],
    },
    {
      id: 'cartilage',
      title: 'Tecido Cartilaginoso',
      summary: 'Tecido rigido mas flexivel, sem vasos sanguineos.',
      flashcards: [
        { id: 1, question: 'Quais sao os tres tipos de cartilagem?', answer: 'Hialina, elastica e fibrocartilagem', mastery: 4 },
        { id: 2, question: 'Onde encontramos cartilagem hialina?', answer: 'Traqueia, bronquios, nariz, costelas e superficies articulares', mastery: 3 },
        { id: 3, question: 'Por que a cartilagem se regenera lentamente?', answer: 'E avascular', mastery: 2 },
      ],
      quizzes: [],
    },
  ],
};

// ── TECIDO MUSCULAR ───────────────────────────────────────────
export const muscleSection: Section = {
  id: 'muscle',
  title: 'Tecido Muscular',
  topics: [
    {
      id: 'skeletal',
      title: 'Muscular Estriado Esqueletico',
      summary: 'Musculos voluntarios ligados aos ossos.',
      flashcards: [
        { id: 1, question: 'Qual a caracteristica histologica marcante do musculo esqueletico?', answer: 'Fibras multinucleadas com estriacoes transversais', mastery: 4 },
        { id: 2, question: 'O que e o sarcomero?', answer: 'Unidade contratil delimitada por duas linhas Z', mastery: 3 },
        { id: 3, question: 'Qual proteina forma os filamentos grossos?', answer: 'Miosina', mastery: 5 },
      ],
      quizzes: [],
    },
    {
      id: 'cardiac',
      title: 'Muscular Estriado Cardiaco',
      summary: 'Musculo involuntario do coracao.',
      flashcards: [
        { id: 1, question: 'O que sao discos intercalares?', answer: 'Juncoes especializadas entre cardiomiocitos', mastery: 3 },
        { id: 2, question: 'Quantos nucleos tem o cardiomiocito?', answer: 'Um ou dois nucleos centrais', mastery: 4 },
      ],
      quizzes: [],
    },
  ],
};

export const histologyCourse: Course = {
  id: 'histology',
  name: 'Histologia',
  color: 'bg-indigo-500',
  accentColor: 'text-indigo-500',
  semesters: [
    {
      id: 'sem1',
      title: '1o Ano · 1o Semestre',
      year: 1,
      sections: [
        epithelialSection,
        connectiveSection,
        muscleSection,
      ],
    },
  ],
};

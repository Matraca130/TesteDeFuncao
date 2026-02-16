// ══════════════════════════════════════════════════════════════
// AXON — Course Type Definitions
// Hierarchy: Course -> Semester (with year) -> Section (with region) -> Topic
// ══════════════════════════════════════════════════════════════

export type QuizQuestionType = 'multiple-choice' | 'write-in' | 'fill-blank';

export interface QuizQuestion {
  id: number;
  type?: QuizQuestionType;
  question: string;
  options?: string[];
  correctAnswer?: number;
  correctText?: string;
  acceptedVariations?: string[];
  blankSentence?: string;
  blankAnswer?: string;
  hint?: string;
  explanation?: string;
}

export interface FlashcardImagePosition {
  x: number;      // horizontal offset percentage (0-100, default 50 = centered)
  y: number;      // vertical offset percentage (0-100, default 50 = centered)
  scale: number;  // zoom level (0.5 to 2.0, default 1.0)
}

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  mastery: number;
  image?: string;
  imagePosition?: FlashcardImagePosition;  // Fase 3: drag-to-position in admin
}

export interface Model3D {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  videoUrl?: string;
  flashcards?: Flashcard[];
  quizzes?: QuizQuestion[];
  model3D?: Model3D;
  subtopics?: Topic[];  // Nested sub-topics (folders within folders)
}

export interface Section {
  id: string;
  title: string;
  region?: string;   // Grouping: "Membro Superior", "Membro Inferior", "Torax", etc.
  imageUrl?: string;
  topics: Topic[];
}

export interface Semester {
  id: string;
  title: string;
  year?: number;      // 1 = 1o Ano, 2 = 2o Ano, etc.
  sections: Section[];
}

export interface Course {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  semesters: Semester[];
}

export type TopicSubcategory = 'Visao Geral' | 'Aparelho Locomotor' | 'Neurovascular';

// ══════════════════════════════════════════════════════════════
// AXON — Course Data Model
// Hierarchy: Course → Semester (with year) → Section (with region) → Topic
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

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  mastery: number;
  image?: string;
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

// ══════════════════════════════════════════════════════════════
// STANDARD ANATOMY TOPIC PATTERN
// Each sub-region follows: Visao Geral, Artrologia, Musculatura, Vascularizacao, Inervacao
// ══════════════════════════════════════════════════════════════

// NOTE: The full static course data is maintained in the repository.
// This file is pushed with interfaces + helpers only to avoid size limits.
// The static data (courses array) remains unchanged from the previous commit.
// See the full file in the Figma Make instance.

export const courses: Course[] = [];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

export type TopicSubcategory = 'Visao Geral' | 'Aparelho Locomotor' | 'Neurovascular';

/** Derive a subcategory from a topic's ID/title pattern */
export function getTopicSubcategory(topic: Topic): TopicSubcategory {
  const id = topic.id.toLowerCase();
  const title = topic.title.toLowerCase();

  if (
    id.includes('artrologia') || id.includes('musculatura') || id.includes('compartment') ||
    title.includes('artrologia') || title.includes('musculatura') || title.includes('compartimento')
  ) {
    return 'Aparelho Locomotor';
  }
  if (
    id.includes('vasc') || id.includes('nerves') || id.includes('inerv') ||
    title.includes('vasculariz') || title.includes('inervac')
  ) {
    return 'Neurovascular';
  }
  return 'Visao Geral';
}

/** Subcategory display config */
export const SUBCATEGORY_CONFIG: Record<TopicSubcategory, { label: string; color: string; dot: string }> = {
  'Visao Geral':        { label: 'Visao Geral',        color: 'text-sky-600',    dot: 'bg-sky-400' },
  'Aparelho Locomotor': { label: 'Aparelho Locomotor',  color: 'text-amber-600',  dot: 'bg-amber-400' },
  'Neurovascular':      { label: 'Neurovascular',       color: 'text-violet-600', dot: 'bg-violet-400' },
};

/** Group a section's topics by derived subcategory, preserving order */
export function groupTopicsBySubcategory(topics: Topic[]): { subcategory: TopicSubcategory; topics: Topic[] }[] {
  const order: TopicSubcategory[] = ['Visao Geral', 'Aparelho Locomotor', 'Neurovascular'];
  const groups = new Map<TopicSubcategory, Topic[]>();

  for (const topic of topics) {
    const sub = getTopicSubcategory(topic);
    if (!groups.has(sub)) groups.set(sub, []);
    groups.get(sub)!.push(topic);
  }

  return order.filter(s => groups.has(s)).map(s => ({ subcategory: s, topics: groups.get(s)! }));
}

/** Group sections by region for display purposes */
export function groupSectionsByRegion(sections: Section[]): { region: string; sections: Section[] }[] {
  const groups: { region: string; sections: Section[] }[] = [];
  const seen = new Map<string, Section[]>();

  for (const sec of sections) {
    const region = sec.region || 'Geral';
    if (!seen.has(region)) {
      const group = { region, sections: [sec] };
      groups.push(group);
      seen.set(region, group.sections);
    } else {
      seen.get(region)!.push(sec);
    }
  }

  return groups;
}

/** Flatten all topics from a course (utility) */
export function getAllTopics(course: Course): Topic[] {
  return course.semesters.flatMap(sem =>
    sem.sections.flatMap(sec => sec.topics)
  );
}

/** Flatten topics including subtopics into a single list of leaf-level items */
export function flattenTopicsWithSubtopics(topics: Topic[]): Topic[] {
  return topics.flatMap(t => t.subtopics && t.subtopics.length > 0 ? t.subtopics : [t]);
}

/** Find a static topic by ID across all courses (searches subtopics too) */
export function findStaticTopic(courseId: string, topicId: string): Topic | undefined {
  const course = courses.find(c => c.id === courseId);
  if (!course) return undefined;
  for (const sem of course.semesters) {
    for (const sec of sem.sections) {
      for (const t of sec.topics) {
        if (t.id === topicId) return t;
        if (t.subtopics) {
          const sub = t.subtopics.find(st => st.id === topicId);
          if (sub) return sub;
        }
      }
    }
  }
  return undefined;
}

// ══════════════════════════════════════════════════════════════
// AXON — Course Data (assembled) + barrel re-exports
// Split: course-types.ts (types), course-helpers.ts (helpers)
// Data:  anatomy/, histology/, biology/
// ══════════════════════════════════════════════════════════════

// Re-export all types (backward compatible — all 'from courses' imports still work)
export type {
  QuizQuestionType,
  QuizQuestion,
  Flashcard,
  FlashcardImagePosition,
  Model3D,
  Topic,
  Section,
  Semester,
  Course,
  TopicSubcategory,
} from './course-types';

import type { Course, Topic } from './course-types';

// Re-export all helpers (backward compatible)
export {
  getTopicSubcategory,
  SUBCATEGORY_CONFIG,
  groupTopicsBySubcategory,
  groupSectionsByRegion,
  getAllTopics,
  flattenTopicsWithSubtopics,
} from './course-helpers';

// Import assembled courses
import { anatomyCourse } from './anatomy';
import { histologyCourse } from './histology';
import { biologyCourse } from './biology';

// Re-export individual courses for direct access
export { anatomyCourse } from './anatomy';
export { histologyCourse } from './histology';
export { biologyCourse } from './biology';

// ══════════════════════════════════════════════════════════════
// ASSEMBLED COURSES ARRAY
// ══════════════════════════════════════════════════════════════

export const courses: Course[] = [
  anatomyCourse,
  histologyCourse,
  biologyCourse,
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

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

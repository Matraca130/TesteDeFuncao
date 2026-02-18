// ================================================================
// kv-keys.tsx — Namespace wrapper for routes-content.tsx
// ================================================================
// routes-content.tsx imports { KV } from "./kv-keys.tsx" and uses
// a namespace pattern: KV.course(id), KV.IDX.courseOfInst(...),
// KV.PREFIX.coursesOfInst(...).
//
// The canonical source of truth remains kv-keys.ts (individual
// exports). This file is a THIN WRAPPER that maps those exports
// into the KV namespace object.
//
// Other route files (quiz, reviews, sessions, flashcards, reading,
// dashboard) import directly from kv-keys.ts — they do NOT use
// this wrapper.
// ================================================================
import {
  // Primary keys
  courseKey,
  semesterKey,
  sectionKey,
  topicKey,
  subtopicKey,
  summaryKey,
  chunkKey,
  kwKey,
  kwInstKey,
  instKey,
  memberKey,
  connKey,
  fcKey,
  quizKey,
  // Index keys
  idxInstCourses,
  idxCourseSemesters,
  idxSemesterSections,
  idxSectionTopics,
  idxTopicSummaries,
  idxSummaryChunks,
  idxInstKw,
  idxSummaryKw,
  idxKwSummaries,
  idxKwSubtopics,
  idxKwConn,
  idxInstMembers,
  idxUserInsts,
  // Prefixes
  KV_PREFIXES,
} from "./kv-keys.ts";

// ── Primary key mapping ─────────────────────────────────────
const primaryKeys = {
  course: courseKey,
  semester: semesterKey,
  section: sectionKey,
  topic: topicKey,
  subtopic: subtopicKey,
  summary: summaryKey,
  chunk: chunkKey,
  keyword: kwKey,
  keywordInstance: kwInstKey,
  institution: instKey,
  membership: memberKey,
  connection: connKey,
  flashcard: fcKey,
  quizQuestion: quizKey,
};

// ── Index key mapping ───────────────────────────────────────
const IDX = {
  courseOfInst: idxInstCourses,
  semesterOfCourse: idxCourseSemesters,
  sectionOfSemester: idxSemesterSections,
  topicOfSection: idxSectionTopics,
  summaryOfTopic: idxTopicSummaries,
  chunkOfSummary: idxSummaryChunks,
  keywordOfInst: idxInstKw,
  keywordOfSummary: idxSummaryKw,
  summaryOfKeyword: idxKwSummaries,
  subtopicOfKeyword: idxKwSubtopics,
  connectionOfKeyword: idxKwConn,
  memberOfInst: idxInstMembers,
  instOfUser: idxUserInsts,
};

// ── Prefix builder mapping ──────────────────────────────────
// Each function returns the prefix string + parentId + ":"
// for use with kv.getByPrefix()
const PREFIX = {
  coursesOfInst: (instId: string) =>
    KV_PREFIXES.IDX_INST_COURSES + instId + ":",
  semestersOfCourse: (courseId: string) =>
    KV_PREFIXES.IDX_COURSE_SEMESTERS + courseId + ":",
  sectionsOfSemester: (semId: string) =>
    KV_PREFIXES.IDX_SEMESTER_SECTIONS + semId + ":",
  topicsOfSection: (secId: string) =>
    KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":",
  summariesOfTopic: (topicId: string) =>
    KV_PREFIXES.IDX_TOPIC_SUMMARIES + topicId + ":",
  chunksOfSummary: (summaryId: string) =>
    KV_PREFIXES.IDX_SUMMARY_CHUNKS + summaryId + ":",
  keywordsOfSummary: (summaryId: string) =>
    KV_PREFIXES.IDX_SUMMARY_KW + summaryId + ":",
  keywordsOfInst: (instId: string) =>
    KV_PREFIXES.IDX_INST_KW + instId + ":",
  subtopicsOfKeyword: (kwId: string) =>
    KV_PREFIXES.IDX_KW_SUBTOPICS + kwId + ":",
  membersOfInst: (instId: string) =>
    KV_PREFIXES.IDX_INST_MEMBERS + instId + ":",
  connectionsOfKeyword: (kwId: string) =>
    KV_PREFIXES.IDX_KW_CONN + kwId + ":",
  summariesOfKeyword: (kwId: string) =>
    KV_PREFIXES.IDX_KW_SUMMARIES + kwId + ":",
};

// ── Exported namespace ──────────────────────────────────────
export const KV = {
  ...primaryKeys,
  IDX,
  PREFIX,
};

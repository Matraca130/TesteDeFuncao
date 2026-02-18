// ═══════════════════════════════════════════════════════════════
// kv-keys.tsx — Compatibility Wrapper
// routes-content.tsx imports { KV } from this file.
// Maps the KV namespace API → flat functions in kv-keys.ts.
// DO NOT DELETE without updating routes-content.tsx imports.
// ═══════════════════════════════════════════════════════════════
import {
  // Primary keys
  courseKey, semesterKey, sectionKey, topicKey,
  summaryKey, chunkKey, kwKey, kwInstKey, subtopicKey,
  connKey, instKey, memberKey, fcKey, quizKey, model3dKey,
  // Index keys
  idxInstCourses, idxCourseSemesters, idxSemesterSections,
  idxSectionTopics, idxTopicSummaries, idxSummaryChunks,
  idxSummaryKw, idxKwSummaries, idxInstKw, idxKwSubtopics,
  idxKwConn, idxInstMembers, idxUserInsts,
  idxSummaryModel3d, idxTopicModel3d, idxKwModel3d,
  // Prefixes
  KV_PREFIXES,
} from "./kv-keys.ts";

export const KV = {
  // Primary keys
  course: courseKey,
  semester: semesterKey,
  section: sectionKey,
  topic: topicKey,
  summary: summaryKey,
  chunk: chunkKey,
  keyword: kwKey,
  keywordInstance: kwInstKey,
  subtopic: subtopicKey,
  connection: connKey,
  institution: instKey,
  membership: memberKey,
  flashcard: fcKey,
  quizQuestion: quizKey,
  model3d: model3dKey,

  // Index keys
  IDX: {
    courseOfInst: idxInstCourses,
    semesterOfCourse: idxCourseSemesters,
    sectionOfSemester: idxSemesterSections,
    topicOfSection: idxSectionTopics,
    summaryOfTopic: idxTopicSummaries,
    chunkOfSummary: idxSummaryChunks,
    keywordOfSummary: idxSummaryKw,
    summaryOfKeyword: idxKwSummaries,
    keywordOfInst: idxInstKw,
    subtopicOfKeyword: idxKwSubtopics,
    connectionOfKeyword: idxKwConn,
    memberOfInst: idxInstMembers,
    instOfUser: idxUserInsts,
    summaryModel3d: idxSummaryModel3d,
    topicModel3d: idxTopicModel3d,
    kwModel3d: idxKwModel3d,
  },

  // Prefix functions (for getByPrefix queries)
  PREFIX: {
    coursesOfInst:      (instId: string) => KV_PREFIXES.IDX_INST_COURSES + instId + ":",
    semestersOfCourse:  (courseId: string) => KV_PREFIXES.IDX_COURSE_SEMESTERS + courseId + ":",
    sectionsOfSemester: (semId: string) => KV_PREFIXES.IDX_SEMESTER_SECTIONS + semId + ":",
    topicsOfSection:    (secId: string) => KV_PREFIXES.IDX_SECTION_TOPICS + secId + ":",
    summariesOfTopic:   (topicId: string) => KV_PREFIXES.IDX_TOPIC_SUMMARIES + topicId + ":",
    chunksOfSummary:    (sumId: string) => KV_PREFIXES.IDX_SUMMARY_CHUNKS + sumId + ":",
    keywordsOfSummary:  (sumId: string) => KV_PREFIXES.IDX_SUMMARY_KW + sumId + ":",
    summariesOfKeyword: (kwId: string) => KV_PREFIXES.IDX_KW_SUMMARIES + kwId + ":",
    keywordsOfInst:     (instId: string) => KV_PREFIXES.IDX_INST_KW + instId + ":",
    subtopicsOfKeyword: (kwId: string) => KV_PREFIXES.IDX_KW_SUBTOPICS + kwId + ":",
    connectionsOfKeyword: (kwId: string) => KV_PREFIXES.IDX_KW_CONN + kwId + ":",
    membersOfInst:      (instId: string) => KV_PREFIXES.IDX_INST_MEMBERS + instId + ":",
  },
} as const;

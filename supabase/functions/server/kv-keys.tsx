// ============================================================
// Axon v4.2 — KV Key Builders
// Matches kv-schema.ts contract (27 primary + 30 indices)
// Extended by Dev 3 with flashcard/review/session/BKT/FSRS keys
// ============================================================

export const KV = {
  // ── Primary keys ──
  institution: (id: string) => `inst:${id}`,
  membership: (instId: string, userId: string) => `membership:${instId}:${userId}`,
  user: (id: string) => `user:${id}`,
  course: (id: string) => `course:${id}`,
  semester: (id: string) => `semester:${id}`,
  section: (id: string) => `section:${id}`,
  topic: (id: string) => `topic:${id}`,
  summary: (id: string) => `summary:${id}`,
  chunk: (id: string) => `chunk:${id}`,
  keyword: (id: string) => `kw:${id}`,
  keywordInstance: (id: string) => `kw-inst:${id}`,
  subtopic: (id: string) => `subtopic:${id}`,
  connection: (id: string) => `conn:${id}`,
  flashcard: (id: string) => `fc:${id}`,
  quizQuestion: (id: string) => `quiz-q:${id}`,
  aiDraft: (id: string) => `ai-draft:${id}`,

  // ── Dev 3: Learning state primary keys ──
  bkt: (userId: string, subtopicId: string) => `bkt:${userId}:${subtopicId}`,
  fsrs: (userId: string, cardId: string) => `fsrs:${userId}:${cardId}`,
  review: (id: string) => `review:${id}`,
  session: (id: string) => `session:${id}`,

  // ── Index keys (value = child ID) ──
  IDX: {
    courseOfInst: (instId: string, courseId: string) =>
      `idx:inst-courses:${instId}:${courseId}`,
    memberOfInst: (instId: string, userId: string) =>
      `idx:inst-members:${instId}:${userId}`,
    instOfUser: (userId: string, instId: string) =>
      `idx:user-insts:${userId}:${instId}`,
    semesterOfCourse: (courseId: string, semId: string) =>
      `idx:course-semesters:${courseId}:${semId}`,
    sectionOfSemester: (semId: string, secId: string) =>
      `idx:semester-sections:${semId}:${secId}`,
    topicOfSection: (secId: string, topicId: string) =>
      `idx:section-topics:${secId}:${topicId}`,
    summaryOfTopic: (topicId: string, summaryId: string) =>
      `idx:topic-summaries:${topicId}:${summaryId}`,
    chunkOfSummary: (summaryId: string, sortOrder: number) =>
      `idx:summary-chunks:${summaryId}:${String(sortOrder).padStart(6, "0")}`,
    keywordOfInst: (instId: string, kwId: string) =>
      `idx:inst-kw:${instId}:${kwId}`,
    keywordOfSummary: (summaryId: string, kwId: string) =>
      `idx:summary-kw:${summaryId}:${kwId}`,
    summaryOfKeyword: (kwId: string, summaryId: string) =>
      `idx:kw-summaries:${kwId}:${summaryId}`,
    subtopicOfKeyword: (kwId: string, stId: string) =>
      `idx:kw-subtopics:${kwId}:${stId}`,
    connectionOfKeyword: (kwId: string, connId: string) =>
      `idx:kw-conn:${kwId}:${connId}`,
    flashcardOfKeyword: (kwId: string, fcId: string) =>
      `idx:kw-fc:${kwId}:${fcId}`,
    quizOfKeyword: (kwId: string, qId: string) =>
      `idx:kw-quiz:${kwId}:${qId}`,

    // ── Dev 3: Flashcard indices ──
    flashcardOfSummary: (summaryId: string, fcId: string) =>
      `idx:summary-fc:${summaryId}:${fcId}`,

    // ── Dev 3: Learning state indices ──
    sessionReview: (sessionId: string, reviewId: string) =>
      `idx:session-reviews:${sessionId}:${reviewId}`,
    studentKwBkt: (userId: string, kwId: string, subtopicId: string) =>
      `idx:student-kw-bkt:${userId}:${kwId}:${subtopicId}`,
    studentBkt: (userId: string, subtopicId: string) =>
      `idx:student-bkt:${userId}:${subtopicId}`,
    studentFsrs: (userId: string, cardId: string) =>
      `idx:student-fsrs:${userId}:${cardId}`,
    dueCard: (userId: string, date: string, cardId: string) =>
      `idx:due:${userId}:${date}:${cardId}`,
    studentSession: (userId: string, sessionId: string) =>
      `idx:student-sessions:${userId}:${sessionId}`,
  },

  // ── Prefix queries (for getByPrefix) ──
  PREFIX: {
    coursesOfInst: (instId: string) => `idx:inst-courses:${instId}:`,
    membersOfInst: (instId: string) => `idx:inst-members:${instId}:`,
    instsOfUser: (userId: string) => `idx:user-insts:${userId}:`,
    semestersOfCourse: (courseId: string) => `idx:course-semesters:${courseId}:`,
    sectionsOfSemester: (semId: string) => `idx:semester-sections:${semId}:`,
    topicsOfSection: (secId: string) => `idx:section-topics:${secId}:`,
    summariesOfTopic: (topicId: string) => `idx:topic-summaries:${topicId}:`,
    chunksOfSummary: (summaryId: string) => `idx:summary-chunks:${summaryId}:`,
    keywordsOfInst: (instId: string) => `idx:inst-kw:${instId}:`,
    keywordsOfSummary: (summaryId: string) => `idx:summary-kw:${summaryId}:`,
    summariesOfKeyword: (kwId: string) => `idx:kw-summaries:${kwId}:`,
    subtopicsOfKeyword: (kwId: string) => `idx:kw-subtopics:${kwId}:`,
    connectionsOfKeyword: (kwId: string) => `idx:kw-conn:${kwId}:`,
    flashcardsOfKeyword: (kwId: string) => `idx:kw-fc:${kwId}:`,
    quizOfKeyword: (kwId: string) => `idx:kw-quiz:${kwId}:`,

    // ── Dev 3: Flashcard prefixes ──
    flashcardsOfSummary: (summaryId: string) => `idx:summary-fc:${summaryId}:`,

    // ── Dev 3: Learning state prefixes ──
    reviewsOfSession: (sessionId: string) => `idx:session-reviews:${sessionId}:`,
    bktOfStudentKw: (userId: string, kwId: string) => `idx:student-kw-bkt:${userId}:${kwId}:`,
    bktOfStudent: (userId: string) => `idx:student-bkt:${userId}:`,
    fsrsOfStudent: (userId: string) => `idx:student-fsrs:${userId}:`,
    dueCardsOfStudent: (userId: string) => `idx:due:${userId}:`,
    sessionsOfStudent: (userId: string) => `idx:student-sessions:${userId}:`,
  },
};

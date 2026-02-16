import * as kv from "./kv_store.tsx";

// ============================================================
// Seed Demo Student Data for Axon
// ============================================================

const STUDENT_ID = "demo-student-001";

export async function seedStudentData() {
  console.log("Seeding demo student data...");

  // ── 1. Student Profile ──────────────────────────────────
  await kv.set(`student:${STUDENT_ID}:profile`, {
    id: STUDENT_ID,
    name: "Lucas Mendes",
    email: "lucas.mendes@med.university.br",
    avatarUrl: "",
    university: "Universidade Federal de Medicina",
    course: "Medicina",
    semester: 3,
    enrolledCourseIds: ["anatomy", "histology"],
    createdAt: "2025-02-01T08:00:00Z",
    preferences: {
      theme: "light",
      language: "pt-BR",
      dailyGoalMinutes: 120,
      notificationsEnabled: true,
      spacedRepetitionAlgorithm: "sm2",
    },
  });

  // ── 2. Student Stats ────────────────────────────────────
  await kv.set(`student:${STUDENT_ID}:stats`, {
    totalStudyMinutes: 4830,
    totalSessions: 147,
    totalCardsReviewed: 1243,
    totalQuizzesCompleted: 38,
    currentStreak: 12,
    longestStreak: 23,
    averageDailyMinutes: 68,
    lastStudyDate: "2026-02-14T18:30:00Z",
    weeklyActivity: [85, 92, 45, 110, 78, 60, 30], // Mon-Sun (this week)
  });

  // ── 3. Course Progress — Anatomia ───────────────────────
  await kv.set(`student:${STUDENT_ID}:course:anatomy`, {
    courseId: "anatomy",
    courseName: "Anatomia",
    masteryPercent: 72,
    lessonsCompleted: 18,
    lessonsTotal: 28,
    flashcardsMastered: 89,
    flashcardsTotal: 134,
    quizAverageScore: 78,
    lastAccessedAt: "2026-02-14T16:00:00Z",
    topicProgress: [
      {
        topicId: "shoulder",
        topicTitle: "Ombro e Axila",
        sectionId: "upper-limb",
        sectionTitle: "Membro Superior",
        masteryPercent: 88,
        flashcardsDue: 2,
        lastReviewedAt: "2026-02-14T10:00:00Z",
        nextReviewAt: "2026-02-17T10:00:00Z",
        reviewCount: 14,
      },
      {
        topicId: "arm",
        topicTitle: "Braço",
        sectionId: "upper-limb",
        sectionTitle: "Membro Superior",
        masteryPercent: 75,
        flashcardsDue: 3,
        lastReviewedAt: "2026-02-13T14:00:00Z",
        nextReviewAt: "2026-02-15T14:00:00Z",
        reviewCount: 10,
      },
      {
        topicId: "forearm",
        topicTitle: "Antebraço",
        sectionId: "upper-limb",
        sectionTitle: "Membro Superior",
        masteryPercent: 62,
        flashcardsDue: 5,
        lastReviewedAt: "2026-02-12T09:00:00Z",
        nextReviewAt: "2026-02-14T09:00:00Z",
        reviewCount: 7,
      },
      {
        topicId: "elbow",
        topicTitle: "Cotovelo",
        sectionId: "upper-limb",
        sectionTitle: "Membro Superior",
        masteryPercent: 80,
        flashcardsDue: 1,
        lastReviewedAt: "2026-02-14T11:00:00Z",
        nextReviewAt: "2026-02-18T11:00:00Z",
        reviewCount: 9,
      },
      {
        topicId: "hand",
        topicTitle: "Mão",
        sectionId: "upper-limb",
        sectionTitle: "Membro Superior",
        masteryPercent: 55,
        flashcardsDue: 6,
        lastReviewedAt: "2026-02-11T16:00:00Z",
        nextReviewAt: "2026-02-14T16:00:00Z",
        reviewCount: 5,
      },
      {
        topicId: "thigh",
        topicTitle: "Coxa",
        sectionId: "lower-limb",
        sectionTitle: "Membro Inferior",
        masteryPercent: 70,
        flashcardsDue: 4,
        lastReviewedAt: "2026-02-13T10:00:00Z",
        nextReviewAt: "2026-02-16T10:00:00Z",
        reviewCount: 8,
      },
      {
        topicId: "leg",
        topicTitle: "Perna",
        sectionId: "lower-limb",
        sectionTitle: "Membro Inferior",
        masteryPercent: 68,
        flashcardsDue: 3,
        lastReviewedAt: "2026-02-12T15:00:00Z",
        nextReviewAt: "2026-02-15T15:00:00Z",
        reviewCount: 6,
      },
      {
        topicId: "foot",
        topicTitle: "Pé",
        sectionId: "lower-limb",
        sectionTitle: "Membro Inferior",
        masteryPercent: 45,
        flashcardsDue: 5,
        lastReviewedAt: "2026-02-10T09:00:00Z",
        nextReviewAt: "2026-02-13T09:00:00Z",
        reviewCount: 3,
      },
      {
        topicId: "heart",
        topicTitle: "Coração",
        sectionId: "thorax",
        sectionTitle: "Tórax",
        masteryPercent: 82,
        flashcardsDue: 2,
        lastReviewedAt: "2026-02-14T14:00:00Z",
        nextReviewAt: "2026-02-18T14:00:00Z",
        reviewCount: 11,
      },
      {
        topicId: "lungs",
        topicTitle: "Pulmões",
        sectionId: "thorax",
        sectionTitle: "Tórax",
        masteryPercent: 78,
        flashcardsDue: 3,
        lastReviewedAt: "2026-02-13T16:00:00Z",
        nextReviewAt: "2026-02-16T16:00:00Z",
        reviewCount: 9,
      },
    ],
  });

  // ── 4. Course Progress — Histologia ─────────────────────
  await kv.set(`student:${STUDENT_ID}:course:histology`, {
    courseId: "histology",
    courseName: "Histologia",
    masteryPercent: 58,
    lessonsCompleted: 6,
    lessonsTotal: 12,
    flashcardsMastered: 34,
    flashcardsTotal: 62,
    quizAverageScore: 71,
    lastAccessedAt: "2026-02-13T14:00:00Z",
    topicProgress: [
      {
        topicId: "simple",
        topicTitle: "Epitélio Simples",
        sectionId: "epithelial",
        sectionTitle: "Tecido Epitelial",
        masteryPercent: 72,
        flashcardsDue: 2,
        lastReviewedAt: "2026-02-13T11:00:00Z",
        nextReviewAt: "2026-02-16T11:00:00Z",
        reviewCount: 8,
      },
      {
        topicId: "stratified",
        topicTitle: "Epitélio Estratificado",
        sectionId: "epithelial",
        sectionTitle: "Tecido Epitelial",
        masteryPercent: 65,
        flashcardsDue: 3,
        lastReviewedAt: "2026-02-12T10:00:00Z",
        nextReviewAt: "2026-02-15T10:00:00Z",
        reviewCount: 6,
      },
      {
        topicId: "proper",
        topicTitle: "Conjuntivo Propriamente Dito",
        sectionId: "connective",
        sectionTitle: "Tecido Conjuntivo",
        masteryPercent: 50,
        flashcardsDue: 5,
        lastReviewedAt: "2026-02-11T14:00:00Z",
        nextReviewAt: "2026-02-14T14:00:00Z",
        reviewCount: 4,
      },
      {
        topicId: "adipose",
        topicTitle: "Tecido Adiposo",
        sectionId: "connective",
        sectionTitle: "Tecido Conjuntivo",
        masteryPercent: 42,
        flashcardsDue: 4,
        lastReviewedAt: "2026-02-10T15:00:00Z",
        nextReviewAt: "2026-02-13T15:00:00Z",
        reviewCount: 3,
      },
    ],
  });

  // ── 5. Sample Flashcard Reviews (spaced repetition data) ──
  const reviewKeys: string[] = [];
  const reviewValues: any[] = [];

  // Anatomy — shoulder flashcard reviews
  const shoulderReviews = [
    { cardId: 1, ease: 2.6, interval: 7, repetitions: 5, rating: 4, responseTimeMs: 3200 },
    { cardId: 2, ease: 2.3, interval: 4, repetitions: 3, rating: 3, responseTimeMs: 5100 },
    { cardId: 3, ease: 2.1, interval: 2, repetitions: 2, rating: 2, responseTimeMs: 7800 },
    { cardId: 4, ease: 2.8, interval: 14, repetitions: 6, rating: 5, responseTimeMs: 2100 },
    { cardId: 5, ease: 2.4, interval: 3, repetitions: 3, rating: 3, responseTimeMs: 4500 },
  ];

  for (const r of shoulderReviews) {
    reviewKeys.push(`student:${STUDENT_ID}:review:anatomy:shoulder:${r.cardId}`);
    reviewValues.push({
      ...r,
      topicId: "shoulder",
      courseId: "anatomy",
      studentId: STUDENT_ID,
      reviewedAt: "2026-02-14T10:00:00Z",
    });
  }

  // Anatomy — arm flashcard reviews
  const armReviews = [
    { cardId: 1, ease: 2.7, interval: 10, repetitions: 5, rating: 5, responseTimeMs: 2800 },
    { cardId: 2, ease: 2.0, interval: 1, repetitions: 1, rating: 2, responseTimeMs: 8200 },
    { cardId: 3, ease: 2.4, interval: 4, repetitions: 3, rating: 3, responseTimeMs: 4100 },
    { cardId: 4, ease: 2.5, interval: 6, repetitions: 4, rating: 4, responseTimeMs: 3600 },
  ];

  for (const r of armReviews) {
    reviewKeys.push(`student:${STUDENT_ID}:review:anatomy:arm:${r.cardId}`);
    reviewValues.push({
      ...r,
      topicId: "arm",
      courseId: "anatomy",
      studentId: STUDENT_ID,
      reviewedAt: "2026-02-13T14:00:00Z",
    });
  }

  // Heart reviews
  const heartReviews = [
    { cardId: 1, ease: 2.7, interval: 12, repetitions: 6, rating: 5, responseTimeMs: 2000 },
    { cardId: 2, ease: 2.5, interval: 8, repetitions: 4, rating: 4, responseTimeMs: 3400 },
    { cardId: 3, ease: 2.3, interval: 3, repetitions: 3, rating: 3, responseTimeMs: 5200 },
    { cardId: 4, ease: 2.5, interval: 6, repetitions: 4, rating: 4, responseTimeMs: 3100 },
  ];

  for (const r of heartReviews) {
    reviewKeys.push(`student:${STUDENT_ID}:review:anatomy:heart:${r.cardId}`);
    reviewValues.push({
      ...r,
      topicId: "heart",
      courseId: "anatomy",
      studentId: STUDENT_ID,
      reviewedAt: "2026-02-14T14:00:00Z",
    });
  }

  await kv.mset(reviewKeys, reviewValues);

  // ── 6. Daily Activity (last 30 days for heatmap) ────────
  const activityKeys: string[] = [];
  const activityValues: any[] = [];
  const today = new Date("2026-02-14");

  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    // Simulate realistic study patterns
    const isWeekday = d.getDay() >= 1 && d.getDay() <= 5;
    const baseMinutes = isWeekday ? 75 : 40;
    const variance = Math.floor(Math.random() * 60) - 20;
    const studyMinutes = Math.max(0, baseMinutes + variance);

    // Some days off (about 10%)
    const dayOff = Math.random() < 0.1;

    activityKeys.push(`student:${STUDENT_ID}:daily:${dateStr}`);
    activityValues.push({
      date: dateStr,
      studyMinutes: dayOff ? 0 : studyMinutes,
      sessionsCount: dayOff ? 0 : Math.ceil(studyMinutes / 30),
      cardsReviewed: dayOff ? 0 : Math.floor(studyMinutes * 0.4),
      retentionPercent: dayOff ? null : Math.floor(65 + Math.random() * 30),
    });
  }

  await kv.mset(activityKeys, activityValues);

  // ── 7. Sample Study Sessions ────────────────────────────
  const sessionKeys: string[] = [];
  const sessionValues: any[] = [];

  const sampleSessions = [
    {
      id: "session_001",
      courseId: "anatomy",
      topicId: "shoulder",
      type: "flashcards",
      startedAt: "2026-02-14T10:00:00Z",
      endedAt: "2026-02-14T10:45:00Z",
      durationMinutes: 45,
      cardsReviewed: 25,
    },
    {
      id: "session_002",
      courseId: "anatomy",
      topicId: "heart",
      type: "quiz",
      startedAt: "2026-02-14T14:00:00Z",
      endedAt: "2026-02-14T14:30:00Z",
      durationMinutes: 30,
      quizScore: 85,
    },
    {
      id: "session_003",
      courseId: "histology",
      topicId: "simple",
      type: "reading",
      startedAt: "2026-02-13T11:00:00Z",
      endedAt: "2026-02-13T12:00:00Z",
      durationMinutes: 60,
    },
    {
      id: "session_004",
      courseId: "anatomy",
      topicId: "arm",
      type: "flashcards",
      startedAt: "2026-02-13T14:00:00Z",
      endedAt: "2026-02-13T14:40:00Z",
      durationMinutes: 40,
      cardsReviewed: 18,
    },
    {
      id: "session_005",
      courseId: "anatomy",
      topicId: "forearm",
      type: "mixed",
      startedAt: "2026-02-12T09:00:00Z",
      endedAt: "2026-02-12T10:15:00Z",
      durationMinutes: 75,
      cardsReviewed: 12,
      quizScore: 72,
    },
    {
      id: "session_006",
      courseId: "histology",
      topicId: "proper",
      type: "reading",
      startedAt: "2026-02-11T14:00:00Z",
      endedAt: "2026-02-11T15:10:00Z",
      durationMinutes: 70,
    },
    {
      id: "session_007",
      courseId: "anatomy",
      topicId: "lungs",
      type: "flashcards",
      startedAt: "2026-02-13T16:00:00Z",
      endedAt: "2026-02-13T16:35:00Z",
      durationMinutes: 35,
      cardsReviewed: 20,
    },
    {
      id: "session_008",
      courseId: "anatomy",
      topicId: "thigh",
      type: "quiz",
      startedAt: "2026-02-13T10:00:00Z",
      endedAt: "2026-02-13T10:25:00Z",
      durationMinutes: 25,
      quizScore: 90,
    },
  ];

  for (const s of sampleSessions) {
    sessionKeys.push(`student:${STUDENT_ID}:session:${s.id}`);
    sessionValues.push({ ...s, studentId: STUDENT_ID });
  }

  await kv.mset(sessionKeys, sessionValues);

  // ── 8. Sample Content (lesson texts) ────────────────────
  await kv.set("content:anatomy:lesson-shoulder-intro", {
    title: "Introdução ao Ombro e Axila",
    courseId: "anatomy",
    topicId: "shoulder",
    type: "lesson",
    content:
      "A articulação do ombro (glenoumeral) é a articulação sinovial mais móvel do corpo humano. É formada pela cabeça do úmero e a cavidade glenoidal da escápula. Devido à sua grande amplitude de movimento, é também uma das articulações mais instáveis, dependendo fortemente dos músculos do manguito rotador para estabilização dinâmica.",
    sections: [
      {
        subtitle: "Osteologia",
        text: "Os ossos envolvidos incluem a escápula, clavícula e úmero. A cavidade glenoidal é rasa e aumentada pelo lábio glenoidal, uma estrutura fibrocartilaginosa que aprofunda a cavidade em cerca de 50%.",
      },
      {
        subtitle: "Manguito Rotador",
        text: "O manguito rotador é composto por quatro músculos: Supraespinal (abdução), Infraespinal (rotação lateral), Redondo menor (rotação lateral) e Subescapular (rotação medial). A sigla SITS ajuda na memorização.",
      },
      {
        subtitle: "Axila",
        text: "A axila é um espaço piramidal que contém a artéria e veia axilares, o plexo braquial e linfonodos axilares. Tem quatro paredes (anterior, posterior, medial e lateral), uma base e um ápice.",
      },
    ],
    createdAt: "2025-08-15T10:00:00Z",
    updatedAt: "2026-01-20T14:30:00Z",
  });

  await kv.set("content:anatomy:lesson-heart-intro", {
    title: "Anatomia do Coração",
    courseId: "anatomy",
    topicId: "heart",
    type: "lesson",
    content:
      "O coração é um órgão muscular oco localizado no mediastino médio, levemente desviado para a esquerda. Bombeia aproximadamente 5 litros de sangue por minuto em repouso, através de dois circuitos: a circulação pulmonar (pequena circulação) e a circulação sistêmica (grande circulação).",
    sections: [
      {
        subtitle: "Câmaras Cardíacas",
        text: "O coração possui 4 câmaras: 2 átrios (superiores) e 2 ventrículos (inferiores). O septo interatrial e interventricular separam os lados direito e esquerdo.",
      },
      {
        subtitle: "Valvas Cardíacas",
        text: "As valvas atrioventriculares (tricúspide e mitral) e semilunares (pulmonar e aórtica) garantem o fluxo unidirecional do sangue.",
      },
      {
        subtitle: "Irrigação Coronariana",
        text: "O miocárdio é irrigado pelas artérias coronárias direita e esquerda, que se originam da aorta ascendente logo acima da valva aórtica.",
      },
    ],
    createdAt: "2025-09-01T08:00:00Z",
    updatedAt: "2026-02-01T11:00:00Z",
  });

  await kv.set("content:histology:lesson-epithelial-intro", {
    title: "Tecido Epitelial - Visão Geral",
    courseId: "histology",
    topicId: "simple",
    type: "lesson",
    content:
      "O tecido epitelial reveste superfícies externas e internas do corpo, formando barreiras seletivas. Caracteriza-se por células justapostas com pouca substância intercelular, apoiadas em uma lâmina basal. É avascular, recebendo nutrição por difusão a partir do tecido conjuntivo subjacente.",
    sections: [
      {
        subtitle: "Classificação",
        text: "Os epitélios são classificados pelo número de camadas (simples ou estratificado) e pela forma das células superficiais (pavimentoso, cúbico ou colunar).",
      },
      {
        subtitle: "Especializações",
        text: "As células epiteliais podem apresentar especializações apicais como microvilosidades (absorção), cílios (movimentação) e estereocílios (absorção no epidídimo).",
      },
    ],
    createdAt: "2025-08-20T09:00:00Z",
    updatedAt: "2026-01-15T16:00:00Z",
  });

  console.log("Demo student data seeded successfully!");
}

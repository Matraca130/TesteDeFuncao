// ============================================================
// routes-seed.tsx
// Route: POST /seed — Creates demo data with canonical key patterns
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { K, PREFIX, getUserId, createMembership, uuid } from "./_server-helpers.ts";

const seed = new Hono();

seed.post(`${PREFIX}/seed`, async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authorized" } }, 401);
  try {
    // ── Institution ──
    const instId = uuid();
    const institution = {
      id: instId, name: "Faculdade de Medicina Demo", slug: "medicina-demo",
      logo_url: null, plan: "premium",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await kv.set(K.inst(instId), institution);
    await kv.set(K.idxSlugInst("medicina-demo"), instId);
    await createMembership(userId, instId, "owner");

    // ── Course ──
    const courseId = uuid();
    const course = {
      id: courseId, name: "Medicina Geral", description: "Curso de medicina geral",
      institution_id: instId, color: "#0ea5e9",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await kv.set(K.course(courseId), course);
    await kv.set(K.idxInstCourses(instId, courseId), courseId);

    // ── Semester ──
    const sem1Id = uuid();
    await kv.set(K.semester(sem1Id), { id: sem1Id, name: "1o Semestre", course_id: courseId, order_index: 0, created_at: new Date().toISOString() });
    await kv.set(K.idxCourseSemesters(courseId, sem1Id), sem1Id);

    // ── Section ──
    const secId = uuid();
    await kv.set(K.section(secId), { id: secId, name: "Anatomia Humana", semester_id: sem1Id, order_index: 0, created_at: new Date().toISOString() });
    await kv.set(K.idxSemesterSections(sem1Id, secId), secId);

    // ── Topics ──
    const topicNames = ["Sistema Cardiovascular", "Sistema Respiratorio", "Sistema Nervoso"];
    const topicIds: string[] = [];
    for (let i = 0; i < topicNames.length; i++) {
      const tId = uuid();
      topicIds.push(tId);
      await kv.set(K.topic(tId), { id: tId, name: topicNames[i], section_id: secId, order_index: i, created_at: new Date().toISOString() });
      await kv.set(K.idxSectionTopics(secId, tId), tId);
    }

    // ── Summaries ──
    const summaryData = [
      { title: "Anatomia do Coracao", content: "O coracao e um orgao muscular oco...", topic_id: topicIds[0], status: "approved" },
      { title: "Ciclo Cardiaco", content: "Sistole e diastole...", topic_id: topicIds[0], status: "pending" },
      { title: "Pulmoes e Trocas Gasosas", content: "Hematose nos alveolos...", topic_id: topicIds[1], status: "draft" },
    ];
    for (const sd of summaryData) {
      const sId = uuid();
      await kv.set(K.summary(sId), { id: sId, ...sd, content_markdown: sd.content, author_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      await kv.set(K.idxTopicSummaries(sd.topic_id, sId), sId);
    }

    // ── Keywords ──
    const kwData = [
      { term: "Sistole", def: "Contracao" },
      { term: "Diastole", def: "Relaxamento" },
      { term: "Hematose", def: "Troca gasosa" },
      { term: "Sinapse", def: "Juncao neuronal" },
    ];
    for (const kd of kwData) {
      const kId = uuid();
      await kv.set(K.kw(kId), { id: kId, term: kd.term, definition: kd.def, institution_id: instId, priority: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      await kv.set(K.idxInstKw(instId, kId), kId);
    }

    console.log("[Server] Seed data created with CANONICAL key patterns");
    return c.json({ success: true, data: institution });
  } catch (err) {
    console.log("[Server] Seed error:", err);
    return c.json({ success: false, error: { code: "SERVER_ERROR", message: `Seed error: ${err}` } }, 500);
  }
});

export default seed;

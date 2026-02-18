// ============================================================
// Axon v4.4 — BatchVerifier Test Runner
// All 7 test phases extracted from BatchVerifier.tsx.
// Pure async function — takes callbacks, no React dependency.
// ============================================================

import { publicAnonKey } from '/utils/supabase/info';
import { supabase } from '../../../services/supabaseClient';
import { apiFetch, kvInspect } from './api-helper';
import type { TestResult, RunOpts } from './types';

/** Callbacks that the UI provides so the runner can report progress. */
export interface RunnerCallbacks {
  addResult: (r: TestResult) => string;
  updateResult: (id: string, patch: Partial<TestResult>) => void;
  setPhase: (phase: string) => void;
  abortRef: { current: boolean };
}

/**
 * Executes a single test case.
 * bearerToken is always explicit — no silent fallbacks.
 */
async function runSingle(
  group: string,
  name: string,
  method: string,
  path: string,
  body: unknown | undefined,
  opts: RunOpts | undefined,
  accessToken: string,
  cb: RunnerCallbacks,
): Promise<{ ok: boolean; data: any; httpStatus: number }> {
  if (cb.abortRef.current) return { ok: false, data: null, httpStatus: 0 };

  const id = `${group}::${name}`;
  cb.addResult({ id, group, name, method, path, status: 'running' });

  const bearer = opts?.bearerToken ?? accessToken;
  if (!bearer) {
    cb.updateResult(id, {
      status: 'fail', httpStatus: 0, ms: 0,
      detail: 'No bearer token available — auth step failed',
    });
    return { ok: false, data: null, httpStatus: 0 };
  }

  // Always send publicAnonKey as Authorization (for gateway HS256 check)
  // Send user JWT via X-Auth-Token (for server-side getUser ES256 validation)
  const gatewayBearer = publicAnonKey;
  const userJwt = (opts?.bearerToken === publicAnonKey) ? undefined : accessToken;
  const res = await apiFetch(method, path, gatewayBearer, body, userJwt || undefined);
  const expectedStatuses = opts?.expectStatus || [200, 201];
  let isPass = expectedStatuses.includes(res.status);
  let detail = '';
  let kvKeys: TestResult['kvKeys'];

  // Data assertion: fields
  if (isPass && opts?.assertFields) {
    const data = res.data?.data;
    const missing = opts.assertFields.filter(f => data?.[f] === undefined);
    if (missing.length > 0) {
      isPass = false;
      detail = `Missing fields in response.data: ${missing.join(', ')} | Got: ${JSON.stringify(Object.keys(data || {})).slice(0, 100)}`;
    }
  }

  // Data assertion: array length
  if (isPass && opts?.assertMinLength !== undefined) {
    const data = res.data?.data;
    if (!Array.isArray(data) || data.length < opts.assertMinLength) {
      isPass = false;
      detail = `Expected array.length >= ${opts.assertMinLength}, got ${Array.isArray(data) ? data.length : typeof data}`;
    }
  }

  // KV verification
  if (isPass && opts?.kvVerify && opts.kvVerify.length > 0 && bearer) {
    kvKeys = await kvInspect(opts.kvVerify, publicAnonKey);
    const missingKeys = kvKeys.filter(k => !k.exists);
    if (missingKeys.length > 0) {
      isPass = false;
      const mismatches = kvKeys.filter(k => k.mismatch);
      detail = `KV MISSING (get): ${missingKeys.map(k => k.key).join(', ')}`;
      if (mismatches.length > 0) {
        detail += ` | MISMATCH (mget≠get): ${mismatches.map(k => `${k.key}[mget=${k.mget_exists},get=${k.get_exists}]`).join(', ')}`;
      }
    }
  }

  const isWarn = !isPass && res.status !== 0 && res.status < 500 && !detail;

  // For non-pass: always extract server error detail
  if (!isPass && !detail) {
    const serverErr = res.data?.error;
    if (serverErr) {
      detail = typeof serverErr === 'string' ? serverErr : JSON.stringify(serverErr).slice(0, 250);
    } else {
      detail = JSON.stringify(res.data || 'No response').slice(0, 250);
    }
  }

  cb.updateResult(id, {
    status: isPass ? 'pass' : isWarn ? 'warn' : 'fail',
    httpStatus: res.status,
    ms: res.ms,
    detail: detail || (isPass ? `success: ${res.data?.success ?? 'ok'}` : 'Unknown error'),
    kvKeys,
  });

  return { ok: isPass, data: res.data, httpStatus: res.status };
}

// ════════════════════════════════════════════════════════════
// MAIN RUNNER — Orchestrates all 7 test phases
// ════════════════════════════════════════════════════════════

export async function runAllTests(cb: RunnerCallbacks): Promise<void> {
  let accessToken = '';
  let userId = '';
  const testEmail = `axon-batch-${Date.now()}@test.com`;
  const testPassword = 'BatchTest2026!';
  const testName = 'Axon BatchTest';

  /** Shorthand: run a single test with current accessToken */
  const run = (
    group: string, name: string, method: string, path: string,
    body?: unknown, opts?: RunOpts,
  ) => runSingle(group, name, method, path, body, opts, accessToken, cb);

  // ════════════════════════════════════════════════════
  // PHASE 1: HEALTH + KV ROUNDTRIP
  // ════════════════════════════════════════════════════
  cb.setPhase('1/8 Health + KV Probe');
  await run('Server', 'GET /health', 'GET', '/health', undefined, { bearerToken: publicAnonKey });

  // KV round-trip: set -> get -> direct query -> table sample
  const rtId = 'Server::KV Roundtrip';
  cb.addResult({ id: rtId, group: 'Server', name: 'GET /dev/kv-roundtrip (set→get→direct)', method: 'GET', path: '/dev/kv-roundtrip', status: 'running' });
  const rtRes = await apiFetch('GET', '/dev/kv-roundtrip', publicAnonKey);
  const rt = rtRes.data?.data || {};
  const rtDetail = [
    `set_ok=${rt.set_ok}`,
    rt.set_error ? `set_err=${rt.set_error}` : null,
    `get_found=${rt.get_found}`,
    rt.get_error ? `get_err=${rt.get_error}` : null,
    `direct_found=${rt.direct_query_found}`,
    rt.direct_query_error ? `direct_err=${rt.direct_query_error}` : null,
    `table_count=${rt.table_total_count}`,
    rt.table_error ? `table_err=${rt.table_error}` : null,
    `table_keys=[${(rt.table_sample_keys || []).slice(0, 5).join(', ')}]`,
    `url=${rt.supabase_url}`,
  ].filter(Boolean).join(' | ');

  const rtPass = rt.set_ok && rt.get_found && rt.direct_query_found;
  cb.updateResult(rtId, {
    status: rtPass ? 'pass' : 'fail',
    httpStatus: rtRes.status,
    ms: rtRes.ms,
    detail: rtDetail,
  });

  if (!rtPass) {
    console.error('[KV ROUNDTRIP FULL]', JSON.stringify(rt, null, 2));
  }

  // ════════════════════════════════════════════════════
  // PHASE 2: AUTH
  // ════════════════════════════════════════════════════
  cb.setPhase('2/8 Auth');

  // Step 2a: Create user via POST /auth/signup
  const signupId = 'Auth::POST /auth/signup';
  cb.addResult({ id: signupId, group: 'Auth', name: 'POST /auth/signup', method: 'POST', path: '/auth/signup', status: 'running' });

  const signupRes = await apiFetch('POST', '/auth/signup', publicAnonKey, {
    email: testEmail, password: testPassword, name: testName,
  });

  if (!signupRes.ok) {
    cb.updateResult(signupId, {
      status: 'fail', httpStatus: signupRes.status, ms: signupRes.ms,
      detail: `Signup failed: ${JSON.stringify(signupRes.data?.error || signupRes.data).slice(0, 200)}`,
    });
    cb.addResult({
      id: 'Auth::ABORT', group: 'Auth', name: 'ABORT', method: '-', path: '-',
      status: 'fail', detail: 'Cannot continue — signup failed',
    });
    return;
  }

  cb.updateResult(signupId, {
    status: 'pass', httpStatus: signupRes.status, ms: signupRes.ms,
    detail: `User created: ${signupRes.data?.data?.user?.id?.slice(0, 8) || 'ok'}...`,
  });

  // Step 2b: Sign in via BROWSER Supabase client
  const signinId = 'Auth::Browser signInWithPassword';
  cb.addResult({ id: signinId, group: 'Auth', name: 'Browser signInWithPassword', method: 'AUTH', path: 'supabase.auth', status: 'running' });

  const t0 = performance.now();
  const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  const signinMs = Math.round(performance.now() - t0);

  if (signinErr || !signinData?.session?.access_token) {
    cb.updateResult(signinId, {
      status: 'fail', httpStatus: 0, ms: signinMs,
      detail: `Browser signin failed: ${signinErr?.message || 'No session returned'}`,
    });
    cb.addResult({
      id: 'Auth::ABORT', group: 'Auth', name: 'ABORT', method: '-', path: '-',
      status: 'fail', detail: 'Cannot continue — no valid access_token from browser auth',
    });
    return;
  }

  accessToken = signinData.session.access_token;
  userId = signinData.user?.id || '';

  cb.updateResult(signinId, {
    status: 'pass', httpStatus: 200, ms: signinMs,
    detail: `Token: ${accessToken.slice(0, 20)}... | userId: ${userId.slice(0, 8)}...`,
  });

  // Step 2c: Auth debug diagnostic
  const authDebugId = 'Auth::Auth Debug (server-side)';
  cb.addResult({ id: authDebugId, group: 'Auth', name: 'GET /dev/auth-debug (diagnostic)', method: 'GET', path: '/dev/auth-debug', status: 'running' });

  const debugRes = await apiFetch('GET', '/dev/auth-debug', publicAnonKey, undefined, accessToken);
  const debugData = debugRes.data?.data || {};
  const debugDetail = [
    `header: ${debugData.raw_header_preview || '?'}`,
    `getUser_success: ${debugData.getUser_success}`,
    debugData.getUser_error ? `getUser_error: ${JSON.stringify(debugData.getUser_error)}` : `getUser_userId: ${debugData.getUser_userId}`,
    `SUPABASE_URL: ${debugData.supabase_url || '?'}`,
    `SRK set: ${debugData.service_role_key_set}`,
  ].join(' | ');

  cb.updateResult(authDebugId, {
    status: debugData.getUser_success ? 'pass' : 'fail',
    httpStatus: debugRes.status,
    ms: debugRes.ms,
    detail: debugDetail,
  });

  if (!debugData.getUser_success) {
    cb.addResult({
      id: 'Auth::DIAGNOSIS', group: 'Auth', name: 'DIAGNOSIS',
      method: '-', path: '-', status: 'fail',
      detail: `Token algorithm: ${accessToken.split('.')[0]} | getUser error: ${JSON.stringify(debugData.getUser_error)} | SUPABASE_URL: ${debugData.supabase_url}`,
    });
  }

  // Step 2d & 2e: Verify /auth/me and /auth/signin
  await run('Auth', 'GET /auth/me', 'GET', '/auth/me', undefined, { assertFields: ['user'] });
  await run('Auth', 'POST /auth/signin (server)', 'POST', '/auth/signin', {
    email: testEmail, password: testPassword,
  }, { bearerToken: publicAnonKey, assertFields: ['user', 'access_token'] });

  // ════════════════════════════════════════════════════
  // PHASE 3: INSTITUTION + MEMBERSHIP
  // ════════════════════════════════════════════════════
  cb.setPhase('3/8 Inst + Membership KV');

  const instRes = await run('Inst+Membership', 'POST /institutions', 'POST', '/institutions', {
    name: 'Test Med School', slug: 'test-med-batch',
  }, { assertFields: ['id', 'name', 'created_by'] });

  const instId = instRes.data?.data?.id || '';

  // Deep KV verification of ALL 4 keys
  if (instId && userId) {
    const fourKeys = [
      `inst:${instId}`,
      `membership:${instId}:${userId}`,
      `idx:inst-members:${instId}:${userId}`,
      `idx:user-insts:${userId}:${instId}`,
    ];

    await run('KV Verify', 'ALL 4 Institution keys (batch)', 'POST', '/dev/kv-inspect', { keys: fourKeys }, { kvVerify: fourKeys });

    for (const key of fourKeys) {
      const label = key.split(':').slice(0, -1).join(':') + ':*';
      await run('KV Verify', `${label}`, 'POST', '/dev/kv-inspect', { keys: [key] }, { kvVerify: [key] });
    }
  } else {
    cb.addResult({
      id: 'KV Verify::SKIP', group: 'KV Verify', name: 'SKIP — no instId or userId',
      method: '-', path: '-', status: 'fail',
      detail: `instId=${instId || 'EMPTY'}, userId=${userId || 'EMPTY'}`,
    });
  }

  if (instId) {
    await run('Inst+Membership', 'GET /institutions/:id', 'GET', `/institutions/${instId}`, undefined, { assertFields: ['id', 'name'] });
    await run('Inst+Membership', 'GET /.../members (idx:inst-members)', 'GET', `/institutions/${instId}/members`, undefined, { assertMinLength: 1 });
  }

  if (userId) {
    await run('Inst+Membership', 'GET /users/.../institutions (idx:user-insts)', 'GET', `/users/${userId}/institutions`, undefined, { assertMinLength: 1 });
  }

  // POST add a second member
  const testMemberId = 'test-member-' + Date.now();
  if (instId) {
    await run('Inst+Membership', 'POST /.../members (manual)', 'POST', `/institutions/${instId}/members`, {
      user_id: testMemberId, role: 'professor',
    }, { assertFields: ['institution_id', 'user_id', 'role'] });

    await run('KV Verify', 'membership + indices (2nd member)', 'POST', '/dev/kv-inspect', {
      keys: [
        `membership:${instId}:${testMemberId}`,
        `idx:inst-members:${instId}:${testMemberId}`,
        `idx:user-insts:${testMemberId}:${instId}`,
      ],
    }, {
      kvVerify: [
        `membership:${instId}:${testMemberId}`,
        `idx:inst-members:${instId}:${testMemberId}`,
        `idx:user-insts:${testMemberId}:${instId}`,
      ],
    });

    await run('Inst+Membership', 'DELETE /.../members/:userId', 'DELETE', `/institutions/${instId}/members/${testMemberId}`);
  }

  // ════════════════════════════════════════════════════
  // PHASE 4: FULL CRUD CHAIN
  // ════════════════════════════════════════════════════
  cb.setPhase('4/8 CRUD Chain');

  let courseId = '';
  if (instId) {
    const r = await run('CRUD Chain', 'POST /courses', 'POST', '/courses', {
      name: 'Anatomia Humana', institution_id: instId, color: '#e74c3c',
    }, { assertFields: ['id', 'name', 'institution_id'] });
    courseId = r.data?.data?.id || '';

    if (courseId) {
      await run('KV Verify', 'course + idx:inst-courses', 'POST', '/dev/kv-inspect', { keys: [
        `course:${courseId}`, `idx:inst-courses:${instId}:${courseId}`,
      ]}, { kvVerify: [`course:${courseId}`, `idx:inst-courses:${instId}:${courseId}`] });

      await run('CRUD Chain', 'GET /courses?institution_id', 'GET', `/courses?institution_id=${instId}`, undefined, { assertMinLength: 1 });
      await run('CRUD Chain', 'GET /courses/:id', 'GET', `/courses/${courseId}`, undefined, { assertFields: ['id', 'name'] });
      await run('CRUD Chain', 'PUT /courses/:id', 'PUT', `/courses/${courseId}`, { name: 'Anatomia (Updated)' }, { assertFields: ['id', 'updated_at'] });
    }
  }

  let semId = '';
  if (courseId) {
    const r = await run('CRUD Chain', 'POST /semesters', 'POST', '/semesters', {
      title: '1o Sem 2026', course_id: courseId,
    }, { assertFields: ['id', 'title', 'course_id'] });
    semId = r.data?.data?.id || '';
    if (semId) {
      await run('KV Verify', 'semester + idx', 'POST', '/dev/kv-inspect', { keys: [
        `semester:${semId}`, `idx:course-semesters:${courseId}:${semId}`,
      ]}, { kvVerify: [`semester:${semId}`, `idx:course-semesters:${courseId}:${semId}`] });
      await run('CRUD Chain', 'GET /semesters?course_id', 'GET', `/semesters?course_id=${courseId}`, undefined, { assertMinLength: 1 });
    }
  }

  let secId = '';
  if (semId) {
    const r = await run('CRUD Chain', 'POST /sections', 'POST', '/sections', {
      title: 'Membro Superior', semester_id: semId,
    }, { assertFields: ['id', 'title', 'semester_id'] });
    secId = r.data?.data?.id || '';
    if (secId) {
      await run('KV Verify', 'section + idx', 'POST', '/dev/kv-inspect', { keys: [
        `section:${secId}`, `idx:semester-sections:${semId}:${secId}`,
      ]}, { kvVerify: [`section:${secId}`, `idx:semester-sections:${semId}:${secId}`] });
    }
  }

  let topicId = '';
  if (secId) {
    const r = await run('CRUD Chain', 'POST /topics', 'POST', '/topics', {
      title: 'Plexo Braquial', section_id: secId,
    }, { assertFields: ['id', 'title', 'section_id'] });
    topicId = r.data?.data?.id || '';
    if (topicId) {
      await run('KV Verify', 'topic + idx', 'POST', '/dev/kv-inspect', { keys: [
        `topic:${topicId}`, `idx:section-topics:${secId}:${topicId}`,
      ]}, { kvVerify: [`topic:${topicId}`, `idx:section-topics:${secId}:${topicId}`] });
    }
  }

  let summaryId = '';
  if (topicId && instId) {
    const r = await run('CRUD Chain', 'POST /summaries', 'POST', '/summaries', {
      title: 'Resumo Plexo', topic_id: topicId, institution_id: instId,
      content: 'O plexo braquial e formado pelos ramos ventrais de C5-T1.',
    }, { assertFields: ['id', 'title', 'topic_id'] });
    summaryId = r.data?.data?.id || '';
    if (summaryId) {
      await run('KV Verify', 'summary + idx', 'POST', '/dev/kv-inspect', { keys: [
        `summary:${summaryId}`, `idx:topic-summaries:${topicId}:${summaryId}`,
      ]}, { kvVerify: [`summary:${summaryId}`, `idx:topic-summaries:${topicId}:${summaryId}`] });
    }
  }

  if (summaryId) {
    await run('CRUD Chain', 'POST /summaries/:id/chunk', 'POST', `/summaries/${summaryId}/chunk`, {
      content: 'Raizes: C5-T1', sort_order: 0,
    }, { assertFields: ['id', 'summary_id'] });
    await run('CRUD Chain', 'GET /summaries/:id/chunks', 'GET', `/summaries/${summaryId}/chunks`, undefined, { assertMinLength: 1 });
  }

  let kwId = '', kwId2 = '';
  if (instId) {
    const r = await run('CRUD Chain', 'POST /keywords', 'POST', '/keywords', {
      institution_id: instId, term: 'Plexo Braquial', definition: 'Rede nervosa C5-T1',
      priority: 0, summary_ids: summaryId ? [summaryId] : [],
    }, { assertFields: ['id', 'term'] });
    kwId = r.data?.data?.id || '';

    if (kwId) {
      const kvKeysToCheck = [`kw:${kwId}`, `idx:inst-kw:${instId}:${kwId}`];
      if (summaryId) {
        kvKeysToCheck.push(`idx:summary-kw:${summaryId}:${kwId}`, `idx:kw-summaries:${kwId}:${summaryId}`);
      }
      await run('KV Verify', 'keyword + all indices', 'POST', '/dev/kv-inspect', { keys: kvKeysToCheck }, { kvVerify: kvKeysToCheck });
    }

    const r2 = await run('CRUD Chain', 'POST /keywords (2nd)', 'POST', '/keywords', {
      institution_id: instId, term: 'Nervo Mediano', definition: 'Nervo misto C5-T1', priority: 1,
    }, { assertFields: ['id', 'term'] });
    kwId2 = r2.data?.data?.id || '';
  }

  let stId = '';
  if (kwId) {
    const r = await run('CRUD Chain', 'POST /subtopics', 'POST', '/subtopics', {
      keyword_id: kwId, title: 'Tronco Superior', description: 'Uniao C5+C6',
    }, { assertFields: ['id', 'keyword_id', 'title'] });
    stId = r.data?.data?.id || '';
    if (stId) {
      await run('KV Verify', 'subtopic + idx', 'POST', '/dev/kv-inspect', { keys: [
        `subtopic:${stId}`, `idx:kw-subtopics:${kwId}:${stId}`,
      ]}, { kvVerify: [`subtopic:${stId}`, `idx:kw-subtopics:${kwId}:${stId}`] });
    }
  }

  let connId = '';
  if (kwId && kwId2) {
    const r = await run('CRUD Chain', 'POST /connections', 'POST', '/connections', {
      keyword_a_id: kwId, keyword_b_id: kwId2, relationship_type: 'origin',
    }, { assertFields: ['id', 'keyword_a_id'] });
    connId = r.data?.data?.id || '';
    if (connId) {
      await run('KV Verify', 'connection + both idx', 'POST', '/dev/kv-inspect', { keys: [
        `conn:${connId}`, `idx:kw-conn:${kwId}:${connId}`, `idx:kw-conn:${kwId2}:${connId}`,
      ]}, { kvVerify: [
        `conn:${connId}`, `idx:kw-conn:${kwId}:${connId}`, `idx:kw-conn:${kwId2}:${connId}`,
      ]});
    }
  }

  // Batch Status (D20)
  if (kwId) {
    await run('CRUD Chain', 'PUT /content/batch-status (D20)', 'PUT', '/content/batch-status', {
      items: [{ entity_type: 'keyword', id: kwId, new_status: 'published' }],
      reviewer_note: 'Batch test approval',
    }, { assertFields: ['processed', 'approved'] });
  }

  // ════════════════════════════════════════════════════
  // PHASE 5: AI ROUTES
  // ════════════════════════════════════════════════════
  cb.setPhase('5/8 AI Routes');

  await run('AI', 'GET /ai/drafts', 'GET', '/ai/drafts');
  await run('AI', 'POST /ai/chat (no msg → 400)', 'POST', '/ai/chat', {}, { expectStatus: [400] });
  await run('AI', 'POST /ai/generate (no content → 400)', 'POST', '/ai/generate', {}, { expectStatus: [400] });
  await run('AI', 'POST /ai/approve (no draft → 400)', 'POST', '/ai/generate/approve', {}, { expectStatus: [400] });
  await run('AI', 'GET /keyword-popup (fake → 404)', 'GET', '/keyword-popup/fake-id', undefined, { expectStatus: [404] });

  if (kwId) {
    await run('AI', 'GET /keyword-popup/:id (real)', 'GET', `/keyword-popup/${kwId}`, undefined, { assertFields: ['keyword'] });
  }

  // ════════════════════════════════════════════════════
  // PHASE 6: CLEANUP
  // ════════════════════════════════════════════════════
  cb.setPhase('6/8 Cleanup');

  if (connId) await run('Cleanup', 'DEL connection', 'DELETE', `/connections/${connId}`);
  if (stId) await run('Cleanup', 'DEL subtopic', 'DELETE', `/subtopics/${stId}`);
  if (kwId2) await run('Cleanup', 'DEL keyword 2', 'DELETE', `/keywords/${kwId2}`);
  if (kwId) await run('Cleanup', 'DEL keyword 1', 'DELETE', `/keywords/${kwId}`);
  if (summaryId) await run('Cleanup', 'DEL summary', 'DELETE', `/summaries/${summaryId}`);
  if (topicId) await run('Cleanup', 'DEL topic', 'DELETE', `/topics/${topicId}`);
  if (secId) await run('Cleanup', 'DEL section', 'DELETE', `/sections/${secId}`);
  if (semId) await run('Cleanup', 'DEL semester', 'DELETE', `/semesters/${semId}`);
  if (courseId) await run('Cleanup', 'DEL course', 'DELETE', `/courses/${courseId}`);

  // Verify deletion
  const deletedKeys = [
    ...(courseId ? [`course:${courseId}`] : []),
    ...(kwId ? [`kw:${kwId}`] : []),
    ...(summaryId ? [`summary:${summaryId}`] : []),
  ];
  if (deletedKeys.length > 0) {
    const kvCheck = await kvInspect(deletedKeys, publicAnonKey);
    const stillExists = kvCheck.filter(k => k.exists);
    cb.addResult({
      id: 'Cleanup::verify-deleted', group: 'Cleanup', name: 'Verify KV keys deleted',
      method: 'POST', path: '/dev/kv-inspect',
      status: stillExists.length === 0 ? 'pass' : 'fail',
      httpStatus: 200,
      detail: stillExists.length === 0
        ? `All ${deletedKeys.length} keys confirmed gone`
        : `${stillExists.length} zombie keys: ${stillExists.map(k => k.key).join(', ')}`,
      kvKeys: kvCheck,
    });
  }

  // ════════════════════════════════════════════════════
  // PHASE 7: SIGNOUT
  // ════════════════════════════════════════════════════
  cb.setPhase('7/8 Signout');
  await run('Auth', 'POST /auth/signout', 'POST', '/auth/signout');

  // Browser signout too
  await supabase.auth.signOut();

  cb.setPhase('Complete');
}

// ============================================================
// Axon v4.4 — Mock API Client (P3 Layer)
// Added by Agent 6 — PRISM
// Simulates network latency for hooks. In P3+ this will be
// replaced by real fetch calls to the Hono backend (Agent 4).
// ============================================================

const SIMULATED_DELAY = 300; // ms

export async function mockDelay(ms = SIMULATED_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generic CRUD helpers that simulate API calls.
// Each hook will wrap these with its own entity type.

export async function mockFetchAll<T>(data: T[]): Promise<T[]> {
  await mockDelay();
  return [...data];
}

export async function mockCreate<T>(item: T): Promise<T> {
  await mockDelay();
  return item;
}

export async function mockUpdate<T>(item: T): Promise<T> {
  await mockDelay();
  return item;
}

export async function mockSoftDelete(id: string): Promise<{ id: string; deleted_at: string }> {
  await mockDelay();
  return { id, deleted_at: new Date().toISOString() };
}

export async function mockRestore(id: string): Promise<{ id: string }> {
  await mockDelay();
  return { id };
}

export async function mockHardDelete(id: string): Promise<{ id: string }> {
  await mockDelay();
  return { id };
}

// AI generation mock
export async function mockAIGenerate<T>(result: T, delayMs = 2000): Promise<T> {
  await mockDelay(delayMs);
  return result;
}

// ============================================================
// Axon v4.4 — BatchVerifier Types
// Extracted from BatchVerifier.tsx for modularity.
// ============================================================

export type TestStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skip' | 'warn';

export interface KvKeyResult {
  key: string;
  exists: boolean;
  mget_exists?: boolean;
  get_exists?: boolean;
  mismatch?: boolean;
}

export interface TestResult {
  id: string;
  group: string;
  name: string;
  method: string;
  path: string;
  status: TestStatus;
  httpStatus?: number;
  ms?: number;
  detail?: string;
  kvKeys?: KvKeyResult[];
}

export interface ApiResponse {
  ok: boolean;
  status: number;
  data: any;
  ms: number;
}

export interface RunOpts {
  expectStatus?: number[];
  bearerToken?: string;
  assertFields?: string[];
  assertMinLength?: number;
  kvVerify?: string[];
}

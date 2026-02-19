// ============================================================
// Axon v4.4 — API Client Barrel (Agent 4 — BRIDGE)
// Re-exports all API functions from domain modules.
// Import from here: import { getX } from '../lib/api-client';
// ============================================================
export { setApiAuthToken, getApiAuthToken } from './api-core';
export * from './api-plans';
export * from './api-media';
export * from './api-admin';
export * from './api-sacred';
export * from './api-quiz';
export * from './api-student';
export * from './api-content';
export * from './api-flashcards';
export * from './api-quiz-content';
export * from './api-study-plans';
export * from './api-smart-study';

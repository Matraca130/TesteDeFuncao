// ============================================================
// AXON — Pattern Validator (CI Guard #2)
//
// Catches common Figma Make errors BEFORE they reach production:
//   - Wrong server prefix in frontend code
//   - Figma Make-specific import paths
//   - index.ts monolith pattern (inline route handlers)
//   - Auth header misuse
//
// Exit code 1 = violations found → deploy should be blocked.
// ============================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ── Config ─────────────────────────────────────────────────

const FRONTEND_DIR = 'src';
const SERVER_INDEX = 'supabase/functions/server/index.ts';

// Max lines for index.ts before it's considered a monolith
const INDEX_MAX_LINES = 150;

// Max inline route handlers allowed in index.ts
const INDEX_MAX_INLINE_HANDLERS = 3;

// Protected files that should not have inline route logic
const PROTECTED_SERVER_FILES = [
  'supabase/functions/server/kv-keys.ts',
  'supabase/functions/server/shared-types.ts',
  'supabase/functions/server/fsrs-engine.ts',
  'supabase/functions/server/kv_store.tsx',
  'supabase/functions/server/db.ts',
  'supabase/functions/server/crud-factory.tsx',
  'supabase/functions/server/_server-helpers.ts',
  'supabase/functions/server/middleware-rbac.ts',
];

// ── Helpers ────────────────────────────────────────────────

function getAllFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory might not exist
  }
  return files;
}

function readFileSafe(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

// ── Checks ─────────────────────────────────────────────────

let errors = 0;
let warnings = 0;

console.log('='.repeat(60));
console.log('  AXON Pattern Validator — Pre-deploy CI Guard #2');
console.log('='.repeat(60));

// ─────────────────────────────────────────────────────────
// CHECK #2: Wrong server prefix in frontend files
// ─────────────────────────────────────────────────────────
console.log('\n[CHECK] Server prefix in frontend code...\n');

const frontendFiles = getAllFiles(FRONTEND_DIR);
const BAD_PREFIXES = [
  /make-server-[a-f0-9]+/g,           // Figma Make prefix
  /functions\/v1\/make-server/g,       // Full path with Figma Make prefix
];

for (const file of frontendFiles) {
  const content = readFileSafe(file);
  if (!content) continue;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    for (const pattern of BAD_PREFIXES) {
      pattern.lastIndex = 0;
      const match = pattern.exec(lines[i]);
      if (match) {
        const relPath = relative('.', file);
        console.log(`  [FAIL] ${relPath}:${i + 1} — uses Figma Make prefix '${match[0]}'`);
        console.log(`         Should be: /functions/v1/server/...`);
        errors++;
      }
    }
  }
}

if (errors === 0) console.log('  [OK] No wrong prefixes found.');
const prefixErrors = errors;

// ─────────────────────────────────────────────────────────
// CHECK #3: Figma Make import paths in frontend
// ─────────────────────────────────────────────────────────
console.log('\n[CHECK] Figma Make import paths in frontend...\n');

const BAD_IMPORTS = [
  { pattern: /from\s+['"]\/?utils\/supabase\/info['"]/, msg: "utils/supabase/info (Figma Make path)", fix: "@/app/lib/config" },
  { pattern: /from\s+['"]\/?utils\/supabase\/client['"]/, msg: "utils/supabase/client (Figma Make path)", fix: "@/app/lib/supabase" },
  { pattern: /from\s+['"]react-router-dom['"]/, msg: "react-router-dom (not available)", fix: "react-router" },
];

let importErrors = 0;
for (const file of frontendFiles) {
  const content = readFileSafe(file);
  if (!content) continue;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, msg, fix } of BAD_IMPORTS) {
      if (pattern.test(lines[i])) {
        const relPath = relative('.', file);
        console.log(`  [FAIL] ${relPath}:${i + 1} — imports from ${msg}`);
        console.log(`         Should be: ${fix}`);
        errors++;
        importErrors++;
      }
    }
  }
}

if (importErrors === 0) console.log('  [OK] No Figma Make import paths found.');

// ─────────────────────────────────────────────────────────
// CHECK #4: index.ts monolith detection
// ─────────────────────────────────────────────────────────
console.log('\n[CHECK] Server index.ts structure...\n');

const indexContent = readFileSafe(SERVER_INDEX);
let monolithErrors = 0;

if (indexContent) {
  const indexLines = indexContent.split('\n');

  // Check line count
  if (indexLines.length > INDEX_MAX_LINES) {
    console.log(`  [FAIL] index.ts has ${indexLines.length} lines (max: ${INDEX_MAX_LINES})`);
    console.log(`         This looks like a monolith. Routes should be in separate files.`);
    errors++;
    monolithErrors++;
  }

  // Count inline route handlers (app.get/post/put/delete/patch with callback)
  const handlerPattern = /app\.(get|post|put|delete|patch|all)\s*\(/g;
  let handlerCount = 0;
  let m;
  while ((m = handlerPattern.exec(indexContent)) !== null) {
    handlerCount++;
  }

  if (handlerCount > INDEX_MAX_INLINE_HANDLERS) {
    console.log(`  [FAIL] index.ts has ${handlerCount} inline route handlers (max: ${INDEX_MAX_INLINE_HANDLERS})`);
    console.log(`         Route handlers should be in routes-*.tsx files.`);
    errors++;
    monolithErrors++;
  }

  // Check that index.ts uses app.route() for modular imports
  const routeImports = (indexContent.match(/app\.route\s*\(/g) || []).length;
  if (routeImports === 0 && handlerCount > 0) {
    console.log(`  [FAIL] index.ts has route handlers but no app.route() imports`);
    console.log(`         Missing modular router architecture.`);
    errors++;
    monolithErrors++;
  }

  if (monolithErrors === 0) {
    console.log(`  [OK] index.ts: ${indexLines.length} lines, ${routeImports} router imports, ${handlerCount} inline handlers.`);
  }
} else {
  console.log('  [WARN] Could not read server/index.ts');
  warnings++;
}

// ─────────────────────────────────────────────────────────
// CHECK #6: Auth header misuse
// ─────────────────────────────────────────────────────────
console.log('\n[CHECK] Auth header patterns in frontend...\n');

// Detect fetch calls using publicAnonKey/ANON_KEY for non-auth endpoints
const AUTH_MISUSE_PATTERNS = [
  {
    pattern: /Authorization.*(?:publicAnonKey|SUPABASE_ANON_KEY|anonKey).*(?:\/dashboard|\/admin|\/owner|\/students|\/memberships|\/institutions)/,
    msg: 'Using anonKey for protected route (should use access_token)',
  },
  {
    pattern: /fetch\s*\([^)]*(?:\/dashboard|\/admin|\/students|\/memberships|\/plans).*\n?[^}]*publicAnonKey/s,
    msg: 'Protected API call using publicAnonKey instead of session token',
  },
];

let authErrors = 0;
for (const file of frontendFiles) {
  const content = readFileSafe(file);
  if (!content) continue;

  for (const { pattern, msg } of AUTH_MISUSE_PATTERNS) {
    if (pattern.test(content)) {
      const relPath = relative('.', file);
      console.log(`  [WARN] ${relPath} — ${msg}`);
      warnings++;
      // Auth misuse is a warning, not a hard error
      // because the pattern detection can have false positives
    }
  }
}

if (authErrors === 0 && warnings === 0) console.log('  [OK] No auth header issues detected.');
else if (authErrors === 0) console.log(`  [INFO] ${warnings} warning(s) — review manually.`);

// ─────────────────────────────────────────────────────────
// BONUS: Check for SUPABASE_SERVICE_ROLE_KEY leak
// ─────────────────────────────────────────────────────────
console.log('\n[CHECK] Service role key leak detection...\n');

const LEAK_PATTERNS = [
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role/,
  /serviceRole/,
];

let leakErrors = 0;
for (const file of frontendFiles) {
  const content = readFileSafe(file);
  if (!content) continue;

  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(content)) {
      const relPath = relative('.', file);
      console.log(`  [FAIL] ${relPath} — contains '${pattern.source}' (SERVICE ROLE KEY LEAK!)`);
      console.log(`         The service role key must NEVER be in frontend code.`);
      errors++;
      leakErrors++;
    }
  }
}

if (leakErrors === 0) console.log('  [OK] No service role key leaks detected.');

// ── Summary ────────────────────────────────────────────────

console.log(`\n${'='.repeat(60)}`);
console.log(`  Files scanned: ${frontendFiles.length} frontend + 1 server index`);
console.log(`  Errors: ${errors}  |  Warnings: ${warnings}`);

if (errors > 0) {
  console.log(`\n  FAILED: ${errors} violation(s) found.`);
  console.log(`  Fix these before deploying.\n`);
  process.exit(1);
} else {
  console.log(`\n  PASSED: All pattern checks clean.\n`);
}

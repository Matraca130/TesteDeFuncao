// ============================================================
// AXON — Server Import Validator (CI Guard)
// Prevents BOOT_ERROR by catching missing exports BEFORE deploy.
//
// Scans all .ts/.tsx files in supabase/functions/server/
// and verifies that every named import from critical files
// (kv-keys.ts, shared-types.ts, crud-factory.tsx, db.ts)
// actually exists as an export.
//
// Also validates KV_PREFIXES property access.
//
// Exit code 1 = missing exports found → deploy should be blocked.
// ============================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const SERVER_DIR = 'supabase/functions/server';

// Critical files whose exports we validate
const CRITICAL_FILES = [
  'kv-keys.ts',
  'shared-types.ts',
  'crud-factory.tsx',
  'db.ts',
];

// ── Helpers ─────────────────────────────────────────────

/** Recursively get all .ts/.tsx files under a directory */
function getAllFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Extract all exported names from a file */
function getExportedNames(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const names = new Set();

  // export const NAME / export let NAME / export function NAME
  // export type NAME / export interface NAME / export enum NAME
  // export async function NAME
  const re = /export\s+(?:async\s+)?(?:const|let|var|function|type|interface|enum)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    names.add(m[1]);
  }

  // export default
  if (/export\s+default\s/.test(content)) {
    names.add('default');
  }

  return names;
}

/** Extract KV_PREFIXES property names from kv-keys.ts */
function getKvPrefixProperties(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const props = new Set();

  // Find the KV_PREFIXES object and extract property names
  const objMatch = content.match(
    /export\s+const\s+KV_PREFIXES\s*=\s*\{([^]*?)\}\s*as\s+const/s
  );
  if (!objMatch) return props;

  const body = objMatch[1];
  const propRe = /^\s*([A-Z_][A-Z0-9_]*)\s*:/gm;
  let m;
  while ((m = propRe.exec(body)) !== null) {
    props.add(m[1]);
  }
  return props;
}

/** Extract imported names from a file that come from a specific target */
function getImportsFrom(content, targetBaseName) {
  const names = [];

  // Strip extension for matching
  const escaped = targetBaseName
    .replace(/\.[^.]+$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const importRe = new RegExp(
    `import\\s*(?:type\\s*)?\\{([^}]+)\\}\\s*from\\s*['"](?:\\.?\\.?\\/)*(?:.*?\\/)?${escaped}(?:\\.\\w+)?['"]`,
    'gs'
  );

  let m;
  while ((m = importRe.exec(content)) !== null) {
    const block = m[1];
    for (const part of block.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      // Handle "Name as Alias" → we care about "Name" (the source export)
      const name = trimmed.split(/\s+as\s+/)[0].trim();
      if (name) names.push(name);
    }
  }
  return names;
}

/** Find KV_PREFIXES.PROP access patterns in a file */
function getKvPrefixUsage(content) {
  const props = [];
  const re = /KV_PREFIXES\.([A-Z_][A-Z0-9_]*)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    props.push(m[1]);
  }
  return props;
}

// ── Main ────────────────────────────────────────────────

console.log('='.repeat(60));
console.log('  AXON Import Validator — Pre-deploy CI Guard');
console.log('='.repeat(60));

let errors = 0;
let totalChecked = 0;

const allFiles = getAllFiles(SERVER_DIR);
console.log(`\nScanning ${allFiles.length} files in ${SERVER_DIR}/\n`);

// ── Check named exports ────────────────────────────────
for (const criticalFile of CRITICAL_FILES) {
  const criticalPath = join(SERVER_DIR, criticalFile);
  let exports;
  try {
    exports = getExportedNames(criticalPath);
  } catch (e) {
    console.log(`[WARN] Skipping ${criticalFile}: ${e.message}`);
    continue;
  }

  console.log(`[FILE] ${criticalFile}: ${exports.size} exports`);

  for (const file of allFiles) {
    if (file.endsWith(criticalFile)) continue;

    const content = readFileSync(file, 'utf-8');
    const imports = getImportsFrom(content, criticalFile);
    totalChecked += imports.length;

    for (const imp of imports) {
      if (!exports.has(imp)) {
        const relPath = relative('.', file);
        console.log(`  [FAIL] ${relPath} imports '${imp}' — NOT EXPORTED`);
        errors++;
      }
    }
  }
}

// ── Check KV_PREFIXES properties ───────────────────────
const kvPath = join(SERVER_DIR, 'kv-keys.ts');
try {
  const kvPrefixProps = getKvPrefixProperties(kvPath);
  console.log(`\n[FILE] KV_PREFIXES: ${kvPrefixProps.size} properties`);

  for (const file of allFiles) {
    if (file.endsWith('kv-keys.ts')) continue;

    const content = readFileSync(file, 'utf-8');
    const usedProps = getKvPrefixUsage(content);
    totalChecked += usedProps.length;

    for (const prop of usedProps) {
      if (!kvPrefixProps.has(prop)) {
        const relPath = relative('.', file);
        console.log(`  [FAIL] ${relPath} uses KV_PREFIXES.${prop} — NOT DEFINED`);
        errors++;
      }
    }
  }
} catch (e) {
  console.log(`[WARN] Could not validate KV_PREFIXES: ${e.message}`);
}

// ── Result ──────────────────────────────────────────────
console.log(`\n${'='.repeat(60)}`);
console.log(`  Checked: ${totalChecked} imports across ${allFiles.length} files`);

if (errors > 0) {
  console.log(`\n  FAILED: ${errors} missing export(s) found.`);
  console.log(`  These WILL cause BOOT_ERROR (503) on Supabase.`);
  console.log(`  Fix kv-keys.ts / shared-types.ts before deploying.\n`);
  process.exit(1);
} else {
  console.log(`\n  PASSED: All imports validated. Safe to deploy.\n`);
}

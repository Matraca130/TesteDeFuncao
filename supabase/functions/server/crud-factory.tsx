// ============================================================
// Axon v4.2 — Generic CRUD Factory + Shared Route Helpers
// Generates POST, GET (list), GET :id, PUT :id, DELETE :id
// for entities following the standard parent→child KV pattern.
// ============================================================
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

// ── Auth helper ────────────────────────────────────────────
export async function getAuthUser(c: any) {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    return user;
  } catch {
    return null;
  }
}

// ── Response helpers ──────────────────────────────────────
export function unauthorized(c: any) {
  return c.json(
    { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    401
  );
}

export function notFound(c: any, entity: string) {
  return c.json(
    { success: false, error: { code: "NOT_FOUND", message: `${entity} not found` } },
    404
  );
}

export function validationError(c: any, msg: string, details?: any) {
  return c.json(
    { success: false, error: { code: "VALIDATION_ERROR", message: msg, details } },
    400
  );
}

export function serverError(c: any, ctx: string, err: any) {
  console.log(`[Content] ${ctx} error:`, err);
  return c.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: `${ctx}: ${err}` } },
    500
  );
}

// ── KV child-fetch helper ──────────────────────────────────
export async function getChildren(
  prefix: string,
  primaryKeyFn: (id: string) => string
) {
  const ids = await kv.getByPrefix(prefix);
  if (!ids || ids.length === 0) return [];
  const items = await kv.mget(ids.map((id: string) => primaryKeyFn(id)));
  return items.filter(Boolean);
}

// ── Cascade key collector ─────────────────────────────────
// Recursively collects primary + index keys for nested children.
// Each level describes how to find children of a parent and which
// keys to include for deletion.
//
// Example: cascadeCollect(courseId, [
//   { childPrefix: PREFIX.semestersOfCourse, ... },   // level 0
//   { childPrefix: PREFIX.sectionsOfSemester, ... },  // level 1
//   { childPrefix: PREFIX.topicsOfSection, ... },     // level 2
// ])
// → collects all semester, section, and topic keys under the course.

export interface CascadeLevel {
  childPrefix: (parentId: string) => string;
  childPrimaryKey: (childId: string) => string;
  childIndexKey: (parentId: string, childId: string) => string;
}

export async function cascadeCollect(
  parentId: string,
  levels: CascadeLevel[]
): Promise<string[]> {
  if (levels.length === 0) return [];
  const [level, ...rest] = levels;
  const childIds = await kv.getByPrefix(level.childPrefix(parentId));
  const keys: string[] = [];
  for (const childId of childIds) {
    keys.push(
      level.childPrimaryKey(childId),
      level.childIndexKey(parentId, childId)
    );
    if (rest.length > 0) {
      keys.push(...(await cascadeCollect(childId, rest)));
    }
  }
  return keys;
}

// ── Entity configuration ──────────────────────────────────
export interface EntityConfig {
  /** Plural route name, e.g. "courses" */
  route: string;
  /** Singular display name for errors, e.g. "Course" */
  label: string;
  /** KV primary key builder, e.g. KV.course */
  primaryKey: (id: string) => string;
  /** Required body fields for POST */
  requiredFields: string[];
  /** Optional fields → default values for POST */
  optionalDefaults: Record<string, any>;
  /** Parent FK field name in the entity body, e.g. "institution_id" */
  parentField: string;
  /** Index key builder: (parentId, childId) => index key */
  indexKey: (parentId: string, childId: string) => string;
  /** Query param name for GET list, e.g. "institution_id" */
  parentQueryParam: string;
  /** Prefix builder for GET list */
  listPrefix: (parentId: string) => string;
  /** Optional: return extra keys to delete on cascade */
  cascadeDelete?: (id: string, entity: any) => Promise<string[]>;
}

// ── Factory ───────────────────────────────────────────────
// Registers 5 standard CRUD routes on the given Hono app:
// POST /:route, GET /:route, GET /:route/:id, PUT /:route/:id, DELETE /:route/:id

export function registerCrudRoutes(app: Hono, config: EntityConfig) {
  const {
    route,
    label,
    primaryKey,
    requiredFields,
    optionalDefaults,
    parentField,
    indexKey,
    parentQueryParam,
    listPrefix,
    cascadeDelete,
  } = config;

  // ── POST — create ────────────────────────────────────────
  app.post(`/${route}`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return unauthorized(c);
      const body = await c.req.json();

      const missing = requiredFields.filter((f) => !body[f]);
      if (missing.length > 0) {
        return validationError(c, `Missing required fields: ${missing.join(", ")}`);
      }

      const id = crypto.randomUUID();
      const entity: Record<string, any> = {
        id,
        created_at: new Date().toISOString(),
        created_by: user.id,
      };
      for (const f of requiredFields) entity[f] = body[f];
      for (const [f, def] of Object.entries(optionalDefaults)) {
        entity[f] = body[f] ?? def;
      }

      await kv.mset(
        [primaryKey(id), indexKey(body[parentField], id)],
        [entity, id]
      );
      return c.json({ success: true, data: entity }, 201);
    } catch (err) {
      return serverError(c, `POST /${route}`, err);
    }
  });

  // ── GET list — by parent query param ─────────────────────
  app.get(`/${route}`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return unauthorized(c);
      const pid = c.req.query(parentQueryParam);
      if (!pid)
        return validationError(c, `${parentQueryParam} query param required`);
      const items = await getChildren(listPrefix(pid), primaryKey);
      return c.json({ success: true, data: items });
    } catch (err) {
      return serverError(c, `GET /${route}`, err);
    }
  });

  // ── GET :id ──────────────────────────────────────────────
  app.get(`/${route}/:id`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return unauthorized(c);
      const item = await kv.get(primaryKey(c.req.param("id")));
      if (!item) return notFound(c, label);
      return c.json({ success: true, data: item });
    } catch (err) {
      return serverError(c, `GET /${route}/:id`, err);
    }
  });

  // ── PUT :id — partial update ─────────────────────────────
  app.put(`/${route}/:id`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return unauthorized(c);
      const id = c.req.param("id");
      const existing = await kv.get(primaryKey(id));
      if (!existing) return notFound(c, label);
      const body = await c.req.json();
      const updated = {
        ...existing,
        ...body,
        id,
        updated_at: new Date().toISOString(),
      };
      await kv.set(primaryKey(id), updated);
      return c.json({ success: true, data: updated });
    } catch (err) {
      return serverError(c, `PUT /${route}/:id`, err);
    }
  });

  // ── DELETE :id — with optional cascade ───────────────────
  app.delete(`/${route}/:id`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return unauthorized(c);
      const id = c.req.param("id");
      const entity = await kv.get(primaryKey(id));
      if (!entity) return notFound(c, label);

      const keysToDelete: string[] = [
        primaryKey(id),
        indexKey(entity[parentField], id),
      ];
      if (cascadeDelete) {
        keysToDelete.push(...(await cascadeDelete(id, entity)));
      }
      await kv.mdel(keysToDelete);
      return c.json({ success: true, data: { deleted: true } });
    } catch (err) {
      return serverError(c, `DELETE /${route}/:id`, err);
    }
  });
}

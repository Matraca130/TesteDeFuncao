// ============================================================
// Axon v4.2 — Generic CRUD Factory + Shared Route Helpers
// Generates POST, GET (list), GET :id, PUT :id, DELETE :id
// for entities following the standard parent->child KV pattern.
// ============================================================
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
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
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log(`[Auth] getAuthUser failed: ${error?.message ?? "no user"}`);
      return null;
    }
    return user;
  } catch (err) {
    console.log(`[Auth] getAuthUser exception: ${err}`);
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
  console.log(`[Content] ${ctx} error:`, err?.message ?? err);
  return c.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: `${ctx}: ${err?.message ?? err}` } },
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
  route: string;
  label: string;
  primaryKey: (id: string) => string;
  requiredFields: string[];
  optionalDefaults: Record<string, any>;
  parentField: string;
  indexKey: (parentId: string, childId: string) => string;
  parentQueryParam: string;
  listPrefix: (parentId: string) => string;
  cascadeDelete?: (id: string, entity: any) => Promise<string[]>;
}

// ── Factory ───────────────────────────────────────────────
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

      const pk = primaryKey(id);
      const idx = indexKey(body[parentField], id);
      console.log(`[CRUD] POST /${route} → kv.mset([${pk}, ${idx}])`);
      await kv.mset([pk, idx], [entity, id]);
      console.log(`[CRUD] POST /${route} → kv.mset OK for ${id}`);
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
      console.log(`[CRUD] PUT /${route}/${id} → kv.set(${primaryKey(id)})`);
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
      console.log(`[CRUD] DELETE /${route}/${id} → kv.mdel(${keysToDelete.length} keys)`);
      await kv.mdel(keysToDelete);
      return c.json({ success: true, data: { deleted: true } });
    } catch (err) {
      return serverError(c, `DELETE /${route}/:id`, err);
    }
  });
}
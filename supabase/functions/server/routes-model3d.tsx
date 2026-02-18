// ============================================================
// Axon v4.2 — Dev 7: 3D Model Routes (Backend)
// 7 routes for Model3DAsset CRUD, GLB upload, signed URLs,
// thumbnail upload, and annotation management.
//
// Pattern: Hono sub-app exported as default.
// Registered in index.tsx as: app.route(PREFIX, model3d)
//
// Decisions: D41 (1:1 summary-model), D42 (keyword popup link)
// Annotations are EMBEDDED in Model3DAsset.annotations[] — NOT
// separate KV entries.
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  model3dKey,
  idxSummaryModel3d,
  idxTopicModel3d,
  idxKwModel3d,
  KV_PREFIXES,
} from "./kv-keys.ts";
import {
  getAuthUser,
  getSupabaseAdmin,
  unauthorized,
  notFound,
  validationError,
  serverError,
} from "./crud-factory.tsx";
import type { Model3DAsset, Model3DAnnotation } from "./shared-types.ts";

// Response enrichment DTO (route-layer, not a domain entity)
interface Model3DAssetWithUrls extends Model3DAsset {
  file_url: string | null;
  thumbnail_url: string | null;
}

const BUCKET_NAME = "make-0ada7954-models3d";

// ── Constraints ─────────────────────────────────────────────
const MAX_GLB_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5 MB

// ── Helpers ─────────────────────────────────────────────────

/** Ensure the private storage bucket exists (idempotent). */
async function ensureBucket(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b: { name: string }) => b.name === BUCKET_NAME);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
    });
    if (error) {
      console.log(`[Model3D] createBucket error: ${error.message}`);
    } else {
      console.log(`[Model3D] Bucket "${BUCKET_NAME}" created (private)`);
    }
  }
}

/** Generate a signed URL for a file in the private bucket (1hr expiry). */
async function getSignedUrl(filePath: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600); // 1 hour = 3600 seconds
  if (error) {
    console.log(
      `[Model3D] Signed URL error for "${filePath}": ${error.message}`
    );
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Enrich a model object with signed URLs for file + thumbnail. */
async function enrichWithUrls(
  model: Model3DAsset
): Promise<Model3DAssetWithUrls> {
  let file_url: string | null = null;
  let thumbnail_url: string | null = null;

  if (model.status === "active" && model.file_path) {
    file_url = await getSignedUrl(model.file_path);
  }
  if (model.thumbnail_path) {
    thumbnail_url = await getSignedUrl(model.thumbnail_path);
  }

  return { ...model, file_url, thumbnail_url };
}

/** Validate a single annotation object. Returns error string or null. */
function validateAnnotation(
  ann: Partial<Model3DAnnotation>,
  idx: number
): string | null {
  if (!ann.id || typeof ann.id !== "string") {
    return `annotations[${idx}].id is required and must be a string`;
  }
  if (!ann.label || typeof ann.label !== "string") {
    return `annotations[${idx}].label is required and must be a string`;
  }
  if (!ann.description || typeof ann.description !== "string") {
    return `annotations[${idx}].description is required and must be a string`;
  }
  if (
    !Array.isArray(ann.position) ||
    ann.position.length !== 3 ||
    ann.position.some((v: unknown) => typeof v !== "number")
  ) {
    return `annotations[${idx}].position must be [number, number, number]`;
  }
  if (!ann.color || typeof ann.color !== "string") {
    return `annotations[${idx}].color is required and must be a string`;
  }
  return null;
}

/** Validate an array of annotations. Returns first error or null. */
function validateAnnotations(
  annotations: Partial<Model3DAnnotation>[]
): string | null {
  for (let i = 0; i < annotations.length; i++) {
    const err = validateAnnotation(annotations[i], i);
    if (err) return err;
  }
  return null;
}

// ── Hono Sub-App ────────────────────────────────────────────

const model3d = new Hono();

// Fire-and-forget bucket creation on module load
ensureBucket().catch((err: any) =>
  console.log(`[Model3D] ensureBucket startup error: ${err?.message ?? err}`)
);

// ================================================================
// Route 1: POST /models3d — Create metadata (status=draft)
// ================================================================
model3d.post("/models3d", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();

    // Validate required fields
    if (
      !body.name ||
      !body.summary_id ||
      !body.topic_id ||
      !body.file_format
    ) {
      return validationError(
        c,
        "Missing required fields: name, summary_id, topic_id, file_format"
      );
    }

    // Validate file_format
    if (!["glb", "gltf"].includes(body.file_format)) {
      return validationError(c, "file_format must be 'glb' or 'gltf'");
    }

    // Validate annotations if provided
    if (body.annotations && Array.isArray(body.annotations)) {
      const annErr = validateAnnotations(body.annotations);
      if (annErr) return validationError(c, annErr);
    }

    // D41: Enforce 1:1 constraint — one model per summary
    const existingIds = await kv.getByPrefix(
      KV_PREFIXES.IDX_SUMMARY_MODEL3D + body.summary_id + ":"
    );
    if (existingIds.length > 0) {
      return c.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message:
              "Summary already has a 3D model (D41: 1:1 constraint). Delete the existing model first.",
          },
        },
        409
      );
    }

    const modelId = crypto.randomUUID();
    const now = new Date().toISOString();

    const model: Model3DAsset = {
      id: modelId,
      name: body.name,
      description: body.description ?? "",
      summary_id: body.summary_id,
      topic_id: body.topic_id,
      keyword_ids: body.keyword_ids ?? [],
      file_path: `${modelId}.${body.file_format}`,
      file_size_bytes: 0,
      file_format: body.file_format,
      // thumbnail_path omitted — optional per shared-types.ts
      annotations: (body.annotations ?? []) as Model3DAnnotation[],
      camera_position: body.camera_position ?? [0, 2, 5],
      camera_target: body.camera_target ?? [0, 0, 0],
      scale: body.scale ?? 1.0,
      created_by: user.id,
      created_at: now,
      updated_at: now,
      status: "draft",
    };

    // Persist primary + all indices atomically via mset
    const keys: string[] = [
      model3dKey(modelId),
      idxSummaryModel3d(body.summary_id, modelId),
      idxTopicModel3d(body.topic_id, modelId),
    ];
    const values: (Model3DAsset | string)[] = [model, modelId, modelId];

    // Keyword indices
    for (const kwId of model.keyword_ids) {
      keys.push(idxKwModel3d(kwId, modelId));
      values.push(modelId);
    }

    await kv.mset(keys, values);

    console.log(
      `[Model3D] Created model ${modelId} for summary ${body.summary_id} (${keys.length} KV keys)`
    );
    return c.json({ success: true, data: model }, 201);
  } catch (err: any) {
    return serverError(c, "POST /models3d", err);
  }
});

// ================================================================
// Route 2: POST /models3d/:id/upload — Upload GLB/GLTF file
// Re-upload overwrites existing file (upsert: true).
// ================================================================
model3d.post("/models3d/:id/upload", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const modelId = c.req.param("id");
    const model: Model3DAsset | null = await kv.get(model3dKey(modelId));
    if (!model) return notFound(c, "Model3D");

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return validationError(
        c,
        "Missing 'file' field in multipart form data"
      );
    }

    // Validate file size before loading into memory
    if (file.size > MAX_GLB_SIZE) {
      return validationError(
        c,
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${MAX_GLB_SIZE / 1024 / 1024} MB`
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    // Upload to Supabase Storage (private bucket)
    // Use correct MIME type based on file format
    const supabase = getSupabaseAdmin();
    const defaultMime = model.file_format === "gltf" ? "model/gltf+json" : "model/gltf-binary";
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(model.file_path, buffer, {
        contentType: file.type || defaultMime,
        upsert: true, // allows re-upload over existing file
      });

    if (uploadError) {
      console.log(
        `[Model3D] Upload error for ${modelId}: ${uploadError.message}`
      );
      return c.json(
        {
          success: false,
          error: {
            code: "UPLOAD_ERROR",
            message: `File upload failed: ${uploadError.message}`,
          },
        },
        500
      );
    }

    // Update model: status -> active, record file size
    const updatedModel: Model3DAsset = {
      ...model,
      status: "active",
      file_size_bytes: buffer.byteLength,
      updated_at: new Date().toISOString(),
    };
    await kv.set(model3dKey(modelId), updatedModel);

    console.log(
      `[Model3D] Uploaded file for ${modelId} (${buffer.byteLength} bytes) -> status=active`
    );
    return c.json({
      success: true,
      data: {
        id: modelId,
        status: updatedModel.status,
        file_path: model.file_path,
        file_size_bytes: buffer.byteLength,
      },
    });
  } catch (err: any) {
    return serverError(c, "POST /models3d/:id/upload", err);
  }
});

// ================================================================
// Route 3: POST /models3d/:id/thumbnail — Upload thumbnail PNG
// ================================================================
model3d.post("/models3d/:id/thumbnail", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const modelId = c.req.param("id");
    const model: Model3DAsset | null = await kv.get(model3dKey(modelId));
    if (!model) return notFound(c, "Model3D");

    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return validationError(
        c,
        "Missing 'file' field in multipart form data"
      );
    }

    // Validate file size
    if (file.size > MAX_THUMBNAIL_SIZE) {
      return validationError(
        c,
        `Thumbnail too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${MAX_THUMBNAIL_SIZE / 1024 / 1024} MB`
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const thumbnailPath = `${modelId}-thumb.png`;

    // Upload thumbnail to private bucket
    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailPath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.log(
        `[Model3D] Thumbnail upload error for ${modelId}: ${uploadError.message}`
      );
      return c.json(
        {
          success: false,
          error: {
            code: "UPLOAD_ERROR",
            message: `Thumbnail upload failed: ${uploadError.message}`,
          },
        },
        500
      );
    }

    // Update model metadata with thumbnail path
    const updatedModel: Model3DAsset = {
      ...model,
      thumbnail_path: thumbnailPath,
      updated_at: new Date().toISOString(),
    };
    await kv.set(model3dKey(modelId), updatedModel);

    console.log(`[Model3D] Thumbnail uploaded for ${modelId}`);
    return c.json({
      success: true,
      data: {
        id: modelId,
        thumbnail_path: thumbnailPath,
      },
    });
  } catch (err: any) {
    return serverError(c, "POST /models3d/:id/thumbnail", err);
  }
});

// ================================================================
// Route 4: GET /models3d — List models (filtered, with signed URLs)
// Query params: summary_id | topic_id | keyword_id (optional)
// ================================================================
model3d.get("/models3d", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const summaryId = c.req.query("summary_id");
    const topicId = c.req.query("topic_id");
    const keywordId = c.req.query("keyword_id");

    let models: Model3DAsset[];

    if (summaryId) {
      const modelIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_SUMMARY_MODEL3D + summaryId + ":"
      );
      if (modelIds.length === 0) {
        return c.json({ success: true, data: [] });
      }
      models = (
        await kv.mget(modelIds.map((id: string) => model3dKey(id)))
      ).filter(Boolean);
    } else if (topicId) {
      const modelIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_TOPIC_MODEL3D + topicId + ":"
      );
      if (modelIds.length === 0) {
        return c.json({ success: true, data: [] });
      }
      models = (
        await kv.mget(modelIds.map((id: string) => model3dKey(id)))
      ).filter(Boolean);
    } else if (keywordId) {
      const modelIds: string[] = await kv.getByPrefix(
        KV_PREFIXES.IDX_KW_MODEL3D + keywordId + ":"
      );
      if (modelIds.length === 0) {
        return c.json({ success: true, data: [] });
      }
      models = (
        await kv.mget(modelIds.map((id: string) => model3dKey(id)))
      ).filter(Boolean);
    } else {
      // No filter — return all models via primary key prefix
      models = await kv.getByPrefix(KV_PREFIXES.MODEL3D);
    }

    // Enrich each model with signed URLs
    const enriched: Model3DAssetWithUrls[] = await Promise.all(
      models.map((m: Model3DAsset) => enrichWithUrls(m))
    );

    return c.json({ success: true, data: enriched });
  } catch (err: any) {
    return serverError(c, "GET /models3d", err);
  }
});

// ================================================================
// Route 5: GET /models3d/:id — Get single model + signed URLs
// ================================================================
model3d.get("/models3d/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const modelId = c.req.param("id");
    const model: Model3DAsset | null = await kv.get(model3dKey(modelId));
    if (!model) return notFound(c, "Model3D");

    const enriched: Model3DAssetWithUrls = await enrichWithUrls(model);

    return c.json({ success: true, data: enriched });
  } catch (err: any) {
    return serverError(c, "GET /models3d/:id", err);
  }
});

// ================================================================
// Route 6: PUT /models3d/:id — Update metadata + re-index keywords
// Updatable: name, description, keyword_ids, annotations,
//            camera_position, camera_target, scale
// Immutable: id, summary_id, topic_id, file_path, file_format,
//            created_by, created_at, status, file_size_bytes,
//            thumbnail_path
// ================================================================
model3d.put("/models3d/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const modelId = c.req.param("id");
    const existing: Model3DAsset | null = await kv.get(model3dKey(modelId));
    if (!existing) return notFound(c, "Model3D");

    const body = await c.req.json();

    // Validate annotations if provided
    if (body.annotations && Array.isArray(body.annotations)) {
      const annErr = validateAnnotations(body.annotations);
      if (annErr) return validationError(c, annErr);
    }

    // Build updated model — protect immutable fields
    const updated: Model3DAsset = {
      // Immutable — always from existing
      id: modelId,
      summary_id: existing.summary_id,
      topic_id: existing.topic_id,
      file_path: existing.file_path,
      file_format: existing.file_format,
      file_size_bytes: existing.file_size_bytes,
      thumbnail_path: existing.thumbnail_path,
      status: existing.status,
      created_by: existing.created_by,
      created_at: existing.created_at,
      // Updatable
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      keyword_ids: existing.keyword_ids, // may be overwritten below
      annotations: body.annotations ?? existing.annotations,
      camera_position: body.camera_position ?? existing.camera_position,
      camera_target: body.camera_target ?? existing.camera_target,
      scale: body.scale ?? existing.scale,
      updated_at: new Date().toISOString(),
    };

    const keys: string[] = [model3dKey(modelId)];
    const values: (Model3DAsset | string)[] = [updated];

    // Handle keyword_ids changes: diff old vs new, re-index
    if (body.keyword_ids !== undefined) {
      const oldKwIds: string[] = existing.keyword_ids ?? [];
      const newKwIds: string[] = body.keyword_ids ?? [];

      // Delete removed keyword indices
      const removedKwIds = oldKwIds.filter(
        (kwId: string) => !newKwIds.includes(kwId)
      );
      if (removedKwIds.length > 0) {
        await kv.mdel(
          removedKwIds.map((kwId: string) => idxKwModel3d(kwId, modelId))
        );
      }

      // Add new keyword indices
      const addedKwIds = newKwIds.filter(
        (kwId: string) => !oldKwIds.includes(kwId)
      );
      for (const kwId of addedKwIds) {
        keys.push(idxKwModel3d(kwId, modelId));
        values.push(modelId);
      }

      updated.keyword_ids = newKwIds;
    }

    await kv.mset(keys, values);

    console.log(`[Model3D] Updated model ${modelId}`);
    return c.json({ success: true, data: updated });
  } catch (err: any) {
    return serverError(c, "PUT /models3d/:id", err);
  }
});

// ================================================================
// Route 7: DELETE /models3d/:id — Delete model + files + all indices
// Cascade: Storage files + primary KV key + all index keys
// ================================================================
model3d.delete("/models3d/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const modelId = c.req.param("id");
    const model: Model3DAsset | null = await kv.get(model3dKey(modelId));
    if (!model) return notFound(c, "Model3D");

    // 1. Delete files from Supabase Storage
    const supabase = getSupabaseAdmin();
    const filesToRemove: string[] = [model.file_path];
    if (model.thumbnail_path) {
      filesToRemove.push(model.thumbnail_path);
    }

    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToRemove);

    if (removeError) {
      // Log but don't fail — KV cleanup is more important
      console.log(
        `[Model3D] Storage removal warning for ${modelId}: ${removeError.message}`
      );
    }

    // 2. Build complete KV delete list (primary + all indices)
    const keysToDelete: string[] = [
      model3dKey(modelId),
      idxSummaryModel3d(model.summary_id, modelId),
      idxTopicModel3d(model.topic_id, modelId),
    ];

    for (const kwId of model.keyword_ids ?? []) {
      keysToDelete.push(idxKwModel3d(kwId, modelId));
    }

    // 3. Atomic delete of all KV keys
    await kv.mdel(keysToDelete);

    console.log(
      `[Model3D] Deleted model ${modelId} (${keysToDelete.length} KV keys, ${filesToRemove.length} storage files)`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err: any) {
    return serverError(c, "DELETE /models3d/:id", err);
  }
});

export default model3d;

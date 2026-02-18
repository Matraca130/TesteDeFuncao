// ============================================================
// Axon v5.4 — Dev 7: 3D Model Routes (Backend)
// 7 routes for Model3DAsset CRUD, GLB upload, signed URLs,
// thumbnail upload, and annotation management.
//
// Pattern: Hono sub-app exported as default.
// Registered in index.ts as: app.route(PREFIX, model3d)
//
// Decisions:
//   D41 (1:1 summary-model) — TOCTOU mitigation via atomic
//        sentinel key `idx:summary-model3d:{summaryId}` set
//        BEFORE full model creation, cleaned up on failure.
//   D42 (keyword popup link via annotation.keyword_id)
//
// Annotations are EMBEDDED in Model3DAsset.annotations[]
// Storage bucket: make-0ada7954-models3d (PRIVATE)
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
  getChildren,
} from "./crud-factory.tsx";
import type { Model3DAsset, Model3DAnnotation } from "./shared-types.ts";

// Response enrichment DTO (route-layer, not a domain entity)
interface Model3DAssetWithUrls extends Model3DAsset {
  file_url: string | null;
  thumbnail_url: string | null;
}

const BUCKET_NAME = "make-0ada7954-models3d";

// ── Error message extractor ────────────────────────────────
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ── Ensure bucket exists (idempotent, cached) ──────────────
let _bucketChecked = false;
async function ensureBucket(): Promise<void> {
  if (_bucketChecked) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: { name: string }) => b.name === BUCKET_NAME);
    if (!exists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB max
      });
      if (error) {
        console.log(`[Model3D] createBucket error: ${error.message}`);
      } else {
        console.log(`[Model3D] Bucket "${BUCKET_NAME}" created (private)`);
      }
    }
    _bucketChecked = true;
  } catch (err) {
    console.log(`[Model3D] ensureBucket warning: ${errMsg(err)}`);
    // Don't block — bucket might already exist via dashboard
    _bucketChecked = true;
  }
}

/** Generate a signed URL for a file in the private bucket (1hr expiry). */
async function getSignedUrl(filePath: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600);
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

  if (model.file_path) {
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
ensureBucket().catch((err: unknown) =>
  console.log(`[Model3D] ensureBucket startup error: ${errMsg(err)}`)
);

// ================================================================
// Route 1: POST /models3d — Create metadata (status=draft)
// D41: Enforces 1:1 summary-model constraint.
// TOCTOU mitigation: set sentinel key BEFORE full model creation.
// If the mset fails, the sentinel is cleaned up.
// ================================================================
model3d.post("/models3d", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const body = await c.req.json();
    const { name, summary_id, topic_id } = body;

    // Validate required fields
    if (!name || !summary_id || !topic_id) {
      return validationError(
        c,
        "name, summary_id, and topic_id are required"
      );
    }

    // Validate file_format if provided
    if (body.file_format && !["glb", "gltf"].includes(body.file_format)) {
      return validationError(c, "file_format must be 'glb' or 'gltf'");
    }

    // Validate annotations if provided
    if (body.annotations && Array.isArray(body.annotations)) {
      const annErr = validateAnnotations(body.annotations);
      if (annErr) return validationError(c, annErr);
    }

    // D41: Each summary can have at most ONE 3D model (1:1 relation)
    // TOCTOU mitigation: Use a single sentinel key per summary.
    // We first check, then immediately claim it. The window between
    // get and set is minimal (single-key operations are fast).
    // A fully atomic CAS would require a DB table with UNIQUE constraint.
    const sentinelKey = KV_PREFIXES.IDX_SUMMARY_MODEL3D + summary_id;
    const existingSentinel = await kv.get(sentinelKey);
    if (existingSentinel) {
      return c.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message:
              "This summary already has a 3D model. Each summary supports at most one model (D41). Delete the existing model first.",
          },
        },
        409
      );
    }

    const modelId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Claim the sentinel immediately to narrow TOCTOU window
    await kv.set(sentinelKey, modelId);

    const model: Model3DAsset = {
      id: modelId,
      name,
      description: body.description ?? "",
      summary_id,
      topic_id,
      keyword_ids: body.keyword_ids ?? [],
      file_path: "",
      file_size_bytes: 0,
      file_format: body.file_format ?? "glb",
      annotations: (body.annotations ?? []) as Model3DAnnotation[],
      camera_position: body.camera_position ?? [0, 1, 3],
      camera_target: body.camera_target ?? [0, 0, 0],
      scale: body.scale ?? 1.0,
      created_by: user.id,
      created_at: now,
      updated_at: now,
      status: "draft",
    };

    // Set primary key + remaining indices (sentinel already set above)
    const keys: string[] = [
      model3dKey(modelId),
      idxTopicModel3d(topic_id, modelId),
    ];
    const values: (Model3DAsset | string)[] = [model, modelId];

    // Keyword indices
    for (const kwId of model.keyword_ids) {
      keys.push(idxKwModel3d(kwId, modelId));
      values.push(modelId);
    }

    try {
      await kv.mset(keys, values);
    } catch (msetErr) {
      // Cleanup sentinel if model creation fails
      await kv.del(sentinelKey);
      throw msetErr;
    }

    console.log(
      `[Model3D] Created model ${modelId} (draft) for summary ${summary_id} by ${user.id} (${keys.length + 1} KV keys)`
    );
    return c.json({ success: true, data: model }, 201);
  } catch (err: unknown) {
    return serverError(c, "POST /models3d", err);
  }
});

// ================================================================
// Route 2: POST /models3d/:id/upload — Upload GLB/GLTF file
// Changes status from draft to active. Re-upload overwrites (upsert).
// ================================================================
model3d.post("/models3d/:id/upload", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const modelId = c.req.param("id");
    const model: Model3DAsset | null = await kv.get(model3dKey(modelId));
    if (!model) return notFound(c, "Model3DAsset");

    // Ensure bucket exists (cached after first check)
    await ensureBucket();

    // Parse multipart form data (Hono parseBody)
    const formData = await c.req.parseBody();
    const file = formData["file"];

    if (!file || !(file instanceof File)) {
      return validationError(
        c,
        "A GLB/GLTF file is required (multipart form-data, field name: 'file')"
      );
    }

    // Validate file type — browsers may not set correct MIME for GLB
    const allowedTypes = [
      "model/gltf-binary",
      "model/gltf+json",
      "application/octet-stream",
    ];
    const fileName = file.name || "";
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (
      !allowedTypes.includes(file.type) &&
      ext !== "glb" &&
      ext !== "gltf"
    ) {
      return validationError(
        c,
        `Invalid file type: ${file.type}. Expected GLB or GLTF file.`
      );
    }

    const format = ext === "gltf" ? "gltf" : "glb";
    const filePath = `${modelId}.${format}`;
    const contentType =
      format === "glb" ? "model/gltf-binary" : "model/gltf+json";

    // Upload to Supabase Storage (private bucket)
    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType,
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

    // Update model: file_path, size, format, status -> active
    const updatedModel: Model3DAsset = {
      ...model,
      file_path: filePath,
      file_size_bytes: file.size,
      file_format: format as "glb" | "gltf",
      status: "active",
      updated_at: new Date().toISOString(),
    };
    await kv.set(model3dKey(modelId), updatedModel);

    // Generate signed URL for the response
    const signedUrl = await getSignedUrl(filePath);

    console.log(
      `[Model3D] Uploaded ${format} for model ${modelId} (${file.size} bytes) — status: active`
    );
    return c.json({
      success: true,
      data: {
        ...updatedModel,
        file_url: signedUrl,
        thumbnail_url: null,
      },
    });
  } catch (err: unknown) {
    return serverError(c, "POST /models3d/:id/upload", err);
  }
});

// ================================================================
// Route 3: POST /models3d/:id/thumbnail — Upload thumbnail image
// Stored as {modelId}-thumb.png in same bucket.
// ================================================================
model3d.post("/models3d/:id/thumbnail", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const modelId = c.req.param("id");
    const model: Model3DAsset | null = await kv.get(model3dKey(modelId));
    if (!model) return notFound(c, "Model3DAsset");

    await ensureBucket();

    const formData = await c.req.parseBody();
    const file = formData["file"];

    if (!file || !(file instanceof File)) {
      return validationError(
        c,
        "An image file is required (multipart form-data, field name: 'file')"
      );
    }

    // Validate image type
    const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedImageTypes.includes(file.type)) {
      return validationError(
        c,
        `Invalid image type: ${file.type}. Expected PNG, JPEG, or WebP.`
      );
    }

    const thumbnailPath = `${modelId}-thumb.png`;

    // Upload thumbnail to private bucket
    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailPath, file, {
        contentType: file.type,
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

    // Generate signed URL for the response
    const signedUrl = await getSignedUrl(thumbnailPath);

    console.log(`[Model3D] Thumbnail uploaded for model ${modelId}`);
    return c.json({
      success: true,
      data: {
        id: modelId,
        thumbnail_path: thumbnailPath,
        thumbnail_url: signedUrl,
      },
    });
  } catch (err: unknown) {
    return serverError(c, "POST /models3d/:id/thumbnail", err);
  }
});

// ================================================================
// Route 4: GET /models3d — List models (filtered, with signed URLs)
// Query params: summary_id | topic_id | keyword_id (optional)
// Uses getChildren helper for index resolution.
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
      const prefix = KV_PREFIXES.IDX_SUMMARY_MODEL3D + summaryId + ":";
      models = await getChildren(prefix, model3dKey);
    } else if (topicId) {
      const prefix = KV_PREFIXES.IDX_TOPIC_MODEL3D + topicId + ":";
      models = await getChildren(prefix, model3dKey);
    } else if (keywordId) {
      const prefix = KV_PREFIXES.IDX_KW_MODEL3D + keywordId + ":";
      models = await getChildren(prefix, model3dKey);
    } else {
      // No filter — return all models via primary key prefix scan
      const allEntries = await kv.getByPrefix(KV_PREFIXES.MODEL3D);
      models = (allEntries || []).filter(
        (item: any) => item !== null && item !== undefined
      );
    }

    // Enrich each model with signed URLs
    const enriched: Model3DAssetWithUrls[] = await Promise.all(
      models.map(async (m: Model3DAsset) => {
        try {
          return await enrichWithUrls(m);
        } catch {
          return { ...m, file_url: null, thumbnail_url: null };
        }
      })
    );

    return c.json({ success: true, data: enriched });
  } catch (err: unknown) {
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
    if (!model) return notFound(c, "Model3DAsset");

    const enriched: Model3DAssetWithUrls = await enrichWithUrls(model);

    return c.json({ success: true, data: enriched });
  } catch (err: unknown) {
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
    if (!existing) return notFound(c, "Model3DAsset");

    const body = await c.req.json();

    // Validate annotations if provided
    if (body.annotations && Array.isArray(body.annotations)) {
      const annErr = validateAnnotations(body.annotations);
      if (annErr) return validationError(c, annErr);
    }

    const now = new Date().toISOString();

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
      updated_at: now,
    };

    const keys: string[] = [model3dKey(modelId)];
    const values: (Model3DAsset | string)[] = [updated];

    // Handle keyword_ids changes: diff old vs new, re-index
    if (body.keyword_ids !== undefined) {
      const oldKwIds: string[] = existing.keyword_ids ?? [];
      const newKwIds: string[] = body.keyword_ids ?? [];

      // Compare sorted to detect actual changes
      const kwsChanged =
        JSON.stringify([...oldKwIds].sort()) !==
        JSON.stringify([...newKwIds].sort());

      if (kwsChanged) {
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
      }

      updated.keyword_ids = newKwIds;
    }

    await kv.mset(keys, values);

    console.log(`[Model3D] Updated model ${modelId} by ${user.id}`);
    return c.json({ success: true, data: updated });
  } catch (err: unknown) {
    return serverError(c, "PUT /models3d/:id", err);
  }
});

// ================================================================
// Route 7: DELETE /models3d/:id — Delete model + files + all indices
// Cascade: Storage files + primary KV key + all index keys
//          (including D41 sentinel key)
// ================================================================
model3d.delete("/models3d/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return unauthorized(c);

    const modelId = c.req.param("id");
    const model: Model3DAsset | null = await kv.get(model3dKey(modelId));
    if (!model) return notFound(c, "Model3DAsset");

    // 1. Delete files from Supabase Storage
    const supabase = getSupabaseAdmin();
    const filesToRemove: string[] = [];
    if (model.file_path) filesToRemove.push(model.file_path);
    if (model.thumbnail_path) filesToRemove.push(model.thumbnail_path);

    if (filesToRemove.length > 0) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToRemove);

      if (removeError) {
        // Log but don't fail — KV cleanup is more important
        console.log(
          `[Model3D] Storage removal warning for ${modelId}: ${removeError.message}`
        );
      }
    }

    // 2. Build complete KV delete list (primary + sentinel + all indices)
    const keysToDelete: string[] = [
      model3dKey(modelId),                                     // primary
      KV_PREFIXES.IDX_SUMMARY_MODEL3D + model.summary_id,      // D41 sentinel key
      idxSummaryModel3d(model.summary_id, modelId),             // legacy compound index
      idxTopicModel3d(model.topic_id, modelId),                 // topic index
    ];

    // Keyword indices
    for (const kwId of model.keyword_ids ?? []) {
      keysToDelete.push(idxKwModel3d(kwId, modelId));
    }

    // 3. Atomic delete of all KV keys
    await kv.mdel(keysToDelete);

    console.log(
      `[Model3D] Deleted model ${modelId} (${keysToDelete.length} keys, ${filesToRemove.length} files) by ${user.id}`
    );
    return c.json({ success: true, data: { deleted: true } });
  } catch (err: unknown) {
    return serverError(c, "DELETE /models3d/:id", err);
  }
});

console.log("[Model3D] 7 routes registered (v5.4)");

export default model3d;

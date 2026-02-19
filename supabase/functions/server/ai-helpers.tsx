// ============================================================
// Axon — AI Helpers (shared utilities)
// Used by: ai-routes.tsx (Dev 6) + ai-feedback-routes.tsx (Agent 7)
//
// Contains: Gemini API wrapper, JSON parser, BKT color system,
// error helpers, and shared constants.
// ============================================================

// ── Gemini API ───────────────────────────────────────────────
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

function getApiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  return key;
}

/**
 * Calls Gemini API with automatic model fallback and retry (3 attempts).
 * Supports JSON mode via responseMimeType.
 */
export async function callGemini(
  messages: { role: string; parts: { text: string }[] }[],
  systemInstruction?: string,
  temperature = 0.7,
  maxTokens = 4096,
  jsonMode = false
): Promise<string> {
  const apiKey = getApiKey();
  const body: Record<string, unknown> = {
    contents: messages,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP: 0.95,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    for (const model of MODELS) {
      const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
      if (res.status === 429 || res.status === 404) continue;
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 15000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Gemini API rate limit exceeded. Try again later.");
}

// ── Error message extractor (type-safe) ──────────────────────
export function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ── JSON parser (robust — handles markdown-wrapped JSON) ─────
export function parseGeminiJson(raw: string): Record<string, unknown> {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");
  return JSON.parse(jsonMatch[0]);
}

// ── BKT color system (server-side mirror of frontend) ────────
export function getBktLabel(pKnow: number): string {
  if (pKnow < 0.25) return "Nao domina";
  if (pKnow < 0.5) return "Em progresso";
  if (pKnow < 0.75) return "Quase domina";
  return "Domina";
}

export function getBktColor(pKnow: number): string {
  if (pKnow < 0.25) return "#ef4444"; // red-500
  if (pKnow < 0.5) return "#f97316";  // orange-500
  if (pKnow < 0.75) return "#eab308"; // yellow-500
  return "#22c55e";                    // green-500
}

export function getBktStatus(pKnow: number): string {
  if (pKnow < 0.25) return "precisa_atencao";
  if (pKnow < 0.5) return "em_progresso";
  if (pKnow < 0.75) return "em_progresso";
  return "dominado";
}

// ── Shared constants ─────────────────────────────────────────
/** System prompt for AI feedback endpoints (Agent 7). */
export const AI_FEEDBACK_SYSTEM = `Voce e Axon AI, um tutor especialista em educacao medica.
Responda SEMPRE em portugues brasileiro (pt-BR).
Seja encorajador mas honesto. Use linguagem acessivel.
Retorne APENAS JSON valido, sem markdown ou texto extra.`;

// ============================================================
// Axon — AI Helpers (shared utilities)
// Contains: Gemini API wrapper, JSON parser, BKT color system
// P5/A7-12: Enhanced system prompt with BKT context
// ============================================================

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

function getApiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  return key;
}

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

export function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function parseGeminiJson(raw: string): Record<string, unknown> {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");
  return JSON.parse(jsonMatch[0]);
}

export function getBktLabel(pKnow: number): string {
  if (pKnow < 0.25) return "Nao domina";
  if (pKnow < 0.5) return "Em progresso";
  if (pKnow < 0.75) return "Quase domina";
  return "Domina";
}

export function getBktColor(pKnow: number): string {
  if (pKnow < 0.25) return "#ef4444";
  if (pKnow < 0.5) return "#f97316";
  if (pKnow < 0.75) return "#eab308";
  return "#22c55e";
}

export function getBktStatus(pKnow: number): string {
  if (pKnow < 0.25) return "precisa_atencao";
  if (pKnow < 0.75) return "em_progresso";
  return "dominado";
}

export const AI_FEEDBACK_SYSTEM = `Voce e Axon AI, um tutor especialista em educacao medica e ciencias biologicas.
Responda SEMPRE em portugues brasileiro (pt-BR).
Seja encorajador mas honesto sobre lacunas de conhecimento.
Use linguagem acessivel e adaptada para estudantes universitarios.
Quando mencionar termos tecnicos, forneca breves explicacoes.
Considere o contexto completo do estudante: historico de estudo, padroes de erro, e nivel de dominio BKT.
Use cores BKT para indicar dominio: vermelho (p<0.25), laranja (0.25-0.5), amarelo (0.5-0.75), verde (>0.75).
Retorne APENAS JSON valido, sem markdown, sem texto extra, sem code fences.`;

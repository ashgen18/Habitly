/** Habitly insights Edge Function.
 * Cursor owns the prompt at ai/prompts/habit-insights.md.
 * If OPENAI_API_KEY is missing, the client uses local rules — do not claim this is AI.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors() })
  }
  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405)
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }

  const key = Deno.env.get("OPENAI_API_KEY")
  if (!key) {
    return json({ source: "rules", insights: null })
  }

  const prompt = Deno.env.get("HABITLY_INSIGHTS_PROMPT") ?? DEFAULT_PROMPT
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("HABITLY_MODEL") ?? "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
  })

  if (!response.ok) {
    return json({ source: "rules", insights: null })
  }

  const body = await response.json()
  const text = body.choices?.[0]?.message?.content ?? "{}"
  try {
    const parsed = JSON.parse(text) as { insights?: unknown }
    return json({ source: "model", insights: parsed.insights ?? [] })
  } catch {
    return json({ source: "rules", insights: null })
  }
})

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  })
}

const DEFAULT_PROMPT = `You write short, factual observations from habit history. Never invent completions. Return JSON: {"insights":[{"id":"string","text":"string"}]}. At most 5. Empty list if history is thin.`

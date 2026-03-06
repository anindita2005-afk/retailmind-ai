import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

const SYSTEM_PROMPT = `You are RetailIQ Copilot — an intelligent AI assistant built into the RetailMind platform.

You can help with ANY topic the user asks about, including but not limited to:
- Indian retail business strategy, GST, pricing, profit margins
- Inventory management and supplier negotiation
- E-commerce, marketing, and growth strategies
- General knowledge, coding, writing, analysis
- Science, history, current affairs, and more

Always be helpful, accurate, and conversational. For retail-related questions, provide India-specific context where relevant.`;

// ── Vercel AI SDK Data Stream Protocol helpers ───────────────────────────────
const enc = (encoder: TextEncoder, text: string) =>
  encoder.encode(`0:${JSON.stringify(text)}\n`);

const encData = (encoder: TextEncoder, payload: object) =>
  encoder.encode(`2:${JSON.stringify([payload])}\n`);

const encFinish = (encoder: TextEncoder) =>
  encoder.encode(
    `d:${JSON.stringify({ finishReason: "stop", usage: { promptTokens: 0, completionTokens: 0 } })}\n`
  );

// ── Gemini stream helper ─────────────────────────────────────────────────────
async function tryGemini(
  model: string,
  contents: { role: string; parts: { text: string }[] }[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const resp = await ai.models.generateContentStream({
    model,
    contents,
    config: { systemInstruction: SYSTEM_PROMPT },
  });
  for await (const chunk of resp) {
    const text = chunk.text;
    if (text) controller.enqueue(enc(encoder, text));
  }
}

// ── Groq SSE fallback ────────────────────────────────────────────────────────
async function tryGroq(
  messages: { role: string; content: string }[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const clean = messages.map(({ role, content }) => ({ role, content }));

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body}`);
  }

  const decoder = new TextDecoder();
  const reader = res.body!.getReader();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t || t === "data: [DONE]" || !t.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(t.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) controller.enqueue(enc(encoder, delta));
      } catch { /* skip bad SSE line */ }
    }
  }
}

// ── Puter SSE fallback ───────────────────────────────────────────────────────
async function tryPuter(
  messages: { role: string; content: string }[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const clean = messages.map(({ role, content }) => ({ role, content }));

  const res = await fetch("https://api.puter.com/puterai/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PUTER_AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Puter ${res.status}: ${body}`);
  }

  const decoder = new TextDecoder();
  const reader = res.body!.getReader();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t || t === "data: [DONE]" || !t.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(t.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) controller.enqueue(enc(encoder, delta));
      } catch { /* skip bad SSE line */ }
    }
  }
}

// ── Main route ───────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const geminiContents = (messages as { role: string; content: string }[]).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {

        // ① gemini-2.5-flash
        try {
          controller.enqueue(encData(encoder, { provider: "Gemini 2.5 Flash" }));
          await tryGemini("gemini-2.5-flash", geminiContents, controller, encoder);
          controller.enqueue(encFinish(encoder));
          return controller.close();
        } catch { /* quota / error — try next */ }

        // ② gemini-2.0-flash
        try {
          controller.enqueue(encData(encoder, { provider: "Gemini 2.0 Flash" }));
          await tryGemini("gemini-2.0-flash", geminiContents, controller, encoder);
          controller.enqueue(encFinish(encoder));
          return controller.close();
        } catch { /* try next */ }

        // ③ gemini-1.5-flash-latest
        try {
          controller.enqueue(encData(encoder, { provider: "Gemini 1.5 Flash" }));
          await tryGemini("gemini-1.5-flash-latest", geminiContents, controller, encoder);
          controller.enqueue(encFinish(encoder));
          return controller.close();
        } catch { /* try Groq */ }

        // ④ Groq Llama 3.3 70B — server-side fallback
        try {
          controller.enqueue(encData(encoder, { provider: "Groq Llama 3.3" }));
          await tryGroq(messages, controller, encoder);
          controller.enqueue(encFinish(encoder));
          return controller.close();
        } catch (e) {
          console.error("[Copilot] Groq failed, trying Puter:", e);
        }

        // ⑤ Puter GPT-4o — final server-side fallback
        try {
          controller.enqueue(encData(encoder, { provider: "Puter GPT-4o" }));
          await tryPuter(messages, controller, encoder);
        } catch (e) {
          console.error("[Copilot] All server providers failed including Puter:", e);
          controller.enqueue(enc(encoder, "\n\n**Error:** I'm sorry, but all my AI provider systems are currently unavailable. Please try again later."));
        }

        controller.enqueue(encFinish(encoder));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
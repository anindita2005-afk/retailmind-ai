import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY })

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { text, filename } = body as { text: string; filename: string }

    if (!text?.trim())
        return NextResponse.json({ error: "No file text provided" }, { status: 400 })

    const prompt = `You are an inventory data extraction expert. The user has uploaded a file named "${filename}" that contains product/inventory data.

Extract ALL products from the following text and return a valid JSON array. Each product object should have these exact keys:
- name (string, required)
- sku (string or null)
- category (string or null)
- unit (string, default "pcs")
- price (number, required - selling price)
- cost_price (number or 0)
- gst_rate (number, choose from 0/5/12/18/28, default 18)
- stock_qty (number or 0)
- description (string or null)

Rules:
- Return ONLY a raw JSON array — no markdown, no explanation, no extra text.
- If a field is missing, use null or 0 as appropriate.
- Infer category intelligently from product names if not explicitly stated.
- For GST rate: if not mentioned, use 18. Map common rates: food items → 5 or 0, electronics → 18 or 28, etc.
- Trim all strings.
- Do NOT include any product with no name.
- If the document mentions "zone" or "section", add it to the category field.

File content to parse:
---
${text.slice(0, 8000)}
---

Return only the JSON array:`

    try {
        const { text } = await generateText({
            model: google("gemini-2.5-flash"),
            prompt,
            maxTokens: 4096,
            temperature: 0.1,
        })
        const raw = text.trim() || "[]"

        // Strip any accidental markdown fences
        const cleaned = raw.replace(/^```json\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```$/i, "").trim()

        let products: any[]
        try {
            products = JSON.parse(cleaned)
            if (!Array.isArray(products)) products = []
        } catch {
            products = []
        }

        return NextResponse.json({ products, raw })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "AI parsing failed" }, { status: 500 })
    }
}

import { getSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {

  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { stats, topProducts, byCategory } = await request.json()

  const prompt = `
You are a data-driven AI assistant for an Indian retail business.

Analyze the following sales data and return EXACTLY this JSON format:

{
  "insights": [
    {
      "type": "opportunity",
      "title": "string",
      "description": "string"
    },
    {
      "type": "alert",
      "title": "string",
      "description": "string"
    }
  ]
}

Rules:
- Return JSON ONLY
- No markdown
- No explanation

Data:
Stats: ${JSON.stringify(stats)}
Top Products: ${JSON.stringify(topProducts)}
Category Breakdown: ${JSON.stringify(byCategory)}
`

  try {

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are a data API. Return STRICT valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 400
        })
      }
    )

    const raw = await response.text()
    let parsed;
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      console.error("Failed to parse Groq raw response in sales-insights:", raw)
      throw new Error("Invalid raw response from Groq")
    }

    if (parsed.error) {
      console.error("Groq API error:", parsed.error)
      throw new Error(parsed.error.message || "Groq Error")
    }

    let text = parsed?.choices?.[0]?.message?.content || "{}"

    text = text.replace(/```json/i, "").replace(/```/g, "").trim()

    let jsonObj;
    try {
      jsonObj = JSON.parse(text)
    } catch (e) {
      console.error("Failed to parse content as JSON:", text)
      throw new Error("AI did not return valid JSON")
    }

    if (!jsonObj.insights || !Array.isArray(jsonObj.insights)) {
      throw new Error("Model returned invalid structure")
    }

    const insights = jsonObj.insights

    return NextResponse.json({ insights })

  } catch (err) {

    console.error("[sales-insights]", err)

    return NextResponse.json(
      { error: "Failed to load insights. Please try again." },
      { status: 500 }
    )
  }
}
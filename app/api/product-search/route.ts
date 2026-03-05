import { getSession } from "@/lib/auth"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { NextRequest, NextResponse } from "next/server"

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { query } = await request.json()
  if (!query) return NextResponse.json({ error: "Search query is required." }, { status: 400 })

  const prompt = `You are an Indian retail market expert. A retailer is searching for: "${query}"

Return ONLY valid JSON with similar/alternative products available in the Indian market:
{
  "search_term": "${query}",
  "category": "string",
  "similar_products": [
    {
      "name": "string",
      "brand": "string",
      "price_min": 0,
      "price_max": 0,
      "quality_tier": "Premium|Standard|Budget",
      "rating": 4.0,
      "availability": "Widely Available|Moderately Available|Limited",
      "platforms": ["Amazon", "Flipkart"],
      "key_features": ["feature1", "feature2"],
      "pros": "string",
      "cons": "string"
    }
  ],
  "price_comparison": {
    "budget_range": "string",
    "mid_range": "string",
    "premium_range": "string"
  },
  "buying_recommendation": "string",
  "gst_rate": 18
}
Include 4-6 similar products. Use realistic Indian market prices in INR for 2025-2026.`

  try {
    const { text } = await generateText({ model: google("gemini-2.5-flash"), prompt, maxTokens: 1500 })
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result })
  } catch (err) {
    console.error("[product-search]", err)
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 })
  }
}

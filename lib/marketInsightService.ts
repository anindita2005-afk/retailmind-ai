export async function generateMarketInsights(input: any) {
  try {
    const prompt = `
You are a retail market intelligence engine.

Product: ${input.name}
Category: ${input.category}

Market Stats:
- Min Price: ₹${input.min}
- Max Price: ₹${input.max}
- Average Price: ₹${input.average}
- Median Price: ₹${input.median}
- Sellers Count: ${input.sellerCount}

IMPORTANT:
Return ONLY valid JSON.
Do NOT include markdown.
Do NOT include explanations.

Format:
{
  "key_business_insights": [string, string, string],
  "target_customers": [string, string, string],
  "risks": [string, string, string]
}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      console.error("Groq API error:", await response.text());
      return fallback();
    }

    const data = await response.json();

    const raw = data?.choices?.[0]?.message?.content || "";

    // 🔥 HARDENED CLEANING LOGIC
    let cleaned = raw.trim();

    // Remove markdown code fences if present
    cleaned = cleaned.replace(/```json/gi, "");
    cleaned = cleaned.replace(/```/g, "").trim();

    // Extract JSON if extra text exists before/after
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(cleaned);

      return {
        key_business_insights: Array.isArray(parsed.key_business_insights)
          ? parsed.key_business_insights
          : [],
        target_customers: Array.isArray(parsed.target_customers)
          ? parsed.target_customers
          : [],
        risks: Array.isArray(parsed.risks)
          ? parsed.risks
          : [],
      };
    } catch (parseError) {
      console.error("JSON parse failed. Cleaned output:", cleaned);
      return fallback();
    }

  } catch (err) {
    console.error("AI Insight Error:", err);
    return fallback();
  }
}

function fallback() {
  return {
    key_business_insights: [],
    target_customers: [],
    risks: [],
  };
}
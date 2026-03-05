import { NextResponse } from "next/server"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { getSession } from "@/lib/auth"

export async function POST(req: Request) {
  console.log("🔥 CHURN API HIT")

  try {
    // 🔐 Auth Check
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY missing" },
        { status: 500 }
      )
    }

    const data = await req.json()

    if (!data.tenure || !data.MonthlyCharges || !data.Contract) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 🚀 Call Groq
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
              content:
                "You are a telecom churn prediction engine. Return STRICT valid JSON only."
            },
            {
              role: "user",
              content: `
Return JSON:
{"churns":boolean,"confidence":number,"reason":string}

Customer:
Tenure: ${data.tenure}
Monthly Charges: ${data.MonthlyCharges}
Contract: ${data.Contract}
              `
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 150
        })
      }
    )

    const rawText = await response.text()
    console.log("🔥 GROQ RAW RESPONSE:", rawText)

    if (!response.ok) {
      return NextResponse.json(
        { error: "Groq failed", details: rawText },
        { status: 500 }
      )
    }

    const outer = JSON.parse(rawText)

    let modelText =
      outer?.choices?.[0]?.message?.content || ""

    if (!modelText) {
      return NextResponse.json(
        { error: "No model content returned" },
        { status: 500 }
      )
    }

    // 🧹 Clean markdown if present
    modelText = modelText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    let final

    try {
      final = JSON.parse(modelText)
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON", raw: modelText },
        { status: 500 }
      )
    }

    // 📊 Convert confidence to %
    if (typeof final.confidence === "number" && final.confidence <= 1) {
      final.confidence = Math.round(final.confidence * 100)
    }

    if (
      typeof final.churns !== "boolean" ||
      typeof final.confidence !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid model output format", raw: final },
        { status: 500 }
      )
    }

    // 💾 Store in DynamoDB
    const predictionId = crypto.randomUUID()

    await db.send(
      new PutCommand({
        TableName: `${TABLE_PREFIX}ChurnPredictions`,
        Item: {
          user_id: session.id,
          prediction_id: predictionId,
          churns: final.churns,
          confidence: final.confidence,
          reason: final.reason,
          input_data: data,
          created_at: new Date().toISOString()
        }
      })
    )

    // ✅ Return response
    return NextResponse.json({
      ...final,
      prediction_id: predictionId
    })

  } catch (err: any) {
    console.error("🔥 HARD FAILURE:", err)

    return NextResponse.json(
      { error: "Server crash", details: err?.message },
      { status: 500 }
    )
  }
}
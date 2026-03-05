import { NextResponse } from "next/server"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { db } from "@/lib/dynamodb"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
  try {

    const data = await req.json()

    const prompt = `
You are an advanced financial customer segmentation AI.

Analyze the following customer credit card usage data and classify the customer into one of the 4 clusters. 
Additionally, provide actionable insights, tailored strategies, and potential risks based on their specific financial behavior to maximize business value and customer benefit.

Return JSON ONLY matching this exact structure:

{
 "cluster": number,
 "insights": "Detailed 2-3 sentence analysis of the customer's behavior based on their metrics.",
 "strategies": ["Strategy 1", "Strategy 2", "Strategy 3"],
 "riskLevel": "Low | Medium | High",
 "riskDescription": "Explanation of their risk profile based on behavior."
}

Clusters:
0 = Low Activity: Low spending and minimal transactions.
1 = Cash Advance Heavy: Customers relying heavily on cash advances.
2 = Balanced Buyers: Active users with balanced purchases.
3 = High Spenders: Premium users with high purchase volumes.

Customer Data:
Balance: ${data.balance}
Balance Frequency: ${data.balance_frequency}
Purchases: ${data.purchases}
One-Off Purchases: ${data.oneoff_purchases}
Installments Purchases: ${data.installments_purchases}
Cash Advance: ${data.cash_advance}
Purchases Frequency: ${data.purchases_frequency}
One-Off Purchases Frequency: ${data.oneoff_purchases_frequency}
Purchases Installment Frequency: ${data.purchases_installment_frequency}
Cash Advance Frequency: ${data.cash_advance_frequency}
Cash Advance TRX: ${data.cash_advance_trx}
Purchases TRX: ${data.purchases_trx}
Credit Limit: ${data.credit_limit}
Payments: ${data.payments}
Minimum Payments: ${data.minimum_payments}
PRC Full Payment: ${data.prc_full_payment}
Tenure: ${data.tenure}
`

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
            { role: "system", content: "You are a data API. Return ONLY valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 800
        })
      }
    )

    const raw = await response.text()
    let parsed;
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      console.error("Failed to parse Groq raw response:", raw)
      throw new Error("Invalid raw response from Groq")
    }

    if (parsed.error) {
      console.error("Groq API error:", parsed.error)
      throw new Error(parsed.error.message || "Groq Error")
    }

    let text = parsed?.choices?.[0]?.message?.content || "{}"

    text = text.replace(/```json/i, "").replace(/```/g, "").trim()

    let final;
    try {
      final = JSON.parse(text)
    } catch (e) {
      console.error("Failed to parse content as JSON:", text)
      throw new Error("Invalid JSON content")
    }

    // 🔥 Save segmentation result in DynamoDB
    await db.send(
      new PutCommand({
        TableName: `${process.env.DYNAMODB_PREFIX}market_segments`,
        Item: {
          id: randomUUID(),

          balance: Number(data.balance || 0),
          balance_frequency: Number(data.balance_frequency || 0),
          purchases: Number(data.purchases || 0),
          oneoff_purchases: Number(data.oneoff_purchases || 0),
          installments_purchases: Number(data.installments_purchases || 0),
          cash_advance: Number(data.cash_advance || 0),
          purchases_frequency: Number(data.purchases_frequency || 0),
          oneoff_purchases_frequency: Number(data.oneoff_purchases_frequency || 0),
          purchases_installment_frequency: Number(data.purchases_installment_frequency || 0),
          cash_advance_frequency: Number(data.cash_advance_frequency || 0),
          cash_advance_trx: Number(data.cash_advance_trx || 0),
          purchases_trx: Number(data.purchases_trx || 0),
          credit_limit: Number(data.credit_limit || 0),
          payments: Number(data.payments || 0),
          minimum_payments: Number(data.minimum_payments || 0),
          prc_full_payment: Number(data.prc_full_payment || 0),
          tenure: Number(data.tenure || 0),

          cluster: final.cluster,
          insights: final.insights || "",
          strategies: final.strategies || [],
          riskLevel: final.riskLevel || "Low",
          riskDescription: final.riskDescription || "",

          createdAt: new Date().toISOString()
        }
      })
    )
    return NextResponse.json(final)

  } catch (err: any) {

    console.error("Segmentation error:", err)

    return NextResponse.json(
      { error: "Segmentation failed" },
      { status: 500 }
    )
  }
}
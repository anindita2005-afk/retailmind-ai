import { fetchProductPrices, fetchProductDetails, computeMedian } from "@/lib/productPriceService"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export const maxDuration = 60

import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

/** Call Groq REST API directly — no SDK dependency needed */
async function groqChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  })
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || "{}"
}


/* =========================
   GET — Fetch History
========================= */

export async function GET() {
  try {
    const session = await getSession()
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const res = await db.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}MarketAnalyses`,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": session.id }
      })
    )

    const analyses = (res.Items || [])
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, 20)

    return NextResponse.json({ analyses })
  } catch (err) {
    console.error("GET market-analysis error:", err)
    return NextResponse.json({ analyses: [] })
  }
}

/* =========================
   DELETE — Remove History
   ?id=xxx   → delete one item
   (no id)   → delete ALL items for user
========================= */

export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (id) {
      // Delete single item
      await db.send(
        new DeleteCommand({
          TableName: `${TABLE_PREFIX}MarketAnalyses`,
          Key: { user_id: session.id, id }
        })
      )
    } else {
      // Delete ALL items for this user
      const res = await db.send(
        new QueryCommand({
          TableName: `${TABLE_PREFIX}MarketAnalyses`,
          KeyConditionExpression: "user_id = :u",
          ExpressionAttributeValues: { ":u": session.id }
        })
      )
      const items = res.Items || []
      // Delete in parallel (batch)
      await Promise.all(
        items.map(item =>
          db.send(
            new DeleteCommand({
              TableName: `${TABLE_PREFIX}MarketAnalyses`,
              Key: { user_id: session.id, id: item.id }
            })
          )
        )
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/* =========================
   POST — Market Analysis
========================= */

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { query, category } = await req.json()

    if (!query)
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )

    /* =========================
       1. Fetch Cleaned SERP Prices
    ========================== */

    const marketProducts = await fetchProductPrices(query)

    if (!marketProducts.length) {
      return NextResponse.json({
        result: {
          product_overview: {
            name: query,
            description: "No reliable live pricing found",
            category: category || "General"
          },
          price_analysis: null,
          buy_links: [],
          platform_links: [],
          product_image_url: null
        }
      })
    }

    /* =========================
       2. Extract Price Data
    ========================== */

    const prices = marketProducts.map(p => p.price)

    const min = Math.min(...prices)
    const max = Math.max(...prices)

    const average = Math.round(
      prices.reduce((a, b) => a + b, 0) / prices.length
    )

    const median = computeMedian(prices)

    /* =========================
       3. Profit Calculations
    ========================== */

    const wholesale_price = Math.round(min * 0.7)
    const retail_price = median

    const markup_percent = wholesale_price
      ? Math.round(((retail_price - wholesale_price) / wholesale_price) * 100)
      : 0

    const gross_margin_percent = retail_price
      ? Math.round(((retail_price - wholesale_price) / retail_price) * 100)
      : 0

    const net_margin_percent = Math.max(gross_margin_percent - 8, 0)

    const breakeven_units_monthly = net_margin_percent
      ? Math.ceil(50000 / (retail_price * (net_margin_percent / 100)))
      : 0

    const estimated_monthly_profit_small =
      Math.round(breakeven_units_monthly * retail_price * (net_margin_percent / 100))

    const estimated_monthly_profit_medium =
      estimated_monthly_profit_small * 2

    const roi_percent = Math.round(net_margin_percent * 1.5)

    /* =========================
       4. Build Buy Links
    ========================== */

    const buy_links = marketProducts.map(p => {
      let hostname = ""
      try { hostname = new URL(p.link).hostname } catch { }

      return {
        store: p.platformName,
        url: p.link,
        directUrl: true,
        price: p.price,
        product_name: p.product_name,
        rating: p.rating,
        variant: null,
        category: p.platformCategory,
        isTrusted: p.isTrusted,
        favicon: hostname
          ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
          : ""
      }
    })

    /* =========================
       5. Groq AI — Business Insights
       Generate key_insights, target_customers, risks
       market_trends, local_market from the price context.
    ========================== */

    const priceContext = marketProducts
      .map(p => `${p.platformName}: ₹${p.price}`)
      .join(", ")

    let business_insights = {
      summary: "",
      key_insights: [] as string[],
      target_customers: [] as string[],
      usp_suggestions: [] as string[],
      risks: [] as string[],
      risk_level: "Medium"
    }
    let market_trends = null as any
    let local_market = null as any
    let business_strategy = null as any
    let want_to_start = null as any

    try {
      const systemPrompt = `You are a senior Indian retail market analyst. Return ONLY valid JSON. No explanation outside the JSON.`
      const userPrompt = `Analyse the Indian market for "${query}" (category: ${category || "General"}).
Live prices from authorized platforms: ${priceContext}
Median market price: ₹${median}

Return a JSON object with EXACTLY these keys:
{
  "business_insights": {
    "summary": "2-sentence market summary",
    "key_insights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
    "target_customers": ["customer segment 1", "segment 2", "segment 3", "segment 4"],
    "usp_suggestions": ["USP 1", "USP 2", "USP 3"],
    "risks": ["risk 1", "risk 2", "risk 3"],
    "risk_level": "Low or Medium or High"
  },
  "market_trends": {
    "trend": "Growing or Stable or Declining",
    "trend_percentage": 12,
    "yoy_growth": "+12% YoY",
    "peak_seasons": ["Diwali", "Summer"],
    "off_seasons": ["Monsoon"],
    "emerging_opportunities": ["opportunity 1", "opportunity 2"]
  },
  "local_market": {
    "demand_level": "High or Medium or Low",
    "demand_score": 75,
    "nearby_business_count": "50-100",
    "market_saturation": "Low or Medium or High",
    "best_selling_areas": ["area1", "area2", "area3"],
    "local_competitors": [
      { "name": "Amazon India", "type": "Online", "price_range": "₹40000-₹50000", "strength": "Wide reach" },
      { "name": "Croma", "type": "Offline", "price_range": "₹42000-₹52000", "strength": "Authorized retailer" }
    ]
  },
  "business_strategy": {
    "phase1": { "title": "Setup Phase", "steps": ["step 1", "step 2", "step 3"] },
    "phase2": { "title": "Growth Phase", "steps": ["step 1", "step 2", "step 3"] },
    "phase3": { "title": "Scale Phase", "steps": ["step 1", "step 2", "step 3"] },
    "online_strategy": ["strategy 1", "strategy 2", "strategy 3"],
    "offline_strategy": ["strategy 1", "strategy 2", "strategy 3"],
    "sourcing_tips": ["tip 1", "tip 2", "tip 3"],
    "legal_requirements": ["requirement 1", "requirement 2"],
    "recommended_platforms": ["Amazon", "Flipkart", "JioMart"]
  },
  "want_to_start": {
    "recommended": true,
    "reason": "1 sentence explanation on why to start",
    "startup_cost_min": 50000,
    "startup_cost_max": 200000,
    "time_to_profit_months": 3
  }
}`

      const rawJson = await groqChat(systemPrompt, userPrompt)
      const aiJson = JSON.parse(rawJson)
      if (aiJson.business_insights) business_insights = aiJson.business_insights
      if (aiJson.market_trends) market_trends = aiJson.market_trends
      if (aiJson.local_market) local_market = aiJson.local_market
      if (aiJson.business_strategy) business_strategy = aiJson.business_strategy
      if (aiJson.want_to_start) want_to_start = aiJson.want_to_start
    } catch (aiErr) {
      console.error("[Groq] Business insights generation failed:", aiErr)
      // Fall back to sensible defaults — don't crash the whole request
      business_insights = {
        summary: `${query} is actively traded in Indian e-commerce with prices ranging from ₹${min.toLocaleString("en-IN")} to ₹${max.toLocaleString("en-IN")}.`,
        key_insights: [
          `Market median price is ₹${median.toLocaleString("en-IN")}`,
          `Price spread of ₹${(max - min).toLocaleString("en-IN")} indicates varied seller segments`,
          `${marketProducts.length} authorized platforms are stocking this product`,
          `Gross margin opportunity of ~${gross_margin_percent}% for retailers`,
          `Breakeven estimated at ~${breakeven_units_monthly} units/month`
        ],
        target_customers: ["Urban consumers", "Online shoppers", "Value seekers", "Brand-conscious buyers"],
        usp_suggestions: ["Competitive pricing", "Fast delivery", "Warranty assurance", "Bundle offers"],
        risks: ["Price competition from large platforms", "Counterfeit products in market", "Seasonal demand fluctuations"],
        risk_level: gross_margin_percent < 15 ? "High" : gross_margin_percent < 25 ? "Medium" : "Low"
      }
      market_trends = {
        trend: "Stable",
        trend_percentage: 5,
        yoy_growth: "+5% YoY",
        peak_seasons: ["Festive Season"],
        off_seasons: ["Monsoon"],
        emerging_opportunities: ["Online bundles"]
      }
      local_market = {
        demand_level: "Medium",
        demand_score: 50,
        nearby_business_count: "Many",
        market_saturation: "Medium",
        best_selling_areas: ["Urban Centers"],
        local_competitors: []
      }
      business_strategy = {
        phase1: { title: "Setup Phase", steps: ["Market research", "Supplier shortlisting"] },
        phase2: { title: "Growth Phase", steps: ["Online platform listing", "Local marketing"] },
        phase3: { title: "Scale Phase", steps: ["Inventory expansion", "B2B partnerships"] },
        online_strategy: ["List on major marketplaces", "Social media marketing"],
        offline_strategy: ["Build local distributor network", "In-store promotions"],
        sourcing_tips: ["Source directly from authorized wholesalers to maximize margin"],
        legal_requirements: ["GST Registration", "Local Trade License"],
        recommended_platforms: ["Amazon", "Flipkart"]
      }
      want_to_start = {
        recommended: gross_margin_percent > 15,
        reason: `With a gross margin of ${gross_margin_percent}%, this product presents a ${gross_margin_percent > 15 ? 'viable' : 'challenging'} business opportunity.`,
        startup_cost_min: 50000,
        startup_cost_max: 200000,
        time_to_profit_months: 6
      }
    }

    /* =========================
       6. Final Response Object
    ========================== */

    const result = {
      product_overview: {
        name: query,
        description: business_insights.summary ||
          `Prices sourced from ${marketProducts.length} authorized platform${marketProducts.length !== 1 ? "s" : ""} (Amazon, Flipkart, official brand sites).`,
        category: category || "General"
      },

      product_image_url: marketProducts[0]?.image || null,

      price_analysis: {
        min,
        max,
        average,
        median,
        wholesale_price,
        retail_price,
        online_price: min,
        currency: "INR",
        real_time_data: true
      },

      profit_analysis: {
        gross_margin_percent,
        net_margin_percent,
        markup_percent,
        breakeven_units_monthly,
        estimated_monthly_profit_small,
        estimated_monthly_profit_medium,
        roi_percent
      },

      business_insights,
      ...(market_trends ? { market_trends } : {}),
      ...(local_market ? { local_market } : {}),
      ...(business_strategy ? { business_strategy } : {}),
      ...(want_to_start ? { want_to_start } : {}),

      buy_links,
      platform_links: buy_links
    }

    /* =========================
       7. Save to DB
    ========================== */

    await db.send(
      new PutCommand({
        TableName: `${TABLE_PREFIX}MarketAnalyses`,
        Item: {
          user_id: session.id,
          id: uuidv4(),
          query,
          category: category || null,
          result,
          created_at: new Date().toISOString()
        }
      })
    )

    return NextResponse.json({ result })

  } catch (error) {
    console.error("Market Analysis Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
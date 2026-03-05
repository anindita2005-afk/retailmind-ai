import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { runMarketAnalysis } from "@/lib/marketAnalysisEngine"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const res = await db.send(new QueryCommand({
    TableName: `${TABLE_PREFIX}Products`,
    KeyConditionExpression: "user_id = :u",
    ExpressionAttributeValues: {
      ":u": session.id
    }
  }));

  const products = res.Items?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, sku, category, description, unit, price, cost_price, gst_rate, stock_qty, image_url } = await req.json()
  if (!name || price == null)
    return NextResponse.json({ error: "Name and price are required." }, { status: 400 })

  const newProduct = {
    user_id: session.id,
    id: uuidv4(),
    name,
    sku: sku || null,
    category: category || null,
    description: description || null,
    unit: unit || "pcs",
    price: Number(price),
    cost_price: Number(cost_price) || 0,
    gst_rate: Number(gst_rate) || 18,
    stock_qty: Number(stock_qty) || 0,
    image_url: image_url || null,
    created_at: new Date().toISOString()
  };

  await db.send(new PutCommand({
    TableName: `${TABLE_PREFIX}Products`,
    Item: newProduct
  }));

  try {
  const result = await runMarketAnalysis(
    newProduct.name,
    newProduct.category
  )

  await db.send(
    new PutCommand({
      TableName: `${TABLE_PREFIX}MarketAnalyses`,
      Item: {
        user_id: session.id,
        id: uuidv4(),
        query: newProduct.name,
        category: newProduct.category || null,
        result,
        created_at: new Date().toISOString()
      }
    })
  )
} catch (err) {
  console.error("Auto market analysis failed:", err)
}

  return NextResponse.json({ product: newProduct }, { status: 201 })
}

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { products } = body as {
        products: Array<{
            name: string
            sku?: string
            category?: string
            description?: string
            unit?: string
            price: number
            cost_price?: number
            gst_rate?: number
            stock_qty?: number
        }>
    }

    if (!Array.isArray(products) || products.length === 0)
        return NextResponse.json({ error: "No products provided" }, { status: 400 })

    const results: Array<{ name: string; status: "inserted" | "skipped" | "error"; reason?: string }> = []

    // Get existing SKUs for this user to detect duplicates
    const existingRes = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}Products`,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: {
            ":u": session.id
        }
    }));
    const existingSkus = new Set((existingRes.Items || []).filter(r => r.sku).map((r: any) => r.sku?.toLowerCase()))

    for (const p of products) {
        try {
            if (!p.name?.trim() || p.price == null || isNaN(Number(p.price))) {
                results.push({ name: p.name || "(unnamed)", status: "skipped", reason: "Missing name or price" })
                continue
            }

            const skuNorm = p.sku?.trim()?.toLowerCase()
            if (skuNorm && existingSkus.has(skuNorm)) {
                results.push({ name: p.name, status: "skipped", reason: `SKU "${p.sku}" already exists` })
                continue
            }

            await db.send(new PutCommand({
                TableName: `${TABLE_PREFIX}Products`,
                Item: {
                    user_id: session.id,
                    id: uuidv4(),
                    name: p.name.trim(),
                    sku: p.sku?.trim() || null,
                    category: p.category?.trim() || null,
                    description: p.description?.trim() || null,
                    unit: p.unit?.trim() || "pcs",
                    price: Number(p.price),
                    cost_price: Number(p.cost_price) || 0,
                    gst_rate: Number(p.gst_rate) ?? 18,
                    stock_qty: Number(p.stock_qty) || 0,
                    created_at: new Date().toISOString()
                }
            }));

            if (skuNorm) existingSkus.add(skuNorm)
            results.push({ name: p.name, status: "inserted" })
        } catch (err: any) {
            results.push({ name: p.name || "(unnamed)", status: "error", reason: err?.message || "DB error" })
        }
    }

    const inserted = results.filter((r) => r.status === "inserted").length
    const skipped = results.filter((r) => r.status === "skipped").length
    const errors = results.filter((r) => r.status === "error").length

    return NextResponse.json({ results, summary: { inserted, skipped, errors } }, { status: 200 })
}

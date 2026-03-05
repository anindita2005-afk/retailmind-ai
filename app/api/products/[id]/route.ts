import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, sku, category, description, unit, price, cost_price, gst_rate, stock_qty, image_url } = await req.json()

  try {
    const res = await db.send(new UpdateCommand({
      TableName: `${TABLE_PREFIX}Products`,
      Key: { user_id: session.id, id },
      UpdateExpression: "SET #name = :name, sku = :sku, category = :category, description = :description, #unit = :unit, price = :price, cost_price = :cost_price, gst_rate = :gst_rate, stock_qty = :stock_qty, image_url = :image_url, updated_at = :updated_at",
      ExpressionAttributeNames: {
        "#name": "name",
        "#unit": "unit"
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":sku": sku || null,
        ":category": category || null,
        ":description": description || null,
        ":unit": unit || "pcs",
        ":price": Number(price),
        ":cost_price": Number(cost_price) || 0,
        ":gst_rate": Number(gst_rate) || 18,
        ":stock_qty": Number(stock_qty) || 0,
        ":image_url": image_url || null,
        ":updated_at": new Date().toISOString()
      },
      ReturnValues: "ALL_NEW"
    }));

    return NextResponse.json({ product: res.Attributes })
  } catch (error: any) {
    console.error("DYNAMODB PUT ERROR:", error);
    if (error.name === "ConditionalCheckFailedException" || (error.message && error.message.includes("does not exist"))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.send(new DeleteCommand({
    TableName: `${TABLE_PREFIX}Products`,
    Key: { user_id: session.id, id }
  }));

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const billRes = await db.send(new GetCommand({
    TableName: `${TABLE_PREFIX}Bills`,
    Key: { user_id: session.id, id }
  }));

  if (!billRes.Item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const itemsRes = await db.send(new QueryCommand({
    TableName: `${TABLE_PREFIX}BillItems`,
    KeyConditionExpression: "bill_id = :b",
    ExpressionAttributeValues: { ":b": id }
  }));

  const profileRes = await db.send(new GetCommand({
    TableName: `${TABLE_PREFIX}BusinessProfiles`,
    Key: { user_id: session.id }
  }));

  const profile = profileRes.Item ? { ...profileRes.Item, email: session.email } : null

  return NextResponse.json({ bill: billRes.Item, items: itemsRes.Items || [], profile })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()
  if (!["draft", "paid", "cancelled"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  try {
    await db.send(new UpdateCommand({
      TableName: `${TABLE_PREFIX}Bills`,
      Key: { user_id: session.id, id },
      UpdateExpression: "SET #st = :s",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":s": status }
    }));
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update bill status" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.send(new DeleteCommand({
    TableName: `${TABLE_PREFIX}Bills`,
    Key: { user_id: session.id, id }
  }));
  return NextResponse.json({ success: true })
}

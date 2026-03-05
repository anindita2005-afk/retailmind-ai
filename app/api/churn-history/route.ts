import { NextResponse } from "next/server"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await db.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}ChurnPredictions`,
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: {
          ":u": session.id
        }
      })
    )

    const items = result.Items || []

    // Sort newest first (by created_at)
    items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )

    return NextResponse.json({
      total: items.length,
      predictions: items
    })

  } catch (err: any) {
    console.error("Churn history error:", err)

    return NextResponse.json(
      { error: "Failed to load churn history" },
      { status: 500 }
    )
  }
}
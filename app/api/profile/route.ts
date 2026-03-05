import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const res = await db.send(new GetCommand({
    TableName: `${TABLE_PREFIX}BusinessProfiles`,
    Key: { user_id: session.id }
  }));
  const profile = res.Item ? { ...res.Item, email: session.email } : null
  return NextResponse.json({ profile })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await req.json()

  let updateExpression = "SET #updated_at = :updated_at";
  const expressionAttributeNames: Record<string, string> = { "#updated_at": "updated_at" };
  const expressionAttributeValues: Record<string, any> = { ":updated_at": new Date().toISOString() };

  const fields = [
    "business_name", "gst_number", "business_reg_no", "pan_number",
    "phone", "address", "city", "state", "pincode", "logo_url"
  ];

  fields.forEach(field => {
    if (data[field] !== undefined) {
      updateExpression += `, #${field} = :${field}`;
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = field.includes('number') && data[field] ? data[field].toUpperCase() : data[field];
    }
  });

  const res = await db.send(new UpdateCommand({
    TableName: `${TABLE_PREFIX}BusinessProfiles`,
    Key: { user_id: session.id },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW"
  }));

  return NextResponse.json({ profile: res.Attributes })
}

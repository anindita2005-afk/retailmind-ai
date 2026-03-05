import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { QueryCommand, PutCommand, UpdateCommand  } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const billsRes = await db.send(new QueryCommand({
    TableName: `${TABLE_PREFIX}Bills`,
    KeyConditionExpression: "user_id = :u",
    ExpressionAttributeValues: { ":u": session.id }
  }));
  const billsData = billsRes.Items || [];

  const bills = await Promise.all(billsData.map(async (b) => {
    const itemsRes = await db.send(new QueryCommand({
      TableName: `${TABLE_PREFIX}BillItems`,
      KeyConditionExpression: "bill_id = :b",
      ExpressionAttributeValues: { ":b": b.id }
    }));
    return { ...b, bill_items: itemsRes.Items || [] };
  }));

  bills.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ bills })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { customer_name, customer_email, customer_phone, customer_address, customer_gst, notes, bill_date, items } =
      await req.json()

    if (!customer_name || !items?.length)
      return NextResponse.json({ error: "Customer name and at least one item required" }, { status: 400 })

    let subtotal = 0
    let gst_amount = 0
    const processedItems = items.map((item: { qty: number; price: number; gst_rate?: number; product_id?: string; name: string; unit?: string }) => {
      const lineTotal = item.qty * item.price
      const lineGst = (lineTotal * (item.gst_rate ?? 18)) / 100
      subtotal += lineTotal
      gst_amount += lineGst
      return { ...item, gst_amount: lineGst, amount: lineTotal + lineGst }
    })
    const total = subtotal + gst_amount

    const billId = uuidv4();
    const billDate = bill_date || new Date().toISOString().split("T")[0];

    const newBill = {
      user_id: session.id,
      id: billId,
      customer_name,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      customer_address: customer_address || null,
      customer_gst: customer_gst || null,
      subtotal,
      gst_amount,
      total,
      notes: notes || null,
      bill_date: billDate,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    await db.send(new PutCommand({
      TableName: `${TABLE_PREFIX}Bills`,
      Item: newBill
    }));

    for (const item of processedItems) {
      await db.send(new PutCommand({
        TableName: `${TABLE_PREFIX}BillItems`,
        Item: {
          bill_id: billId,
          id: uuidv4(),
          product_id: item.product_id || null,
          name: item.name,
          unit: item.unit || "pcs",
          qty: item.qty,
          price: item.price,
          gst_rate: item.gst_rate ?? 18,
          gst_amount: item.gst_amount,
          amount: item.amount,
          product_name: item.name,
          quantity: Math.ceil(item.qty),
          unit_price: item.price,
          created_at: new Date().toISOString()
        }
      }));


      // 🔽 Decrease product stock
      if (item.product_id) {
        await db.send(new UpdateCommand({
          TableName: `${TABLE_PREFIX}Products`,
          Key: {
            user_id: session.id,
            id: item.product_id
          },
          UpdateExpression: "SET stock_qty = stock_qty - :qty",
          ExpressionAttributeValues: {
            ":qty": Number(item.qty)
          }
        }))
      }

    }

    return NextResponse.json({ bill: newBill }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/bills]", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


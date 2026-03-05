import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, TABLE_PREFIX } from "@/lib/dynamodb";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const res = await db.send(new QueryCommand({
            TableName: `${TABLE_PREFIX}StoreOrders`,
            KeyConditionExpression: "user_id = :u",
            ExpressionAttributeValues: { ":u": session.id }
        }));

        const orders = (res.Items || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({ orders });
    } catch (error: any) {
        console.error("Fetch Orders Error:", error);
        return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { customer_name, phone, email, address, items, notes } = await req.json();

        if (!customer_name?.trim()) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
        if (!items?.length) return NextResponse.json({ error: "At least one item is required" }, { status: 400 });

        const total_amount = items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);

        const order = {
            user_id: session.id,
            id: uuidv4(),
            customer_name: customer_name.trim(),
            phone: phone?.trim() || "",
            email: email?.trim() || "",
            address: address?.trim() || "",
            notes: notes?.trim() || "",
            items: items.map((i: any) => ({
                id: i.id || null,
                name: i.name,
                quantity: Number(i.quantity),
                price: Number(i.price),
                unit: i.unit || "pcs",
            })),
            total_amount,
            status: "pending" as const,
            source: "manual",           // distinguish from online store orders
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await db.send(new PutCommand({ TableName: `${TABLE_PREFIX}StoreOrders`, Item: order }));

        return NextResponse.json({ order }, { status: 201 });
    } catch (err: any) {
        console.error("[POST /api/orders]", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

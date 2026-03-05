import { NextRequest, NextResponse } from "next/server";
import { db, TABLE_PREFIX } from "@/lib/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;
        const body = await req.json();

        const { customerName, phone, email, address, cart, totalAmount } = body;

        if (!customerName || !phone || !email || !cart || cart.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const orderId = uuidv4();

        const newOrder = {
            user_id: userId,
            id: orderId,
            customer_name: customerName,
            phone,
            email,
            address,
            items: cart,
            total_amount: totalAmount,
            status: "pending", // pending, confirmed, fulfilled, cancelled
            created_at: new Date().toISOString()
        };

        await db.send(new PutCommand({
            TableName: `${TABLE_PREFIX}StoreOrders`,
            Item: newOrder
        }));

        return NextResponse.json({ success: true, orderId });
    } catch (error: any) {
        console.error("Place Order Error:", error);
        return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }
}

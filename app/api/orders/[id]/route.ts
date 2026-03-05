import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, TABLE_PREFIX } from "@/lib/dynamodb";
import { UpdateCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();

    if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

    try {
        const res = await db.send(new UpdateCommand({
            TableName: `${TABLE_PREFIX}StoreOrders`,
            Key: { user_id: session.id, id },
            UpdateExpression: "SET #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":status": status,
                ":updated_at": new Date().toISOString()
            },
            ReturnValues: "ALL_NEW"
        }));

        const order = res.Attributes;

        // Auto-Generate Bill unconditionally when an order is first confirmed
        if (order && status === "confirmed") {
            try {
                const billId = uuidv4();
                const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

                const newBill = {
                    user_id: session.id,
                    id: billId,
                    customer_name: order.customer_name,
                    customer_email: order.email || null,
                    customer_phone: order.phone || null,
                    customer_address: order.address || null,
                    customer_gst: null,
                    subtotal: subtotal,
                    gst_amount: 0,
                    total: subtotal,
                    notes: `Auto-generated from online order #${order.id.slice(0, 8)}`,
                    bill_date: new Date().toISOString().split("T")[0],
                    status: 'draft', // Wait for payment confirmation
                    created_at: new Date().toISOString()
                };

                await db.send(new PutCommand({
                    TableName: `${TABLE_PREFIX}Bills`,
                    Item: newBill
                }));

                for (const item of order.items) {
                    await db.send(new PutCommand({
                        TableName: `${TABLE_PREFIX}BillItems`,
                        Item: {
                            bill_id: billId,
                            id: uuidv4(),
                            product_id: item.id || null,
                            name: item.name,
                            unit: item.unit || "pcs",
                            qty: item.quantity,
                            price: item.price,
                            gst_rate: 0,
                            gst_amount: 0,
                            amount: item.price * item.quantity,
                            product_name: item.name,
                            quantity: item.quantity,
                            unit_price: item.price,
                            created_at: new Date().toISOString()
                        }
                    }));

                    // Deduct stock
                    if (item.id) {
                        try {
                            await db.send(new UpdateCommand({
                                TableName: `${TABLE_PREFIX}Products`,
                                Key: { user_id: session.id, id: item.id },
                                UpdateExpression: "SET stock_qty = stock_qty - :qty",
                                ExpressionAttributeValues: { ":qty": Number(item.quantity) }
                            }));
                        } catch (e) {
                            console.error("Failed to update stock for item", item.id, e);
                        }
                    }
                }
                console.log(`Auto-generated bill ${billId} for order ${order.id}`);
            } catch (billErr) {
                console.error("Failed to auto-generate bill:", billErr);
            }
        }

        // Send email update to customer if their email is available
        if (order && order.email && (status === "confirmed" || status === "fulfilled")) {
            const profileRes = await db.send(new QueryCommand({
                TableName: `${TABLE_PREFIX}BusinessProfiles`,
                KeyConditionExpression: "user_id = :u",
                ExpressionAttributeValues: { ":u": session.id }
            }));
            const profile = profileRes.Items?.[0] || { business_name: "Local Store", phone: "" };

            let subject = "";
            let message = "";

            if (status === "confirmed") {
                subject = `Your order #${order.id.slice(0, 8)} has been confirmed!`;
                message = `Hello ${order.customer_name},\n\nGreat news! Your order from ${profile.business_name} has been confirmed.\nWe are currently preparing your items.`;
            } else if (status === "fulfilled") {
                subject = `Your order #${order.id.slice(0, 8)} is fulfilled!`;
                message = `Hello ${order.customer_name},\n\nYour order from ${profile.business_name} has been fulfilled and is ready / on its way.`;
            }

            if (subject && message) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                    });

                    await transporter.sendMail({
                        from: `"${profile.business_name} (via RetailMind AI)" <${process.env.EMAIL_USER}>`,
                        to: order.email,
                        subject,
                        text: `${message}\n\nOrder Total: ₹${order.total_amount}\n\nThank you for shopping securely with us!\nContact: ${profile.phone || "N/A"}`
                    });
                    console.log(`Order ${status} email sent to ${order.email}`);
                } catch (emailErr) {
                    console.error("Failed to send order email:", emailErr);
                }
            }
        }

        return NextResponse.json({ order });
    } catch (error: any) {
        console.error("Order Update Error:", error);
        if (error.name === "ConditionalCheckFailedException" || (error.message && error.message.includes("does not exist"))) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}

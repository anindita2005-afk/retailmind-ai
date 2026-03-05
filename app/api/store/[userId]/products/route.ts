import { NextRequest, NextResponse } from "next/server";
import { db, TABLE_PREFIX } from "@/lib/dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;

        const res = await db.send(new QueryCommand({
            TableName: `${TABLE_PREFIX}Products`,
            KeyConditionExpression: "user_id = :u",
            ExpressionAttributeValues: {
                ":u": userId
            }
        }));

        const products = (res.Items || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Also fetch store info, e.g., BusinessProfile, to show store name
        const profileRes = await db.send(new QueryCommand({
            TableName: `${TABLE_PREFIX}BusinessProfiles`,
            KeyConditionExpression: "user_id = :u",
            ExpressionAttributeValues: { ":u": userId }
        }));

        const profile = profileRes.Items?.[0] || { business_name: "Local Store", business_category: "Retail" };

        return NextResponse.json({ profile, products });
    } catch (error: any) {
        console.error("Fetch Store Products Error:", error);
        return NextResponse.json({ error: "Failed to load store products" }, { status: 500 });
    }
}

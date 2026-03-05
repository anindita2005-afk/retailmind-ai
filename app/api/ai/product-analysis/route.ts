import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchProductPrices } from "@/lib/productPriceService";
import { analyzeProductPricesWithBedrock } from "@/lib/bedrock";
import { db, TABLE_PREFIX } from "@/lib/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Simple in-memory rate limiting map depending on how Node.js instances are scaled
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // max requests per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 9. Rate limiting
        const now = Date.now();
        const rateKey = session.id;
        const rateData = requestCounts.get(rateKey) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

        if (now > rateData.resetTime) {
            rateData.count = 1;
            rateData.resetTime = now + RATE_LIMIT_WINDOW_MS;
        } else {
            rateData.count += 1;
        }
        requestCounts.set(rateKey, rateData);

        if (rateData.count > RATE_LIMIT) {
            return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
        }

        const { product_name } = await req.json();

        if (!product_name || typeof product_name !== "string" || product_name.trim() === "") {
            return NextResponse.json({ error: "Product name is required" }, { status: 400 });
        }

        // 1 & 2. Fetch prices using reliable API (SerpAPI via service)
        const marketPrices = await fetchProductPrices(product_name);

        if (marketPrices.length === 0) {
            return NextResponse.json({
                error: "No market data found for this product",
            }, { status: 404 });
        }

        // 4 & 5. Aggregate prices and send to Amazon Bedrock
        const analysis = await analyzeProductPricesWithBedrock(product_name, marketPrices);

        const recordId = uuidv4();

        // 8. Store results in DynamoDB ProductMarketAnalysis Table
        const structuredRecord = {
            user_id: session.id, // Partition Key
            id: recordId, // Sort Key
            product_name,
            market_prices: marketPrices, // Contains product_name, platform, price, rating, link, seller
            analysis_insights: analysis,
            created_at: new Date().toISOString()
        };

        await db.send(new PutCommand({
            TableName: `${TABLE_PREFIX}ProductMarketAnalysis`,
            Item: structuredRecord
        }));

        return NextResponse.json({
            success: true,
            data: structuredRecord
        }, { status: 201 });

    } catch (error: any) {
        console.error("AI Product Analysis API Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to analyze product. Please try again."
        }, { status: 500 });
    }
}

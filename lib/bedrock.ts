import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

export interface AIAnalysisResult {
    best_price_recommendation: string;
    competitive_price_comparison: string;
    average_market_price: number;
    margin_opportunity_insights: string;
    pricing_trend_summary: string;
}

const bedrockClient = new BedrockRuntimeClient({
    region: process.env.MY_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || "",
    }
});

export async function analyzeProductPricesWithBedrock(productName: string, marketPrices: any[]): Promise<AIAnalysisResult> {
    const prompt = `Analyze the following real-time market prices for the product: "${productName}".
Market Data (Aggregated from Google Shopping via SerpAPI):
${JSON.stringify(marketPrices, null, 2)}

Provide a detailed JSON response containing exactly these keys:
{
  "best_price_recommendation": "<string: Your strategic recommendation for setting the price to be competitive yet profitable>",
  "competitive_price_comparison": "<string: Summary of how the major competitors listed are pricing this item>",
  "average_market_price": <number: The calculated average price across listings that are not outliers>,
  "margin_opportunity_insights": "<string: Explain potential margin opportunities based on this data>",
  "pricing_trend_summary": "<string: A summary of the general pricing trend across platforms>"
}

Output STRICTLY valid JSON without any markdown formatting or code blocks attached. Do NOT include \`\`\`json.`;

    const command = new ConverseCommand({
        // User requested prompt router ARN / identifier
        modelId: "prompt-router/retailmindai",
        messages: [
            {
                role: "user",
                // Format required by Converse API
                content: [{ text: prompt }]
            }
        ]
    });

    try {
        const response = await bedrockClient.send(command);

        // Extract text from standard ConverseCommand API output
        let textResponse = "";
        if (response.output?.message?.content && response.output.message.content.length > 0) {
            textResponse = response.output.message.content[0].text || "";
        }

        if (!textResponse) {
            throw new Error("Received empty response from Amazon Bedrock");
        }

        // Clean up response if the AI appends markdown blocks
        textResponse = textResponse.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

        const analysisResult: AIAnalysisResult = JSON.parse(textResponse);
        return analysisResult;
    } catch (error) {
        console.error("Bedrock Analysis Error:", error);
        throw new Error("Failed to generate market analysis from Amazon Bedrock");
    }
}

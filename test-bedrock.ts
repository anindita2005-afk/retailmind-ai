import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new BedrockRuntimeClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  }
});

async function run() {
  try {
    const modelId = "arn:aws:bedrock:ap-south-1:579707562405:default-prompt-router/retailmindai";
    await client.send(new ConverseCommand({
      modelId,
      messages: [{ role: "user", content: [{ text: "Hello" }] }]
    }));
    console.log("Success AP-SOUTH-1");
  } catch(e: any) {
    console.error("AP-SOUTH-1:", e.name, e.message);
  }
}
run();

import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function testModel(modelId) {
  try {
    await client.send(new ConverseCommand({
      modelId,
      messages: [{ role: "user", content: [{ text: "Hello" }] }]
    }));
    console.log(`Success with ${modelId}`);
    return true;
  } catch (e) {
    console.error(`Failed ${modelId}:`, e.name, e.message);
    return false;
  }
}

async function run() {
  await testModel("anthropic.claude-3-haiku-20240307-v1:0");
  await testModel("us.anthropic.claude-3-haiku-20240307-v1:0");
  await testModel("amazon.nova-micro-v1:0");
  await testModel("amazon.titan-text-lite-v1");
}
run();

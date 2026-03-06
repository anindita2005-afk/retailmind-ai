import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.MY_AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || "",
    }
});

export const db = DynamoDBDocumentClient.from(client);

export const TABLE_PREFIX = process.env.DYNAMODB_PREFIX || "RetailIQ_";

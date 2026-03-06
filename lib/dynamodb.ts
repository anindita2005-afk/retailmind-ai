import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const config: any = {
    region: process.env.MY_AWS_REGION || "us-east-1",
};

if (process.env.MY_AWS_ACCESS_KEY_ID && process.env.MY_AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    };
}

const client = new DynamoDBClient(config);

export const db = DynamoDBDocumentClient.from(client);

export const TABLE_PREFIX = process.env.DYNAMODB_PREFIX || "RetailIQ_";

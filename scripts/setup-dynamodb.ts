import { DynamoDBClient, CreateTableCommand, BillingMode } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});

const prefix = process.env.DYNAMODB_PREFIX || "RetailIQ_";

const tables = [
    {
        TableName: `${prefix}Users`,
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "email", AttributeType: "S" }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "EmailIndex",
                KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
                Projection: { ProjectionType: "ALL" }
            }
        ]
    },
    {
        TableName: `${prefix}BusinessProfiles`,
        KeySchema: [{ AttributeName: "user_id", KeyType: "HASH" }],
        AttributeDefinitions: [
            { AttributeName: "user_id", AttributeType: "S" }
        ]
    },
    {
        TableName: `${prefix}Products`,
        KeySchema: [
            { AttributeName: "user_id", KeyType: "HASH" },
            { AttributeName: "id", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "user_id", AttributeType: "S" },
            { AttributeName: "id", AttributeType: "S" }
        ]
    },
    {
        TableName: `${prefix}Bills`,
        KeySchema: [
            { AttributeName: "user_id", KeyType: "HASH" },
            { AttributeName: "id", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "user_id", AttributeType: "S" },
            { AttributeName: "id", AttributeType: "S" }
        ]
    },
    {
        TableName: `${prefix}BillItems`,
        KeySchema: [
            { AttributeName: "bill_id", KeyType: "HASH" },
            { AttributeName: "id", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "bill_id", AttributeType: "S" },
            { AttributeName: "id", AttributeType: "S" }
        ]
    },
    {
        TableName: `${prefix}MarketAnalyses`,
        KeySchema: [
            { AttributeName: "user_id", KeyType: "HASH" },
            { AttributeName: "id", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "user_id", AttributeType: "S" },
            { AttributeName: "id", AttributeType: "S" }
        ]
    },
    {
        TableName: `${prefix}ProductMarketAnalysis`,
        KeySchema: [
            { AttributeName: "user_id", KeyType: "HASH" },
            { AttributeName: "id", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "user_id", AttributeType: "S" },
            { AttributeName: "id", AttributeType: "S" }
        ]
    },
    {
        TableName: `${prefix}StoreOrders`,
        KeySchema: [
            { AttributeName: "user_id", KeyType: "HASH" },
            { AttributeName: "id", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "user_id", AttributeType: "S" },
            { AttributeName: "id", AttributeType: "S" }
        ]
    }
];

async function run() {
    for (const table of tables) {
        try {
            console.log(`Creating table ${table.TableName}...`);
            await client.send(
                new CreateTableCommand({
                    ...table,
                    BillingMode: BillingMode.PAY_PER_REQUEST,
                } as any)
            );
            console.log(`Table ${table.TableName} created.`);
        } catch (e: any) {
            if (e.name === "ResourceInUseException") {
                console.log(`Table ${table.TableName} already exists.`);
            } else {
                console.error(`Error creating table ${table.TableName}:`, e);
            }
        }
    }
}

run();

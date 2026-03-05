import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
async function run() {
  try {
    const res = await client.send(new UpdateCommand({
      TableName: "RetailIQ_BusinessProfiles",
      Key: { user_id: "test-user-id" },
      UpdateExpression: "SET #l = :l",
      ExpressionAttributeNames: { "#l": "logo_url" },
      ExpressionAttributeValues: { ":l": null }
    }));
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();

import { db, TABLE_PREFIX } from "./lib/dynamodb.ts";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

async function test() {
  const userId = "test-uuid-123";
  try {
    await db.send(new PutCommand({
      TableName: `${TABLE_PREFIX}Users`,
      Item: {
        id: userId,
        email: "test_register@example.com",
        password_hash: "hash",
        display_id: "RIQ-2026-9999"
      }
    }));
    console.log("Users put success");
    await db.send(new PutCommand({
      TableName: `${TABLE_PREFIX}BusinessProfiles`,
      Item: {
        user_id: userId,
        business_name: "Test Business",
        gst_number: "GST123",
        business_reg_no: "REG123",
        pan_number: "PAN123"
      }
    }));
    console.log("BusinessProfiles put success");
  } catch (e) {
    console.error(e);
  }
}

test();

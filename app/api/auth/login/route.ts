import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { createSession } from "@/lib/auth"
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { generateOTP, sendOTPEmail, signOTPToken, verifyOTPToken } from "@/lib/otp"

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const step = searchParams.get("step") || "verify"

    if (step === "verify") {
      const { email, password } = await req.json()
      if (!email || !password)
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 })

      const emailFormatted = email.toLowerCase().trim();

      const userQuery = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}Users`,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :e",
        ExpressionAttributeValues: { ":e": emailFormatted }
      }));

      if (!userQuery.Items || userQuery.Items.length === 0) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
      }

      const user = userQuery.Items[0];
      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })

      // Generate and send OTP
      const otp = generateOTP();
      await sendOTPEmail(emailFormatted, otp);

      const otpToken = await signOTPToken(emailFormatted, otp);

      return NextResponse.json({ success: true, otpToken, message: "OTP sent to your email" })
    }
    else if (step === "confirm") {
      const { email, otp, otpToken } = await req.json()
      if (!email || !otp || !otpToken)
        return NextResponse.json({ error: "Missing OTP fields." }, { status: 400 })

      const verifiedEmail = await verifyOTPToken(otpToken, otp);
      if (!verifiedEmail || verifiedEmail !== email.toLowerCase().trim()) {
        return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 })
      }

      // Log them in since OTP is valid
      const userQuery = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}Users`,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :e",
        ExpressionAttributeValues: { ":e": verifiedEmail }
      }));

      if (!userQuery.Items || userQuery.Items.length === 0) {
        return NextResponse.json({ error: "User not found." }, { status: 404 })
      }

      const user = userQuery.Items[0];

      const profileQuery = await db.send(new GetCommand({
        TableName: `${TABLE_PREFIX}BusinessProfiles`,
        Key: { user_id: user.id }
      }));

      const business_name = profileQuery.Item?.business_name || "Business";

      await createSession({
        id: user.id,
        email: user.email,
        display_id: user.display_id || "RIQ-0000",
        business_name: business_name,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid Auth Step" }, { status: 400 });

  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

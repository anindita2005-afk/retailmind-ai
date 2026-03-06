import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { createSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { generateOTP, sendOTPEmail, signOTPToken, verifyOTPToken } from "@/lib/otp"

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const step = searchParams.get("step") || "verify"

    if (step === "verify") {
      const { email, password, business_name, gst_number, business_reg_number, pan_number } = await req.json()

      if (!email || !password || !business_name || !gst_number || !business_reg_number)
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

      if (password.length < 8)
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })

      const emailFormatted = email.toLowerCase().trim();

      // Check existing email
      const existing = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}Users`,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :e",
        ExpressionAttributeValues: { ":e": emailFormatted }
      }));

      if (existing.Items && existing.Items.length > 0)
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })

      // Generate and send OTP
      const otp = generateOTP();
      await sendOTPEmail(emailFormatted, otp);
      const otpToken = await signOTPToken(emailFormatted, otp);

      return NextResponse.json({ success: true, otpToken, message: "OTP sent to your email" })
    }
    else if (step === "confirm") {
      const { email, password, business_name, gst_number, business_reg_number, pan_number, otp, otpToken } = await req.json()

      if (!email || !otp || !otpToken)
        return NextResponse.json({ error: "Missing OTP fields." }, { status: 400 })

      const verifiedEmail = await verifyOTPToken(otpToken, otp);
      if (!verifiedEmail || verifiedEmail !== email.toLowerCase().trim()) {
        return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 })
      }

      const emailFormatted = email.toLowerCase().trim();

      const existing = await db.send(new QueryCommand({
        TableName: `${TABLE_PREFIX}Users`,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :e",
        ExpressionAttributeValues: { ":e": emailFormatted }
      }));

      if (existing.Items && existing.Items.length > 0)
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })

      const passwordHash = await bcrypt.hash(password, 12)
      const year = new Date().getFullYear()
      const seq = Math.floor(1000 + Math.random() * 9000)
      const display_id = `RIQ-${year}-${seq}`

      const userId = uuidv4();

      await db.send(new PutCommand({
        TableName: `${TABLE_PREFIX}Users`,
        Item: {
          id: userId,
          email: emailFormatted,
          password_hash: passwordHash,
          display_id: display_id
        }
      }));

      await db.send(new PutCommand({
        TableName: `${TABLE_PREFIX}BusinessProfiles`,
        Item: {
          user_id: userId,
          business_name: business_name.trim(),
          gst_number: gst_number.toUpperCase().trim(),
          business_reg_no: business_reg_number.trim(),
          pan_number: pan_number ? pan_number.toUpperCase().trim() : null
        }
      }));

      const token = await createSession({
        id: userId,
        email: emailFormatted,
        display_id: display_id,
        business_name: business_name.trim(),
      })

      return NextResponse.json({ success: true, display_id, token }, { status: 201 })
    }

    return NextResponse.json({ error: "Invalid Auth Step" }, { status: 400 });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error"
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("ConditionalCheckFailedException"))
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getSession, deleteSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { generateOTP, sendOTPEmail, signOTPToken, verifyOTPToken } from "@/lib/otp"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const step = searchParams.get("step") || "request"

    if (step === "request") {
      const otp = generateOTP();
      await sendOTPEmail(session.email, otp);
      const otpToken = await signOTPToken(session.email, otp);

      return NextResponse.json({ success: true, otpToken, message: "OTP sent to your email" })
    }
    else if (step === "verify") {
      const { otp, otpToken } = await req.json()
      if (!otp || !otpToken)
        return NextResponse.json({ error: "Missing OTP or Token." }, { status: 400 })

      const verifiedEmail = await verifyOTPToken(otpToken, otp);
      if (!verifiedEmail || verifiedEmail !== session.email) {
        return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 })
      }

      // Delete the user and profile
      await db.send(new DeleteCommand({
        TableName: `${TABLE_PREFIX}BusinessProfiles`,
        Key: { user_id: session.id }
      }));
      
      await db.send(new DeleteCommand({
        TableName: `${TABLE_PREFIX}Users`,
        Key: { id: session.id }
      }));

      // Delete session cookie
      await deleteSession();

      return NextResponse.json({ success: true, message: "Account deleted successfully." })
    }

    return NextResponse.json({ error: "Invalid Action Step" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

const bcrypt = require("bcryptjs")
const nodemailer = require("nodemailer")

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "retailiq-super-secret-key-change-in-production"
)

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb")

// -----------------------------
// DynamoDB Setup
// -----------------------------
const client = new DynamoDBClient({
  region: process.env.MY_AWS_REGION
})

const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
})

const USERS_TABLE = `${process.env.DYNAMODB_PREFIX}Users`
const OTP_TABLE = `${process.env.DYNAMODB_PREFIX}OTPs`

// -----------------------------
// OTP Generator
// -----------------------------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// -----------------------------
// Email Setup
// -----------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// -----------------------------
// Lambda Handler
// -----------------------------
exports.handler = async (event) => {

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  }

  try {

    const method =
      event.requestContext?.http?.method ||
      event.httpMethod ||
      "GET"

    const path =
      event.rawPath ||
      event.path ||
      "/"

    const query = event.queryStringParameters || {}

    // safer body parsing
    let body = {}
    if (event.body) {
      try {
        body = typeof event.body === "string"
          ? JSON.parse(event.body)
          : event.body
      } catch {
        body = {}
      }
    }

    console.log("REQUEST BODY:", body)

    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" }
    }

    // -----------------------------
    // LOGIN ROUTE
    // -----------------------------
    if (path.endsWith("/api/auth/login") && method === "POST") {

      const step = query.step || "verify"

      // =============================
      // STEP 1 : VERIFY PASSWORD
      // =============================
      if (step === "verify") {

        const { email, password } = body

        if (!email || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "Email and password are required."
            })
          }
        }

        const emailFormatted = String(email).toLowerCase().trim()

        console.log("LOGIN ATTEMPT:", emailFormatted)

        const userQuery = await db.send(new QueryCommand({
          TableName: USERS_TABLE,
          IndexName: "EmailIndex",
          KeyConditionExpression: "email = :e",
          ExpressionAttributeValues: {
            ":e": emailFormatted
          }
        }))

        if (!userQuery.Items || userQuery.Items.length === 0) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              error: "Invalid email or password."
            })
          }
        }

        const user = userQuery.Items[0]

        const valid = await bcrypt.compare(password, user.password_hash)

        if (!valid) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              error: "Invalid email or password."
            })
          }
        }

        const otp = generateOTP()

        const otpItem = {
          email: emailFormatted,
          otp: otp,
          expires_at: Math.floor(Date.now() / 1000) + 300
        }

        console.log("OTP ITEM:", otpItem)

        await db.send(new PutCommand({
          TableName: OTP_TABLE,
          Item: otpItem
        }))

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: emailFormatted,
          subject: "RetailMind Login OTP",
          text: `Your OTP is ${otp}. It expires in 5 minutes.`
        })

        console.log("OTP SENT TO:", emailFormatted)

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            otpToken: otp
          })
        }
      }

      // =============================
      // STEP 2 : VERIFY OTP
      // =============================
      if (step === "confirm") {

        const { email, otp } = body

        if (!email || !otp) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "Missing OTP fields."
            })
          }
        }

        const emailFormatted = String(email).toLowerCase().trim()

        const record = await db.send(new GetCommand({
          TableName: OTP_TABLE,
          Key: {
            email: emailFormatted
          }
        }))

        if (!record.Item) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              error: "OTP not found."
            })
          }
        }

        if (record.Item.expires_at < Math.floor(Date.now() / 1000)) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              error: "OTP expired."
            })
          }
        }

        if (record.Item.otp !== String(otp)) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              error: "Invalid OTP."
            })
          }
        }

        console.log("OTP VERIFIED FOR:", emailFormatted)

        await db.send(new DeleteCommand({
          TableName: OTP_TABLE,
          Key: {
            email: emailFormatted
          }
        }))

        // Fetch user data to build the session cookie payload
        const userQuery = await db.send(new QueryCommand({
          TableName: USERS_TABLE,
          IndexName: "EmailIndex",
          KeyConditionExpression: "email = :e",
          ExpressionAttributeValues: { ":e": emailFormatted }
        }))

        if (!userQuery.Items || userQuery.Items.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "User not found." })
          }
        }
        const user = userQuery.Items[0]

        const profileQuery = await db.send(new GetCommand({
          TableName: `${process.env.DYNAMODB_PREFIX}BusinessProfiles`,
          Key: { user_id: user.id }
        }))
        const businessInfo = profileQuery.Item || {}

        const { SignJWT } = await import("jose")

        const token = await new SignJWT({
          id: user.id,
          email: user.email,
          display_id: user.display_id || "RIQ-0000",
          business_name: businessInfo.business_name || "Business",
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(SECRET)

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token
          })
        }
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: "Route not found"
      })
    }

  } catch (err) {

    console.error("Lambda Error:", err)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Server error",
        message: err.message
      })
    }
  }
}
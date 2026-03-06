import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { db, TABLE_PREFIX } from "./dynamodb"
import { GetCommand } from "@aws-sdk/lib-dynamodb"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "retailiq-super-secret-key-change-in-production"
)
const COOKIE_NAME = "retailiq_session"

export type SessionUser = {
  id: string
  email: string
  display_id: string
  business_name: string
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getUserById(id: string) {
  const userResult = await db.send(new GetCommand({
    TableName: `${TABLE_PREFIX}Users`,
    Key: { id }
  }));

  if (!userResult.Item) return null;

  const profileResult = await db.send(new GetCommand({
    TableName: `${TABLE_PREFIX}BusinessProfiles`,
    Key: { user_id: id }
  }));

  return {
    ...userResult.Item,
    ...(profileResult.Item || {})
  }
}

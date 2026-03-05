import { NextResponse } from "next/server"

const PAN_TYPE: Record<string, string> = {
  P: "Individual", C: "Company", H: "HUF", F: "Firm",
  A: "AOP/BOI", T: "Trust", B: "BOI", L: "Local Authority",
  J: "Artificial Juridical Person", G: "Government",
}

export async function POST(request: Request) {
  const { pan_number } = await request.json()
  if (!pan_number) {
    return NextResponse.json({ valid: false, error: "PAN number required." }, { status: 400 })
  }
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  const clean = pan_number.toUpperCase().trim()
  if (!panRegex.test(clean)) {
    return NextResponse.json({
      valid: false,
      error: "Invalid PAN format. Expected format: ABCDE1234F (10 characters)",
    })
  }
  const entityCode = clean[3]
  const entityType = PAN_TYPE[entityCode] || "Unknown"
  return NextResponse.json({
    valid: true,
    message: "PAN number format is valid.",
    details: { pan: clean, entity_type: entityType },
  })
}

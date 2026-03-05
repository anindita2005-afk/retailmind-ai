import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { gst_number } = await request.json()
  if (!gst_number) {
    return NextResponse.json({ valid: false, error: "GST number required." }, { status: 400 })
  }
  // GST format: 2-digit state code + 5-char PAN alpha + 4-digit + 1 alpha + 1 entity + Z + 1 checksum
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  const clean = gst_number.toUpperCase().trim()
  if (!gstRegex.test(clean)) {
    return NextResponse.json({
      valid: false,
      error: "Invalid GST format. Expected format: 22AAAAA0000A1Z5 (15 characters)",
    })
  }
  const stateCode = parseInt(clean.slice(0, 2), 10)
  if (stateCode < 1 || stateCode > 37) {
    return NextResponse.json({ valid: false, error: "Invalid state code in GST number." })
  }
  return NextResponse.json({
    valid: true,
    message: "GST number format is valid.",
    details: {
      state_code: clean.slice(0, 2),
      pan: clean.slice(2, 12),
      entity_type: clean[12],
    },
  })
}

import { NextResponse } from "next/server"
import { uploadToS3 } from "@/lib/s3"

export const maxDuration = 60 // Prevent vercel timeouts on file uploads

// 6. Restrict uploads to CSV, PDF, Image files
const ALLOWED_MIME_TYPES = [
    "text/csv",
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
]

// 7. Add file size limit (max 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
    try {
        // 5. Accept multipart/form-data
        const formData = await req.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Only CSV, PDF, and Images are allowed."
            }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: "File size exceeds 5MB limit."
            }, { status: 400 })
        }

        // Convert Web File API object to Node.js Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 4. Implement upload and return public URL (uuid + timestamp built inside uploadToS3)
        const fileUrl = await uploadToS3(buffer, file.name, file.type)

        // Return JSON response with file URL
        return NextResponse.json({
            success: true,
            url: fileUrl,
            message: "File uploaded successfully"
        }, { status: 201 })

    } catch (error: any) {
        console.error("Upload API Error:", error)
        return NextResponse.json({
            error: error.message || "Failed to process file upload"
        }, { status: 500 })
    }
}

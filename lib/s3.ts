import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"

// Requirement 1 & 2: Reusable S3 configuration using AWS SDK v3 and environment variables
const s3Client = new S3Client({
    region: process.env.MY_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || "",
    }
})

const BUCKET_NAME = process.env.MY_AWS_S3_BUCKET_NAME || ""

// Upload file to S3
export async function uploadToS3(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<string> {
    if (!BUCKET_NAME) throw new Error("MY_AWS_S3_BUCKET_NAME is not configured")

    // Generate unique filename (uuid + timestamp)
    const timestamp = Date.now()
    const fileExtension = originalFilename.split('.').pop() || ""
    const uniqueId = uuidv4()
    const key = `uploads/${uniqueId}-${timestamp}.${fileExtension}`

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        // Note: Do not use ACL: 'public-read' unless your bucket enforces object ownership enabling it. 
        // We will construct the public URL format directly.
    })

    // 8. Use async/await & 9. Proper error handling
    try {
        await s3Client.send(command)
        // Return public file URL
        return `https://${BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${key}`
    } catch (error) {
        console.error("S3 Upload Error:", error)
        throw new Error("Failed to upload file to S3")
    }
}

// Delete file function
export async function deleteFromS3(fileUrl: string): Promise<void> {
    if (!BUCKET_NAME) throw new Error("MY_AWS_S3_BUCKET_NAME is not configured")

    try {
        const url = new URL(fileUrl)
        // Extract key from URL (remove leading slash)
        const key = url.pathname.substring(1)

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })

        await s3Client.send(command)
    } catch (error) {
        console.error("S3 Delete Error:", error)
        throw new Error("Failed to delete file from S3")
    }
}

// Get file metadata function
export async function getS3FileMetadata(fileUrl: string) {
    if (!BUCKET_NAME) throw new Error("MY_AWS_S3_BUCKET_NAME is not configured")

    try {
        const url = new URL(fileUrl)
        const key = url.pathname.substring(1)

        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })

        const metadata = await s3Client.send(command)
        return metadata
    } catch (error) {
        console.error("S3 Metadata Error:", error)
        throw new Error("Failed to get file metadata from S3")
    }
}

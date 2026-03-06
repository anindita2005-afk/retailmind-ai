import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, TABLE_PREFIX } from "@/lib/dynamodb"
import { UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const config: any = {
    region: process.env.MY_AWS_REGION || "us-east-1",
};
if (process.env.MY_AWS_ACCESS_KEY_ID && process.env.MY_AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    };
}
const s3Client = new S3Client(config);

const S3_BUCKET = process.env.S3_BUCKET_NAME || "retailmind-ai-uploads-579707562405";

// Max 2 MB
const MAX_SIZE = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const formData = await req.formData()
        const file = formData.get("logo") as File | null
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

        // Validate type
        if (!file.type.startsWith("image/"))
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })

        // Validate size
        if (file.size > MAX_SIZE)
            return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 })

        const ext = file.name.split(".").pop()?.toLowerCase() || "png"
        const filename = `logo_${session.id}.${ext}`

        const bytes = await file.arrayBuffer()

        // Upload to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: `logos/${filename}`,
            Body: Buffer.from(bytes),
            ContentType: file.type,
        }));

        const logoUrl = `https://${S3_BUCKET}.s3.${process.env.MY_AWS_REGION || "us-east-1"}.amazonaws.com/logos/${filename}`

        await db.send(new UpdateCommand({
            TableName: `${TABLE_PREFIX}BusinessProfiles`,
            Key: { user_id: session.id },
            UpdateExpression: "SET logo_url = :logo, updated_at = :updated_at",
            ExpressionAttributeValues: {
                ":logo": logoUrl,
                ":updated_at": new Date().toISOString()
            }
        }));

        return NextResponse.json({ logo_url: logoUrl })
    } catch (err) {
        console.error("[POST /api/profile/logo]", err)
        return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
    }
}

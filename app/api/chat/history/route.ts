import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.MY_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.MY_AWS_S3_BUCKET_NAME!;

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    provider?: string; // "gemini" | "groq"
}

async function loadSessions(userId: string): Promise<ChatSession[]> {
    try {
        const res = await s3.send(
            new GetObjectCommand({ Bucket: BUCKET, Key: `chat-sessions/${userId}.json` })
        );
        const body = await res.Body?.transformToString();
        if (!body) return [];
        const parsed = JSON.parse(body);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err: any) {
        if (err.name === "NoSuchKey") return [];
        throw err;
    }
}

async function saveSessions(userId: string, sessions: ChatSession[]): Promise<void> {
    await s3.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: `chat-sessions/${userId}.json`,
            Body: JSON.stringify(sessions),
            ContentType: "application/json",
        })
    );
}

// GET /api/chat/history — list all sessions
export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const sessions = await loadSessions(session.id);
        // Return sessions sorted newest first, without full message bodies (just metadata)
        const list = sessions
            .map((s) => ({
                id: s.id,
                title: s.title,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
                provider: s.provider,
                messageCount: s.messages.length,
                preview: s.messages.find((m) => m.role === "assistant")?.content?.slice(0, 100) ?? "",
            }))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return NextResponse.json({ sessions: list });
    } catch (err) {
        console.error("[GET /api/chat/history]", err);
        return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
    }
}

// POST /api/chat/history — create or update a session
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { action, sessionId, sessionData } = body;

        const sessions = await loadSessions(session.id);

        if (action === "save") {
            // Upsert session
            const idx = sessions.findIndex((s) => s.id === sessionId);
            const updatedSession: ChatSession = {
                ...sessionData,
                updatedAt: new Date().toISOString(),
            };

            if (idx >= 0) {
                sessions[idx] = updatedSession;
            } else {
                sessions.push(updatedSession);
            }

            await saveSessions(session.id, sessions);
            return NextResponse.json({ success: true, session: updatedSession });
        }

        if (action === "delete") {
            const filtered = sessions.filter((s) => s.id !== sessionId);
            await saveSessions(session.id, filtered);
            return NextResponse.json({ success: true });
        }

        if (action === "clear_all") {
            await saveSessions(session.id, []);
            return NextResponse.json({ success: true });
        }

        // GET single session messages
        if (action === "get") {
            const found = sessions.find((s) => s.id === sessionId);
            if (!found) return NextResponse.json({ error: "Session not found" }, { status: 404 });
            return NextResponse.json({ session: found });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (err) {
        console.error("[POST /api/chat/history]", err);
        return NextResponse.json({ error: "Failed to update sessions" }, { status: 500 });
    }
}

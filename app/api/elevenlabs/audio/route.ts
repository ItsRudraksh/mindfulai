import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      );
    }

    // Get conversation audio - now directly streams from ElevenLabs
    const audioResponse =
      await elevenLabsClient.getConversationAudio(conversationId);

    // Directly return the audio stream from ElevenLabs
    return new NextResponse(audioResponse.body, {
      status: audioResponse.status,
      headers: {
        "Content-Type":
          audioResponse.headers.get("Content-Type") || "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
        "Content-Length": audioResponse.headers.get("Content-Length") || "",
      },
    });
  } catch (error) {
    console.error("ElevenLabs audio fetch error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation audio" },
      { status: 500 }
    );
  }
}

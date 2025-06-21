import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      );
    }

    console.log("Fetching ElevenLabs conversation audio for:", conversationId);

    // Get conversation audio
    const audioUrl = await elevenLabsClient.getConversationAudio(conversationId);
    
    return NextResponse.json({
      success: true,
      audioUrl: audioUrl,
    });
  } catch (error) {
    console.error("ElevenLabs audio fetch error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation audio" },
      { status: 500 }
    );
  }
}
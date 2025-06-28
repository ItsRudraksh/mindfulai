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

    // Get conversation status
    const status = await elevenLabsClient.getConversationStatus(conversationId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("ElevenLabs status check error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation status" },
      { status: 500 }
    );
  }
}

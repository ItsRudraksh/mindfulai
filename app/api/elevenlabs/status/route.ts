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

    console.log("Checking ElevenLabs conversation status for:", conversationId);

    // Get conversation status
    const status = await elevenLabsClient.getConversationStatus(conversationId);
    
    console.log("ElevenLabs status response:", {
      conversation_id: status.conversation_id,
      status: status.status,
      has_audio: status.has_audio,
      call_successful: status.analysis?.call_successful,
      transcript_summary: status.analysis?.transcript_summary ? 'Present' : 'Not available'
    });
    
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
import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId in request body" },
        { status: 400 }
      );
    }

    const conversationDetails =
      await elevenLabsClient.getConversationStatus(conversationId);

    return NextResponse.json({
      success: true,
      data: conversationDetails,
    });
  } catch (error) {
    console.error("💥 ElevenLabs details API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ?
            error.message
          : "Failed to fetch conversation details",
      },
      { status: 500 }
    );
  }
}

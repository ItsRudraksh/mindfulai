import { NextRequest, NextResponse } from "next/server";
import { generateTherapyResponse, ChatMessage } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, userContext } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Generate AI response
    const aiResponse = await generateTherapyResponse(
      message,
      conversationHistory || [],
      userContext
    );

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
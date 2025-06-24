import { NextRequest, NextResponse } from "next/server";
import { generateTherapyResponse, ChatMessage } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, userContext, action } = await request.json();

    if (action === "regenerate") {
      // Handle message regeneration
      if (!message || typeof message !== 'string') {
        return NextResponse.json(
          { error: "Message is required for regeneration" },
          { status: 400 }
        );
      }

      const aiResponse = await generateTherapyResponse(
        message,
        conversationHistory || [],
        userContext
      );

      return NextResponse.json({
        success: true,
        response: aiResponse.content,
        flagged: aiResponse.flagged,
        flagReason: aiResponse.flagReason,
        metadata: {
          aiModel: "anthropic/claude-3.5-sonnet",
          regenerated: true,
        }
      });
    }

    // Handle regular message
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
      response: aiResponse.content,
      flagged: aiResponse.flagged,
      flagReason: aiResponse.flagReason,
      metadata: {
        aiModel: "anthropic/claude-3.5-sonnet",
      }
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import {
  generateTherapyResponse,
  generateConversationSummary,
  shouldSummarizeContext,
  ChatMessage,
} from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      conversationHistory,
      userContext,
      action,
      conversationId,
      existingSummary,
    } = await request.json();

    if (action === "regenerate") {
      // Handle message regeneration
      if (!message || typeof message !== "string") {
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
          aiModel: "anthropic/claude-opus-4",
          regenerated: true,
        },
      });
    }

    if (action === "summarize") {
      // Handle conversation summarization
      if (!conversationHistory || !Array.isArray(conversationHistory)) {
        return NextResponse.json(
          { error: "Conversation history is required for summarization" },
          { status: 400 }
        );
      }

      const summary = await generateConversationSummary(
        conversationHistory,
        existingSummary
      );

      return NextResponse.json({
        success: true,
        summary: summary,
      });
    }

    // Handle regular message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get rolling summary if conversation ID is provided
    let rollingSummary = "";
    if (conversationId) {
      try {
        // This would typically fetch from your database
        // For now, we'll use the rollingSummary from the request if provided
        rollingSummary = userContext?.rollingSummary || "";
      } catch (error) {
        console.error("Error fetching rolling summary:", error);
      }
    }

    // Check if we need to summarize the context
    const needsSummarization = shouldSummarizeContext(
      conversationHistory || [],
      rollingSummary
    );

    let updatedSummary = rollingSummary;
    let contextForAI = conversationHistory || [];

    if (
      needsSummarization &&
      conversationHistory &&
      conversationHistory.length > 10
    ) {
      // Summarize older messages (keep last 5, summarize the rest)
      const messagesToSummarize = conversationHistory.slice(0, -5);
      const recentMessages = conversationHistory.slice(-5);

      if (messagesToSummarize.length > 0) {
        updatedSummary = await generateConversationSummary(
          messagesToSummarize,
          rollingSummary
        );
        contextForAI = recentMessages;
      }
    }

    // Generate AI response with context
    const aiResponse = await generateTherapyResponse(
      message,
      contextForAI,
      userContext,
      updatedSummary
    );

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
      flagged: aiResponse.flagged,
      flagReason: aiResponse.flagReason,
      updatedSummary:
        updatedSummary !== rollingSummary ? updatedSummary : undefined,
      metadata: {
        aiModel: "anthropic/claude-opus-4",
        contextSummarized: needsSummarization,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
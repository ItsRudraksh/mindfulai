import { generateTherapySessionSummary } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { transcript, sessionType, userContext } = await request.json();

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "Valid transcript array is required" },
        { status: 400 }
      );
    }

    // Convert transcript to chat messages format
    const messages = transcript
      .filter((msg: any) => msg.role !== "system")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages found in transcript" },
        { status: 400 }
      );
    }

    // Generate comprehensive AI summary
    const summary = await generateTherapySessionSummary(
      messages,
      sessionType,
      userContext
    );

    return NextResponse.json({
      success: true,
      summary: summary,
    });
  } catch (error) {
    console.error("AI summary generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI summary" },
      { status: 500 }
    );
  }
}

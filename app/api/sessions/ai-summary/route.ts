import { NextRequest, NextResponse } from "next/server";
import { generateConversationSummary } from "@/lib/ai";

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
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages found in transcript" },
        { status: 400 }
      );
    }

    // Generate comprehensive AI summary
    const summary = await generateTherapySessionSummary(messages, sessionType, userContext);

    return NextResponse.json({
      success: true,
      summary: summary,
    });
  } catch (error) {
    console.error('AI summary generation error:', error);
    return NextResponse.json(
      { error: "Failed to generate AI summary" },
      { status: 500 }
    );
  }
}

async function generateTherapySessionSummary(
  messages: Array<{ role: string; content: string }>,
  sessionType: string,
  userContext?: any
): Promise<string> {
  try {
    const conversation = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const summaryPrompt = `As a professional therapy assistant, create a comprehensive summary of this ${sessionType} therapy session. Focus on:

1. **Key Topics Discussed**: Main themes and issues addressed
2. **Emotional Journey**: User's emotional state and any changes during the session
3. **Therapeutic Insights**: Important realizations or breakthroughs
4. **Coping Strategies**: Any techniques or strategies discussed
5. **Progress Indicators**: Signs of growth or areas for continued focus
6. **Session Effectiveness**: How well the session addressed the user's needs

Conversation:
${conversation}

Provide a detailed, professional summary (4-6 paragraphs) that would be valuable for therapeutic continuity and user reflection. Use empathetic, supportive language while maintaining clinical accuracy.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-opus-4",
        messages: [
          {
            role: "system",
            content: "You are a professional therapy assistant specializing in creating comprehensive, empathetic session summaries that support therapeutic continuity and user growth."
          },
          {
            role: "user",
            content: summaryPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Unable to generate summary at this time.";
  } catch (error) {
    console.error("AI summary generation error:", error);
    return "This session covered important therapeutic topics and provided valuable support. A detailed summary could not be generated at this time, but the conversation contributed to your ongoing mental health journey.";
  }
}
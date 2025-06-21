import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const { action, phoneNumber, firstName, conversationContext, conversationId } = await request.json();

    console.log("ElevenLabs Voice API - Action:", action, "Phone:", phoneNumber, "ConversationId:", conversationId);

    if (action === "initiate") {
      if (!phoneNumber || !firstName || !conversationContext) {
        return NextResponse.json(
          { error: "Missing required fields: phoneNumber, firstName, conversationContext" },
          { status: 400 }
        );
      }

      // Initiate voice call
      const callResponse = await elevenLabsClient.initiateCall({
        agentId: process.env.ELEVENLABS_AGENT_ID!,
        agentPhoneNumberId: process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID!,
        toNumber: phoneNumber,
        conversationInitiationClientData: {
          dynamicVariables: {
            firstName: firstName,
            conversationContext: conversationContext,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: callResponse,
      });
    }

    if (action === "status" && conversationId) {
      // Get conversation status
      const status = await elevenLabsClient.getConversationStatus(conversationId);
      return NextResponse.json({
        success: true,
        data: status,
      });
    }

    if (action === "audio" && conversationId) {
      // Get conversation audio
      const audioUrl = await elevenLabsClient.getConversationAudio(conversationId);
      return NextResponse.json({
        success: true,
        audioUrl: audioUrl,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("ElevenLabs Voice API error:", error);
    return NextResponse.json(
      { error: "Failed to process voice request" },
      { status: 500 }
    );
  }
}
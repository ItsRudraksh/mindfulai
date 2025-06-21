import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { phoneNumber, firstName, conversationContext } = body;

    if (!phoneNumber || !firstName || !conversationContext) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: phoneNumber, firstName, conversationContext",
        },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (
      !process.env.ELEVENLABS_AGENT_ID ||
      !process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID
    ) {
      return NextResponse.json(
        { error: "ElevenLabs configuration missing" },
        { status: 500 }
      );
    }

    // Initiate voice call with timeout
    const callPromise = elevenLabsClient.initiateCall({
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

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 30000); // 30 second timeout
    });

    const callResponse = await Promise.race([callPromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      conversation_id: callResponse.conversationId,
      callSid: callResponse.callSid,
      message: callResponse.message,
    });
  } catch (error) {
    console.error("💥 ElevenLabs call creation error:", error);

    // Return a proper error response
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ?
            error.message
          : "Failed to create voice call",
      },
      { status: 500 }
    );
  }
}

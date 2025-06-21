import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, firstName, conversationContext } = await request.json();

    if (!phoneNumber || !firstName || !conversationContext) {
      return NextResponse.json(
        { error: "Missing required fields: phoneNumber, firstName, conversationContext" },
        { status: 400 }
      );
    }

    console.log("Creating ElevenLabs call for:", phoneNumber, "with context:", conversationContext);

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
      conversation_id: callResponse.conversation_id,
      callSid: callResponse.callSid,
      message: callResponse.message,
    });
  } catch (error) {
    console.error("ElevenLabs call creation error:", error);
    return NextResponse.json(
      { error: "Failed to create voice call" },
      { status: 500 }
    );
  }
}
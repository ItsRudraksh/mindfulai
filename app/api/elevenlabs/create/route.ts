import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { phone_number, task, user_name, conversation_context, plan } = body;
    if (!phone_number || !task || !user_name) {
      return NextResponse.json(
        {
          error: "Missing required fields: phone_number, task, user_name",
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

    let agentId = process.env.ELEVENLABS_AGENT_ID;
    if (plan === "free") {
      agentId = process.env.ELEVENLABS_AGENT_ID_FREE!;
    }

    // Enhance conversation context with global memory if available
    let enhancedContext = task;
    if (conversation_context) {
      enhancedContext = `${task}\n\nHere is some additional context about the user and their past conversations, please use this to have a better and more informed conversation:\n${conversation_context}`;
    }

    // Initiate voice call with timeout
    const callPromise = elevenLabsClient.initiateCall({
      agentId: agentId,
      agentPhoneNumberId: process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID!,
      toNumber: phone_number,
      conversationInitiationClientData: {
        dynamicVariables: {
          firstName: user_name,
          conversationContext: enhancedContext,
        },
      },
    });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 30000); // 30 second timeout
    });

    const callResponse = (await Promise.race([
      callPromise,
      timeoutPromise,
    ])) as any;

    return NextResponse.json({
      success: true,
      conversation_id: callResponse.conversationId as any,
      callSid: callResponse.callSid as any,
      message: callResponse.message as any,
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

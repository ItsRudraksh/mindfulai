import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";

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

    // Get user's global memory if available
    let globalMemory = "";
    try {
      // In a real implementation, you would fetch the user's global memory from your database
      // For now, we'll use a placeholder
      // const session = await getServerSession();
      // if (session?.user?.id) {
      //   const user = await db.users.findUnique({ where: { id: session.user.id } });
      //   globalMemory = user?.globalMemory || "";
      // }
    } catch (error) {
      console.error("Error fetching global memory:", error);
    }

    // Enhance conversation context with global memory if available
    let enhancedContext = conversationContext;
    if (globalMemory) {
      enhancedContext = `${conversationContext}\n\nAdditional context about the user: ${globalMemory}`;
    }

    // Initiate voice call with timeout
    const callPromise = elevenLabsClient.initiateCall({
      agentId: process.env.ELEVENLABS_AGENT_ID!,
      agentPhoneNumberId: process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID!,
      toNumber: phoneNumber,
      conversationInitiationClientData: {
        dynamicVariables: {
          firstName: firstName,
          conversationContext: enhancedContext,
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
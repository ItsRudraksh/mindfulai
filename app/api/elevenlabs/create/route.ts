import { NextRequest, NextResponse } from "next/server";
import { elevenLabsClient } from "@/lib/elevenlabs";

export async function POST(request: NextRequest) {
  console.log("🚀 ElevenLabs create API called");
  
  try {
    const body = await request.json();
    console.log("📝 Request body:", body);
    
    const { phoneNumber, firstName, conversationContext } = body;

    if (!phoneNumber || !firstName || !conversationContext) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: phoneNumber, firstName, conversationContext" },
        { status: 400 }
      );
    }

    console.log("📞 Creating ElevenLabs call for:", phoneNumber, "with context:", conversationContext);

    // Check if environment variables are set
    if (!process.env.ELEVENLABS_AGENT_ID || !process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID) {
      console.log("❌ Missing ElevenLabs environment variables");
      return NextResponse.json(
        { error: "ElevenLabs configuration missing" },
        { status: 500 }
      );
    }

    console.log("🔧 Using Agent ID:", process.env.ELEVENLABS_AGENT_ID);
    console.log("🔧 Using Phone Number ID:", process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID);

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
      setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
    });

    console.log("⏳ Waiting for ElevenLabs response...");
    const callResponse = await Promise.race([callPromise, timeoutPromise]);
    
    console.log("✅ ElevenLabs call response:", callResponse);

    return NextResponse.json({
      success: true,
      conversation_id: callResponse.conversation_id,
      callSid: callResponse.callSid,
      message: callResponse.message,
    });
  } catch (error) {
    console.error("💥 ElevenLabs call creation error:", error);
    
    // Return a proper error response
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to create voice call" 
      },
      { status: 500 }
    );
  }
}
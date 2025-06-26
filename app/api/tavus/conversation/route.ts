import { NextRequest, NextResponse } from "next/server";
import { tavusClient } from "@/lib/tavus";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { action, conversationId, conversational_context, firstName } =
      await request.json();

    console.log("Tavus API - Action:", action, "ConversationId:", conversationId);

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

    if (action === "create") {
      // Create custom greeting
      const customGreeting = `Hey there ${firstName || "there"} how are you today?`;

      // Enhance conversational context with global memory if available
      let enhancedContext = conversational_context;
      if (globalMemory) {
        enhancedContext = `${conversational_context}\n\nAdditional context about the user: ${globalMemory}`;
      }

      // Create new Tavus conversation with conversational context and custom greeting
      const conversationRequest: any = {
        replica_id: process.env.TAVUS_REPLICA_ID!,
        persona_id: process.env.TAVUS_PERSONA_ID!,
        conversational_context: enhancedContext,
        custom_greeting: customGreeting,
        conversation_name: `Therapy Session - ${new Date().toISOString()}`,
        properties: {
          enable_recording: true,
          recording_s3_bucket_name: `${process.env.TAVUS_BUCKET_NAME}`,
          recording_s3_bucket_region: `${process.env.TAVUS_BUCKET_REGION}`,
          aws_assume_role_arn: `${process.env.TAVUS_AWS_ARN}`,
        },
      };

      const conversation =
        await tavusClient.createConversation(conversationRequest);

      // Return the conversation data
      return NextResponse.json({
        success: true,
        conversation: conversation,
      });
    }

    if (action === "end" && conversationId) {
      try {
        // End Tavus conversation
        await tavusClient.endConversation(conversationId);

        return NextResponse.json({ success: true });
      } catch (endError) {
        console.error(
          "Error ending Tavus conversation via API for ID:",
          conversationId,
          ":",
          endError
        );
        return NextResponse.json(
          { error: "Failed to end Tavus conversation" },
          { status: 500 }
        );
      }
    }

    if (action === "status" && conversationId) {
      // Get conversation status from Tavus
      const conversation = await tavusClient.getConversation(conversationId);
      return NextResponse.json({ conversation });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Tavus API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
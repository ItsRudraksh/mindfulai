import { NextRequest, NextResponse } from "next/server";
import { tavusClient } from "@/lib/tavus";

export async function POST(request: NextRequest) {
  try {
    const { action, conversationId, conversational_context } =
      await request.json();

    console.log(
      "Received action:",
      action,
      "with conversationId:",
      conversationId,
      "and conversational_context:",
      conversational_context
    );

    if (action === "create") {
      // Create new Tavus conversation with conversational context
      const conversationRequest: any = {
        replica_id: process.env.TAVUS_REPLICA_ID!,
        persona_id: process.env.TAVUS_PERSONA_ID!,
        conversational_context: conversational_context,
        conversation_name: `Therapy Session - ${new Date().toISOString()}`,
        properties: {
          enable_recording: true,
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
      console.log(
        "Attempting to end Tavus conversation via API for ID:",
        conversationId
      );
      try {
        console.log(
          "Calling tavusClient.endConversation for ID:",
          conversationId
        );
        // End Tavus conversation
        await tavusClient.endConversation(conversationId);
        console.log(
          "Tavus conversation ended successfully for ID:",
          conversationId
        );

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

import { NextRequest, NextResponse } from "next/server";
import { tavusClient } from "@/lib/tavus";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const {
      action,
      conversationId,
      conversational_context,
      firstName,
      userId,
    } = await request.json();

    let userPlan = "free";
    if (userId) {
      try {
        const user = await convex.query(api.users.current, {});
        if (user?.subscription?.plan === "pro") {
          userPlan = "pro";
        }
      } catch (e) {
        // fallback to free
      }
    }

    if (action === "create") {
      // Create custom greeting
      const customGreeting = `Hey there ${firstName || "there"} how are you today?`;

      // Set max_call_duration based on plan
      const maxCallDuration = userPlan === "pro" ? 3600 : 1800;

      // Create new Tavus conversation with conversational context and custom greeting
      const conversationRequest: any = {
        replica_id: process.env.TAVUS_REPLICA_ID!,
        persona_id: process.env.TAVUS_PERSONA_ID!,
        conversational_context: conversational_context,
        custom_greeting: customGreeting,
        conversation_name: `Therapy Session - ${new Date().toISOString()}`,
        properties: {
          enable_recording: true,
          recording_s3_bucket_name: `${process.env.TAVUS_BUCKET_NAME}`,
          recording_s3_bucket_region: `${process.env.TAVUS_BUCKET_REGION}`,
          aws_assume_role_arn: `${process.env.TAVUS_AWS_ARN}`,
          max_call_duration: maxCallDuration,
          language: "multilingual",
        },
      };

      console.log(conversationRequest);

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

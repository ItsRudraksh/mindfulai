import { NextRequest, NextResponse } from "next/server";
import { tavusClient } from "@/lib/tavus";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// In-memory job store (jobId -> { status, result, error })
const jobStore = new Map();
function generateJobId() {
  return Math.random().toString(36).substring(2, 12) + Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const {
      action,
      conversationId,
      conversational_context,
      firstName,
      userId,
    } = await request.json();

    if (action === "create") {
      // Create job
      const jobId = generateJobId();
      jobStore.set(jobId, { status: "pending" });

      // Start async Tavus conversation creation
      (async () => {
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
        try {
          // Create custom greeting
          const customGreeting = `Hey there ${firstName || "there"} how are you today?`;
          // Set max_call_duration based on plan
          const maxCallDuration = userPlan === "pro" ? 3600 : 1800;
          // Create new Tavus conversation with conversational context and custom greeting
          const conversationRequest = {
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
              language: "multilingual" as const,
            },
          };
          const conversation =
            await tavusClient.createConversation(conversationRequest);
          jobStore.set(jobId, {
            status: "done",
            result: { success: true, conversation },
          });
        } catch (error) {
          jobStore.set(jobId, {
            status: "error",
            error: "Failed to create Tavus conversation",
          });
        }
      })();
      // Respond immediately with jobId
      return NextResponse.json({ jobId });
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }
  const job = jobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.status === "pending") {
    return NextResponse.json({ status: "pending" });
  }
  if (job.status === "done") {
    return NextResponse.json({ status: "done", ...job.result });
  }
  if (job.status === "error") {
    return NextResponse.json({ status: "error", error: job.error });
  }
  return NextResponse.json({ error: "Unknown job status" }, { status: 500 });
}

import { NextRequest, NextResponse } from "next/server";
import { generatePersonalizedMeditation } from "@/lib/ai";

// In-memory job store (jobId -> { status, result, error })
const jobStore = new Map();

function generateJobId() {
  return Math.random().toString(36).substring(2, 12) + Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const { globalMemory, preferences } = await request.json();

    if (!globalMemory) {
      return NextResponse.json(
        { error: "Global memory is required" },
        { status: 400 }
      );
    }

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences are required" },
        { status: 400 }
      );
    }

    // Create job
    const jobId = generateJobId();
    jobStore.set(jobId, { status: "pending" });

    // Start async generation
    (async () => {
      try {
        const script = await generatePersonalizedMeditation(
          globalMemory,
          preferences
        );
        if (!script) throw new Error("Failed to generate meditation script");
        const audioResponse = await fetch(
          "https://api.elevenlabs.io/v1/text-to-speech/rfkTsdZrVWEVhDycUYn9",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": `${process.env.ELEVENLABS_API_KEY}`,
            },
            body: JSON.stringify({
              text: `${script}`,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                use_speaker_boost: true,
                similarity_boost: 0.75,
                style: 0,
                speed: 0.9,
              },
            }),
          }
        );
        if (!audioResponse.ok)
          throw new Error(`ElevenLabs API error: ${audioResponse.status}`);
        const audioBuffer = await audioResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString("base64");
        const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
        jobStore.set(jobId, {
          status: "done",
          result: { success: true, script, audioUrl },
        });
      } catch (error) {
        jobStore.set(jobId, {
          status: "error",
          error: "Failed to generate meditation session",
        });
      }
    })();

    // Respond immediately with jobId
    return NextResponse.json({ jobId });
  } catch (error) {
    console.error("Meditation generation error:", error);
    return NextResponse.json(
      { error: "Failed to start meditation generation" },
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

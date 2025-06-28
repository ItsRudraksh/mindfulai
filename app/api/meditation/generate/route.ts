import { NextRequest, NextResponse } from "next/server";
import { generatePersonalizedMeditation } from "@/lib/ai";

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

    // Generate personalized meditation script
    const script = await generatePersonalizedMeditation(globalMemory, preferences);

    if (!script) {
      throw new Error("Failed to generate meditation script");
    }

    // Generate audio using ElevenLabs
    const audioResponse = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.8,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      }),
    });

    if (!audioResponse.ok) {
      throw new Error(`ElevenLabs API error: ${audioResponse.status}`);
    }

    // Convert audio to base64 for client
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return NextResponse.json({
      success: true,
      script,
      audioUrl,
    });
  } catch (error) {
    console.error("Meditation generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate meditation session" },
      { status: 500 }
    );
  }
}
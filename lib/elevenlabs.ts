import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

interface ElevenLabsConfig {
  apiKey: string;
}

interface VoiceCallRequest {
  agentId: string;
  agentPhoneNumberId: string;
  toNumber: string;
  conversationInitiationClientData: {
    dynamicVariables: {
      firstName: string;
      conversationContext: string;
    };
  };
}

interface VoiceCallResponse {
  success: boolean;
  message: string;
  conversation_id: string;
  callSid: string;
}

interface ConversationStatus {
  agent_id: string;
  conversationId: string;
  status: "initiated" | "in-progress" | "processing" | "done" | "failed";
  transcript: any[];
  metadata: any;
  analysis: {
    evaluation_criteria_results: any;
    data_collection_results: any;
    call_successful: string;
    transcript_summary: string;
  };
  conversation_initiation_client_data: {
    conversation_config_override: any;
    custom_llm_extra_body: any;
    dynamic_variables: {
      system__agent_id: string;
      firstName: string;
      system__caller_id: string;
      system__time_utc: string;
      system__call_sid: string;
      system__called_number: string;
      system__conversation_id: string;
      system__call_duration_secs: number;
      conversationContext: string;
    };
  };
  hasAudio: boolean;
  has_user_audio: boolean;
  has_response_audio: boolean;
}

class ElevenLabsVoiceClient {
  private client: ElevenLabsClient;
  private apiKey: string;

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    this.client = new ElevenLabsClient({
      apiKey: config.apiKey,
    });
  }

  async initiateCall(request: VoiceCallRequest): Promise<VoiceCallResponse> {
    try {
      const response = await this.client.conversationalAi.twilio.outboundCall({
        agentId: request.agentId,
        agentPhoneNumberId: request.agentPhoneNumberId,
        toNumber: request.toNumber,
        conversationInitiationClientData:
          request.conversationInitiationClientData,
      });

      return response as VoiceCallResponse;
    } catch (error) {
      console.error("💥 ElevenLabs call initiation error:", error);

      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      throw error;
    }
  }

  async getConversationStatus(
    conversationId: string
  ): Promise<ConversationStatus> {
    try {
      const response =
        await this.client.conversationalAi.conversations.get(conversationId);
      return response as ConversationStatus;
    } catch (error) {
      console.error("💥 ElevenLabs conversation status error:", error);
      throw error;
    }
  }

  async getConversationAudio(conversationId: string): Promise<Response> {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
        {
          method: "GET",
          headers: {
            "Xi-Api-Key": this.apiKey,
            "Api-Key": this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch audio: ${response.status} - ${response.statusText}`
        );
      }

      return response; // Return the raw response directly
    } catch (error) {
      console.error("💥 ElevenLabs audio fetch error:", error);
      throw error;
    }
  }
}

// Validate environment variables
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("❌ ELEVENLABS_API_KEY is not set in environment variables");
}

export const elevenLabsClient = new ElevenLabsVoiceClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export type { VoiceCallRequest, VoiceCallResponse, ConversationStatus };

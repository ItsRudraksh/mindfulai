interface TavusConfig {
  apiKey: string;
}

interface TavusConversation {
  conversation_id: string;
  status: "active" | "ended" | "error";
  participant_count: number;
  created_at: string;
  conversation_url: string;
}

interface TavusConversationRequest {
  replica_id: string;
  persona_id: string;
  conversation_name?: string;
  conversational_context: string;
  custom_greeting?: string;
  callback_url?: string;
  properties?: {
    enable_recording?: boolean;
    recording_s3_bucket_name?: string;
    recording_s3_bucket_region?: string;
    aws_assume_role_arn?: string;
    max_call_duration?: number;
    language: "multilingual";
  };
}

class TavusClient {
  private apiKey: string;
  private baseUrl = "https://tavusapi.com/v2";

  constructor(config: TavusConfig) {
    this.apiKey = config.apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${error}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      // No content or non-JSON content, return an empty object or handle as needed
      return {};
    }
  }

  async createConversation(
    request: TavusConversationRequest
  ): Promise<TavusConversation> {
    return this.makeRequest("/conversations", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getConversation(conversationId: string): Promise<TavusConversation> {
    return this.makeRequest(`/conversations/${conversationId}?verbose=true`);
  }

  async endConversation(conversationId: string): Promise<void> {
    await this.makeRequest(`/conversations/${conversationId}/end`, {
      method: "POST",
    });
  }

  async listConversations(): Promise<{ conversations: TavusConversation[] }> {
    return this.makeRequest("/conversations");
  }
}

export const tavusClient = new TavusClient({
  apiKey: `${process.env.NEXT_PUBLIC_TAVUS_API_KEY}`,
});

export type { TavusConversation, TavusConversationRequest };

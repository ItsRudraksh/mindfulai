interface TavusConfig {
  apiKey: string;
  replicaId: string;
}

interface TavusConversation {
  conversation_id: string;
  status: 'active' | 'ended' | 'error';
  participant_count: number;
  created_at: string;
}

interface TavusConversationRequest {
  replica_id: string;
  conversation_name?: string;
  callback_url?: string;
  properties?: {
    max_duration?: number;
    enable_recording?: boolean;
    language?: string;
  };
}

class TavusClient {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';

  constructor(config: TavusConfig) {
    this.apiKey = config.apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createConversation(request: TavusConversationRequest): Promise<TavusConversation> {
    return this.makeRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getConversation(conversationId: string): Promise<TavusConversation> {
    return this.makeRequest(`/conversations/${conversationId}`);
  }

  async endConversation(conversationId: string): Promise<void> {
    await this.makeRequest(`/conversations/${conversationId}/end`, {
      method: 'POST',
    });
  }

  async listConversations(): Promise<{ conversations: TavusConversation[] }> {
    return this.makeRequest('/conversations');
  }
}

export const tavusClient = new TavusClient({
  apiKey: process.env.TAVUS_API_KEY!,
  replicaId: process.env.TAVUS_REPLICA_ID!,
});

export type { TavusConversation, TavusConversationRequest };
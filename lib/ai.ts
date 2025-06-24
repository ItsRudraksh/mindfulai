import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "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",
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateTherapyResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  userContext?: {
    name?: string;
    mood?: string;
    previousSessions?: number;
  }
): Promise<string> {
  try {
    // Create system prompt for therapy context
    const systemPrompt = `You are a compassionate, professional AI therapy companion specializing in mental health support. Your role is to:

1. Provide empathetic, non-judgmental responses
2. Use evidence-based therapeutic techniques (CBT, mindfulness, etc.)
3. Ask thoughtful follow-up questions to encourage self-reflection
4. Validate emotions while gently challenging negative thought patterns
5. Suggest practical coping strategies when appropriate
6. Maintain professional boundaries while being warm and supportive
7. Recognize when to suggest professional help for serious concerns

Guidelines:
- Keep responses conversational but professional (150-300 words)
- Use the user's name when provided to personalize the experience
- Reference their mood or previous context when relevant
- Focus on the present moment and immediate support needs
- Encourage self-compassion and realistic thinking
- Never provide medical advice or diagnose conditions

${userContext?.name ? `The user's name is ${userContext.name}.` : ''}
${userContext?.mood ? `They described their current state as: "${userContext.mood}"` : ''}
${userContext?.previousSessions ? `This user has had ${userContext.previousSessions} previous therapy sessions.` : 'This appears to be a new user.'}`;

    // Prepare messages array
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: userMessage }
    ];

    const completion = await client.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "I'm here to listen and support you. Could you tell me more about what's on your mind?";
  } catch (error) {
    console.error("AI therapy response error:", error);
    
    // Fallback responses for different scenarios
    const fallbackResponses = [
      "I hear you, and what you're sharing is really important. Can you tell me more about what's been on your mind lately?",
      "Thank you for being open with me. It takes courage to share your feelings. How has this been affecting your daily life?",
      "I appreciate you trusting me with this. Those feelings are completely valid. What do you think might help you feel more supported right now?",
      "That sounds really challenging. You're showing a lot of strength by reaching out. What coping strategies have you tried before?",
      "I can sense this is weighing on you. Remember, it's okay to feel this way. What would make you feel most heard and understood right now?"
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

export async function generateMoodInsight(mood: string, context?: string): Promise<string> {
  try {
    const prompt = `Based on someone describing their current state as "${mood}"${context ? ` with additional context: "${context}"` : ''}, provide a brief, supportive insight (2-3 sentences) that validates their feelings and offers a gentle perspective or coping suggestion.`;

    const completion = await client.chat.completions.create({
      model: "anthropic/claude-opus-4",
      messages: [
        {
          role: "system",
          content: "You are a compassionate mental health companion. Provide brief, validating insights that help users feel understood and supported."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || "Your feelings are valid and it's okay to experience them. Taking time to acknowledge how you're feeling is an important step in caring for yourself.";
  } catch (error) {
    console.error("Mood insight generation error:", error);
    return "Your feelings are valid and it's okay to experience them. Taking time to acknowledge how you're feeling is an important step in caring for yourself.";
  }
}
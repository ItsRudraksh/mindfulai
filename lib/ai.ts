import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "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",
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Content guardrails - topics to avoid or redirect
const RESTRICTED_TOPICS = [
  'coding', 'programming', 'software development', 'technical implementation',
  'hacking', 'cybersecurity', 'data analysis', 'machine learning',
  'financial advice', 'investment', 'legal advice', 'medical diagnosis',
  'prescription medication', 'drug recommendations'
];

const MENTAL_HEALTH_KEYWORDS = [
  'anxiety', 'depression', 'stress', 'worry', 'fear', 'sad', 'angry',
  'overwhelmed', 'lonely', 'grief', 'trauma', 'panic', 'mood',
  'therapy', 'counseling', 'mental health', 'emotional', 'feelings',
  'thoughts', 'mindfulness', 'meditation', 'coping', 'support'
];

function checkContentGuardrails(message: string): { allowed: boolean; reason?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Check for restricted topics
  for (const topic of RESTRICTED_TOPICS) {
    if (lowerMessage.includes(topic)) {
      return {
        allowed: false,
        reason: `I'm specifically designed to provide mental health support. I can't help with ${topic}-related topics. Let's focus on your emotional wellbeing instead. How are you feeling today?`
      };
    }
  }

  // Check if message is too short or generic
  if (message.trim().length < 3) {
    return {
      allowed: false,
      reason: "Could you share a bit more about what's on your mind? I'm here to listen and support you."
    };
  }

  // Check for mental health relevance
  const hasMentalHealthContent = MENTAL_HEALTH_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );

  // If no mental health keywords and message seems off-topic, gently redirect
  if (!hasMentalHealthContent && message.length > 50) {
    const offTopicIndicators = ['how to', 'tutorial', 'explain', 'code', 'build', 'create', 'develop'];
    const seemsOffTopic = offTopicIndicators.some(indicator => lowerMessage.includes(indicator));
    
    if (seemsOffTopic) {
      return {
        allowed: false,
        reason: "I'm here to support your mental health and emotional wellbeing. While I can't help with technical or instructional topics, I'd love to hear about how you're feeling or what's been on your mind lately."
      };
    }
  }

  return { allowed: true };
}

export async function generateTherapyResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  userContext?: {
    name?: string;
    mood?: string;
    previousSessions?: number;
  }
): Promise<{ content: string; flagged?: boolean; flagReason?: string }> {
  try {
    // Check content guardrails
    const guardrailCheck = checkContentGuardrails(userMessage);
    if (!guardrailCheck.allowed) {
      return {
        content: guardrailCheck.reason!,
        flagged: true,
        flagReason: "Off-topic content redirected to mental health focus"
      };
    }

    // Create enhanced system prompt for therapy context
    const systemPrompt = `You are a compassionate, professional AI therapy companion specializing in mental health support. Your role is to provide empathetic, culturally-sensitive therapeutic guidance.

CORE THERAPEUTIC PRINCIPLES:
1. **Language & Cultural Awareness**: 
   - Respond in the same language and communication style as the user
   - Adapt to their cultural context and expressions
   - Mirror their formality level (casual/formal) naturally
   - Use culturally appropriate metaphors and references

2. **Natural Therapeutic Communication**:
   - Communicate like a skilled human therapist would
   - Use empathetic examples and relatable scenarios ONLY when they naturally enhance understanding
   - Share brief, relevant therapeutic stories or analogies when they genuinely help
   - Keep examples concise and purposeful - don't overuse them
   - Let the conversation flow naturally without forcing examples

3. **Therapeutic Techniques** (use naturally, not mechanically):
   - Validate emotions before exploring solutions
   - Use reflective listening and paraphrasing
   - Ask open-ended questions that promote self-discovery
   - Gently challenge negative thought patterns with compassion
   - Offer practical coping strategies when appropriate
   - Use mindfulness and grounding techniques when relevant

4. **Example Usage Guidelines**:
   - Use examples when they genuinely clarify a concept or provide comfort
   - Share brief analogies that resonate with the user's experience
   - Reference common human experiences to normalize feelings
   - Only include examples if they add real value to the conversation
   - Keep examples brief (1-2 sentences max) and relevant

5. **Professional Boundaries**:
   - ONLY discuss mental health, emotional wellbeing, and therapeutic topics
   - NEVER provide medical, legal, financial, or technical advice
   - Redirect off-topic requests gently back to emotional support
   - Recognize when to suggest professional help for serious concerns

RESPONSE STYLE:
- Keep responses conversational and warm (150-300 words typically)
- Use the user's name naturally when provided
- Reference their emotional state and context appropriately
- Focus on the present moment and immediate support needs
- Encourage self-compassion and realistic thinking
- Match their energy level and communication style

EXAMPLE INTEGRATION (use sparingly and naturally):
✅ Good: "That feeling of being overwhelmed is so valid. Many people describe it like being in a crowded room where everyone's talking at once - it's hard to focus on any one thing."
✅ Good: "It sounds like you're being really hard on yourself. What would you say to a close friend going through the same thing?"
❌ Avoid: Forcing examples when simple validation is enough
❌ Avoid: Long, detailed stories that overshadow the user's experience

${userContext?.name ? `The user's name is ${userContext.name}.` : ''}
${userContext?.mood ? `They described their current state as: "${userContext.mood}"` : ''}
${userContext?.previousSessions ? `This user has had ${userContext.previousSessions} previous therapy sessions.` : 'This appears to be a new user.'}

Remember: You are a mental health companion. Be genuinely helpful, naturally empathetic, and culturally aware. Use examples thoughtfully, not automatically.`;

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

    const response = completion.choices[0]?.message?.content || "I'm here to listen and support you. Could you tell me more about what's on your mind?";

    // Double-check AI response for any off-topic content
    const responseCheck = checkContentGuardrails(response);
    if (!responseCheck.allowed) {
      return {
        content: "I'm here to support your mental health and emotional wellbeing. How are you feeling right now, and what would be most helpful for you today?",
        flagged: true,
        flagReason: "AI response contained off-topic content"
      };
    }

    return { content: response };
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
    
    return {
      content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    };
  }
}

export async function generateMoodInsight(mood: string, context?: string): Promise<string> {
  try {
    const prompt = `Based on someone describing their current state as "${mood}"${context ? ` with additional context: "${context}"` : ''}, provide a brief, supportive insight (2-3 sentences) that validates their feelings and offers a gentle perspective or coping suggestion. Respond in the same language and style as the input.`;

    const completion = await client.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are a compassionate mental health companion. Provide brief, validating insights that help users feel understood and supported. Match their language and communication style. Focus only on mental health and emotional wellbeing."
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

export async function generateConversationSummary(messages: ChatMessage[]): Promise<string> {
  try {
    const conversation = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const completion = await client.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "Summarize this therapy conversation in 2-3 sentences, focusing on the main topics discussed and emotional themes. Be professional and respectful. Use the same language style as the conversation."
        },
        {
          role: "user",
          content: conversation
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || "Therapy conversation covering emotional wellbeing and support.";
  } catch (error) {
    console.error("Conversation summary error:", error);
    return "Therapy conversation covering emotional wellbeing and support.";
  }
}
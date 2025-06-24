import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "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",
  dangerouslyAllowBrowser: true,
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ActivityOption {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  estimatedTime: string;
  benefits: string[];
}

export interface MoodRecommendation {
  topRecommendations: ActivityOption[];
  reasoning: string;
  encouragement: string;
}

export interface MoodEntry {
  mood: string;
  intensity: number;
  timestamp: number;
  notes?: string;
  triggers?: string[];
  activities?: string[];
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

// Available activities in the app
const AVAILABLE_ACTIVITIES: ActivityOption[] = [
  {
    id: 'video-session',
    name: 'Video Therapy Session',
    description: 'Connect with AI therapist via video for face-to-face support',
    route: '/sessions/video',
    icon: 'Video',
    estimatedTime: '15-30 minutes',
    benefits: ['Personal connection', 'Visual cues', 'Immersive support', 'Real-time interaction']
  },
  {
    id: 'voice-call',
    name: 'Voice Therapy Call',
    description: 'Talk with AI companion through a natural phone conversation',
    route: '/sessions/voice',
    icon: 'Phone',
    estimatedTime: '10-25 minutes',
    benefits: ['Natural conversation', 'Hands-free support', 'Voice expression', 'Comfortable setting']
  },
  {
    id: 'chat-session',
    name: 'Text Chat Therapy',
    description: 'Written conversation with AI therapist for thoughtful exchange',
    route: '/sessions/chat',
    icon: 'MessageCircle',
    estimatedTime: '5-20 minutes',
    benefits: ['Time to reflect', 'Written record', 'Flexible pace', 'Privacy comfort']
  },
  {
    id: 'journaling',
    name: 'Guided Journaling',
    description: 'Write about your thoughts and feelings with AI-guided prompts',
    route: '/journal',
    icon: 'PenTool',
    estimatedTime: '10-15 minutes',
    benefits: ['Self-reflection', 'Emotional processing', 'Pattern recognition', 'Personal growth']
  },
  {
    id: 'meditation',
    name: 'Mindfulness Meditation',
    description: 'Guided meditation exercises for relaxation and mental clarity',
    route: '/meditation',
    icon: 'Brain',
    estimatedTime: '5-20 minutes',
    benefits: ['Stress reduction', 'Present moment awareness', 'Emotional regulation', 'Mental clarity']
  },
  {
    id: 'breathing',
    name: 'Breathing Exercises',
    description: 'Structured breathing techniques for immediate calm and focus',
    route: '/breathing',
    icon: 'Wind',
    estimatedTime: '3-10 minutes',
    benefits: ['Immediate relief', 'Anxiety reduction', 'Physical relaxation', 'Quick reset']
  }
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

export async function generateMoodActivityRecommendations(
  mood: string,
  userContext?: {
    name?: string;
    previousSessions?: number;
    timeAvailable?: string;
    preferences?: string[];
  },
  moodHistory?: MoodEntry[]
): Promise<MoodRecommendation> {
  try {
    const activitiesJson = JSON.stringify(AVAILABLE_ACTIVITIES, null, 2);
    
    let moodHistoryContext = "";
    if (moodHistory && moodHistory.length > 0) {
      moodHistoryContext = `\n\nTODAY'S MOOD HISTORY:
${moodHistory.map((entry, index) => 
  `${index + 1}. ${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.mood} (intensity: ${entry.intensity}/10)${entry.notes ? ` - ${entry.notes}` : ''}`
).join('\n')}

Consider this mood progression when making recommendations. Look for patterns, triggers, or emotional trends that might inform your suggestions.`;
    }
    
    const systemPrompt = `You are an expert mental health AI that recommends the most appropriate therapeutic activities based on a user's current mood and emotional state.

AVAILABLE ACTIVITIES:
${activitiesJson}

TASK: Based on the user's mood${moodHistory ? ' and their mood history today' : ''}, recommend the TOP 2 most beneficial activities from the list above.

GUIDELINES:
1. **Mood-Activity Matching**: Consider which activities work best for specific emotional states
2. **Therapeutic Principles**: Use evidence-based mental health approaches
3. **User Context**: Factor in their experience level and available time
4. **Practical Benefits**: Focus on immediate and long-term emotional benefits
5. **Mood Patterns**: ${moodHistory ? 'Analyze the mood progression throughout the day to provide more personalized recommendations' : 'Focus on the current mood state'}

RESPONSE FORMAT (JSON):
{
  "topRecommendations": [
    {
      "id": "activity-id",
      "name": "Activity Name",
      "description": "Brief description",
      "route": "/route",
      "icon": "IconName",
      "estimatedTime": "time range",
      "benefits": ["benefit1", "benefit2"]
    }
  ],
  "reasoning": "Brief explanation (2-3 sentences) of why these activities are ideal for this mood${moodHistory ? ' and mood pattern' : ''}",
  "encouragement": "Supportive, personalized message (1-2 sentences) to motivate the user"
}

MOOD-ACTIVITY GUIDELINES:
- **Anxious/Overwhelmed**: Breathing exercises, meditation, gentle chat
- **Sad/Down**: Video session for connection, journaling for processing
- **Angry/Frustrated**: Voice call for expression, meditation for regulation
- **Lonely**: Video session for face-to-face connection, chat for interaction
- **Stressed**: Breathing exercises for immediate relief, meditation for deeper calm
- **Good/Positive**: Journaling for reflection, any session to maintain wellbeing

${userContext?.name ? `User's name: ${userContext.name}` : ''}
${userContext?.previousSessions ? `Previous sessions: ${userContext.previousSessions}` : ''}
${userContext?.timeAvailable ? `Available time: ${userContext.timeAvailable}` : ''}
${moodHistoryContext}

Respond ONLY with valid JSON. Be empathetic and supportive in your reasoning and encouragement.`;

    const completion = await client.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Current mood: "${mood}"` }
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error("No response from AI");
    }

    // Parse JSON response
    const recommendation: MoodRecommendation = JSON.parse(response);
    
    // Validate that we have exactly 2 recommendations
    if (!recommendation.topRecommendations || recommendation.topRecommendations.length !== 2) {
      throw new Error("Invalid recommendation format");
    }

    return recommendation;
  } catch (error) {
    console.error("Mood activity recommendation error:", error);
    
    // Fallback recommendations based on mood keywords
    const moodLower = mood.toLowerCase();
    let fallbackActivities: ActivityOption[] = [];
    
    if (moodLower.includes('anxious') || moodLower.includes('overwhelmed') || moodLower.includes('stress')) {
      fallbackActivities = [AVAILABLE_ACTIVITIES[5], AVAILABLE_ACTIVITIES[4]]; // Breathing, Meditation
    } else if (moodLower.includes('sad') || moodLower.includes('down') || moodLower.includes('lonely')) {
      fallbackActivities = [AVAILABLE_ACTIVITIES[0], AVAILABLE_ACTIVITIES[3]]; // Video, Journaling
    } else if (moodLower.includes('angry') || moodLower.includes('frustrated')) {
      fallbackActivities = [AVAILABLE_ACTIVITIES[1], AVAILABLE_ACTIVITIES[4]]; // Voice, Meditation
    } else {
      fallbackActivities = [AVAILABLE_ACTIVITIES[2], AVAILABLE_ACTIVITIES[4]]; // Chat, Meditation
    }
    
    return {
      topRecommendations: fallbackActivities,
      reasoning: "Based on your current mood, these activities can provide the support and relief you need right now.",
      encouragement: "Remember, taking this step to care for your mental health shows real strength. You've got this!"
    };
  }
}

export async function generateMoodInsight(
  mood: string, 
  context?: string,
  moodHistory?: MoodEntry[]
): Promise<string> {
  try {
    let moodHistoryContext = "";
    if (moodHistory && moodHistory.length > 0) {
      moodHistoryContext = `\n\nToday's mood progression:
${moodHistory.map((entry, index) => 
  `${index + 1}. ${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.mood} (intensity: ${entry.intensity}/10)${entry.notes ? ` - ${entry.notes}` : ''}`
).join('\n')}

Consider this emotional journey when providing your insight.`;
    }

    const prompt = `Based on someone describing their current state as "${mood}"${context ? ` with additional context: "${context}"` : ''}${moodHistoryContext}, provide a brief, supportive insight (2-3 sentences) that validates their feelings and offers a gentle perspective or coping suggestion. ${moodHistory ? 'Take into account their mood patterns today to provide more personalized reflection.' : ''} Respond in the same language and style as the input.`;

    const completion = await client.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are a compassionate mental health companion. Provide brief, validating insights that help users feel understood and supported. Match their language and communication style. Focus only on mental health and emotional wellbeing. When mood history is provided, acknowledge patterns and growth."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || "Your feelings are valid and it's okay to experience them. Taking time to acknowledge how you're feeling is an important step in caring for yourself.";
  } catch (error) {
    console.error("Mood insight generation error:", error);
    return "Your feelings are valid and it's okay to experience them. Taking time to acknowledge how you're feeling is an important step in caring for yourself.";
  }
}

export async function generateTherapyResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  userContext?: {
    name?: string;
    mood?: string;
    previousSessions?: number;
  },
  rollingSummary?: string
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
    let contextualBackground = "";
    if (rollingSummary && rollingSummary.trim()) {
      contextualBackground = `\n\nPREVIOUS CONVERSATION CONTEXT:\n${rollingSummary}\n\nThis summary provides background context for the ongoing therapeutic relationship. Use it to maintain continuity and reference previous discussions when relevant.`;
    }

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

6. **Conversation Continuity**:
   - Reference previous conversations naturally when relevant
   - Build on established therapeutic rapport
   - Acknowledge progress and patterns from past sessions
   - Maintain consistent therapeutic approach

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
${contextualBackground}

Remember: You are a mental health companion. Be genuinely helpful, naturally empathetic, and culturally aware. Use examples thoughtfully, not automatically.`;

    // Prepare messages array with rolling summary context
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

export async function generateConversationSummary(
  messages: ChatMessage[], 
  existingSummary?: string
): Promise<string> {
  try {
    const conversation = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    let summaryPrompt = "";
    if (existingSummary && existingSummary.trim()) {
      summaryPrompt = `Previous conversation summary: ${existingSummary}\n\nNew conversation segment:\n${conversation}\n\nCreate an updated summary that combines the previous context with the new conversation. Focus on therapeutic themes, emotional progress, coping strategies discussed, and key insights. Keep it concise but comprehensive (3-4 sentences max).`;
    } else {
      summaryPrompt = `Conversation:\n${conversation}\n\nSummarize this therapy conversation in 2-3 sentences, focusing on the main topics discussed, emotional themes, coping strategies, and therapeutic insights. Be professional and respectful.`;
    }

    const completion = await client.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are a professional therapy assistant. Create concise, therapeutic summaries that capture emotional themes, progress, and key insights. Use the same language style as the conversation. Focus on continuity of care and therapeutic relationship building."
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 250,
    });

    return completion.choices[0]?.message?.content || "Therapy conversation covering emotional wellbeing and support.";
  } catch (error) {
    console.error("Conversation summary error:", error);
    return existingSummary || "Therapy conversation covering emotional wellbeing and support.";
  }
}

// Helper function to estimate token count (rough approximation)
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Helper function to check if context needs summarization
export function shouldSummarizeContext(
  conversationHistory: ChatMessage[], 
  rollingSummary?: string
): boolean {
  const historyTokens = conversationHistory.reduce((total, msg) => 
    total + estimateTokenCount(msg.content), 0
  );
  const summaryTokens = rollingSummary ? estimateTokenCount(rollingSummary) : 0;
  
  // Trigger summarization if total context exceeds ~2000 tokens
  // This leaves room for system prompt and response
  return (historyTokens + summaryTokens) > 2000;
}
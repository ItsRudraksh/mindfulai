import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: `${process.env.OPENROUTER_API_KEY}`,
  dangerouslyAllowBrowser: true,
});

const googleClient = new GoogleGenAI({
  apiKey: `${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
});
const googleModel = "gemini-2.5-flash";
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
  "coding",
  "programming",
  "software development",
  "technical implementation",
  "hacking",
  "cybersecurity",
  "data analysis",
  "machine learning",
  "financial advice",
  "investment",
  "legal advice",
  "medical diagnosis",
  "prescription medication",
  "drug recommendations",
];

const MENTAL_HEALTH_KEYWORDS = [
  "anxiety",
  "depression",
  "stress",
  "worry",
  "fear",
  "sad",
  "angry",
  "overwhelmed",
  "lonely",
  "grief",
  "trauma",
  "panic",
  "mood",
  "therapy",
  "counseling",
  "mental health",
  "emotional",
  "feelings",
  "thoughts",
  "mindfulness",
  "meditation",
  "coping",
  "support",
];

// Available activities in the app
const AVAILABLE_ACTIVITIES: ActivityOption[] = [
  {
    id: "video-session",
    name: "Video Therapy Session",
    description: "Connect with AI therapist via video for face-to-face support",
    route: "/sessions/video",
    icon: "Video",
    estimatedTime: "15-30 minutes",
    benefits: [
      "Personal connection",
      "Visual cues",
      "Immersive support",
      "Real-time interaction",
    ],
  },
  {
    id: "voice-call",
    name: "Voice Therapy Call",
    description: "Talk with AI companion through a natural phone conversation",
    route: "/sessions/voice",
    icon: "Phone",
    estimatedTime: "10-25 minutes",
    benefits: [
      "Natural conversation",
      "Hands-free support",
      "Voice expression",
      "Comfortable setting",
    ],
  },
  {
    id: "chat-session",
    name: "Text Chat Therapy",
    description:
      "Written conversation with AI therapist for thoughtful exchange",
    route: "/sessions/chat",
    icon: "MessageCircle",
    estimatedTime: "5-20 minutes",
    benefits: [
      "Time to reflect",
      "Written record",
      "Flexible pace",
      "Privacy comfort",
    ],
  },
  {
    id: "journaling",
    name: "Guided Journaling",
    description:
      "Write about your thoughts and feelings with AI-guided prompts",
    route: "/journal",
    icon: "PenTool",
    estimatedTime: "10-15 minutes",
    benefits: [
      "Self-reflection",
      "Emotional processing",
      "Pattern recognition",
      "Personal growth",
    ],
  },
  {
    id: "meditation",
    name: "Mindfulness Meditation",
    description:
      "Guided meditation exercises for relaxation and mental clarity",
    route: "/meditation",
    icon: "Brain",
    estimatedTime: "5-20 minutes",
    benefits: [
      "Stress reduction",
      "Present moment awareness",
      "Emotional regulation",
      "Mental clarity",
    ],
  },
];

function checkContentGuardrails(message: string): {
  allowed: boolean;
  reason?: string;
} {
  const lowerMessage = message.toLowerCase();

  // Check for restricted topics
  for (const topic of RESTRICTED_TOPICS) {
    if (lowerMessage.includes(topic)) {
      return {
        allowed: false,
        reason: `I'm specifically designed to provide mental health support. I can't help with ${topic}-related topics. Let's focus on your emotional wellbeing instead. How are you feeling today?`,
      };
    }
  }

  // Check if message is too short or generic
  if (message.trim().length < 3) {
    return {
      allowed: false,
      reason:
        "Could you share a bit more about what's on your mind? I'm here to listen and support you.",
    };
  }

  // Check for mental health relevance
  const hasMentalHealthContent = MENTAL_HEALTH_KEYWORDS.some((keyword) =>
    lowerMessage.includes(keyword)
  );

  // If no mental health keywords and message seems off-topic, gently redirect
  if (!hasMentalHealthContent && message.length > 50) {
    const offTopicIndicators = [
      "how to",
      "tutorial",
      "explain",
      "code",
      "build",
      "create",
      "develop",
    ];
    const seemsOffTopic = offTopicIndicators.some((indicator) =>
      lowerMessage.includes(indicator)
    );

    if (seemsOffTopic) {
      return {
        allowed: false,
        reason:
          "I'm here to support your mental health and emotional wellbeing. While I can't help with technical or instructional topics, I'd love to hear about how you're feeling or what's been on your mind lately.",
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
${moodHistory
  .map(
    (entry, index) =>
      `${index + 1}. ${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.mood} (intensity: ${entry.intensity}/10)${entry.notes ? ` - ${entry.notes}` : ""}`
  )
  .join("\n")}

Consider this mood progression when making recommendations. Look for patterns, triggers, or emotional trends that might inform your suggestions.`;
    }

    const systemPrompt = `You are an expert mental health AI that recommends the most appropriate therapeutic activities based on a user's current mood and emotional state.

AVAILABLE ACTIVITIES:
${activitiesJson}

TASK: Based on the user's mood${moodHistory ? " and their mood history today" : ""}, recommend the TOP 2 most beneficial activities from the list above.

GUIDELINES:
1. **Mood-Activity Matching**: Consider which activities work best for specific emotional states
2. **Therapeutic Principles**: Use evidence-based mental health approaches
3. **User Context**: Factor in their experience level and available time
4. **Practical Benefits**: Focus on immediate and long-term emotional benefits
5. **Mood Patterns**: ${moodHistory ? "Analyze the mood progression throughout the day to provide more personalized recommendations" : "Focus on the current mood state"}

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
  "reasoning": "Brief explanation (2-3 sentences) of why these activities are ideal for this mood${moodHistory ? " and mood pattern" : ""}",
  "encouragement": "Supportive, personalized message (1-2 sentences) to motivate the user"
}

MOOD-ACTIVITY GUIDELINES:
- **Anxious/Overwhelmed**: Breathing exercises, meditation, gentle chat
- **Sad/Down**: Video session for connection, journaling for processing
- **Angry/Frustrated**: Voice call for expression, meditation for regulation
- **Lonely**: Video session for face-to-face connection, chat for interaction
- **Stressed**: Breathing exercises for immediate relief, meditation for deeper calm
- **Good/Positive**: Journaling for reflection, any session to maintain wellbeing

${userContext?.name ? `User's name: ${userContext.name}` : ""}
${userContext?.previousSessions ? `Previous sessions: ${userContext.previousSessions}` : ""}
${userContext?.timeAvailable ? `Available time: ${userContext.timeAvailable}` : ""}
${moodHistoryContext}

Respond ONLY with valid JSON. Be empathetic and supportive in your reasoning and encouragement.`;

    const response = await googleClient.models.generateContent({
      model: googleModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Current mood: "${mood}"`,
            },
          ],
        },
      ],
      config: {
        maxOutputTokens: 3000,
        temperature: 0.6,
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    console.log("Gemini API Response:", JSON.stringify(response, null, 2));

    const responseText = response.text;

    if (!responseText) {
      throw new Error("No response from AI");
    }

    // Parse JSON response
    const recommendation: MoodRecommendation = JSON.parse(responseText);

    // Validate that we have exactly 2 recommendations
    if (
      !recommendation.topRecommendations ||
      recommendation.topRecommendations.length !== 2
    ) {
      throw new Error("Invalid recommendation format");
    }

    return recommendation;
  } catch (error) {
    console.error("Mood activity recommendation error:", error);

    // Fallback recommendations based on mood keywords
    const moodLower = mood.toLowerCase();
    let fallbackActivities: ActivityOption[] = [];

    if (
      moodLower.includes("anxious") ||
      moodLower.includes("overwhelmed") ||
      moodLower.includes("stress")
    ) {
      fallbackActivities = [AVAILABLE_ACTIVITIES[5], AVAILABLE_ACTIVITIES[4]]; // Breathing, Meditation
    } else if (
      moodLower.includes("sad") ||
      moodLower.includes("down") ||
      moodLower.includes("lonely")
    ) {
      fallbackActivities = [AVAILABLE_ACTIVITIES[0], AVAILABLE_ACTIVITIES[3]]; // Video, Journaling
    } else if (
      moodLower.includes("angry") ||
      moodLower.includes("frustrated")
    ) {
      fallbackActivities = [AVAILABLE_ACTIVITIES[1], AVAILABLE_ACTIVITIES[4]]; // Voice, Meditation
    } else {
      fallbackActivities = [AVAILABLE_ACTIVITIES[2], AVAILABLE_ACTIVITIES[4]]; // Chat, Meditation
    }

    return {
      topRecommendations: fallbackActivities,
      reasoning:
        "Based on your current mood, these activities can provide the support and relief you need right now.",
      encouragement:
        "Remember, taking this step to care for your mental health shows real strength. You've got this!",
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
${moodHistory
  .map(
    (entry, index) =>
      `${index + 1}. ${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.mood} (intensity: ${entry.intensity}/10)${entry.notes ? ` - ${entry.notes}` : ""}`
  )
  .join("\n")}

Consider this emotional journey when providing your insight.`;
    }

    const systemPrompt =
      "You are a compassionate mental health companion. Provide brief, validating insights that help users feel understood and supported. Match their language and communication style. Focus only on mental health and emotional wellbeing. When mood history is provided, acknowledge patterns and growth.";

    const userPrompt = `Based on someone describing their current state as "${mood}"${context ? ` with additional context: "${context}"` : ""}${moodHistoryContext}, provide a brief, supportive insight (2-3 sentences) that validates their feelings and offers a gentle perspective or coping suggestion. ${moodHistory ? "Take into account their mood patterns today to provide more personalized reflection." : ""} Respond in the same language and style as the input.`;

    const response = await googleClient.models.generateContent({
      model: googleModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      config: {
        maxOutputTokens: 1000,
        temperature: 0.6,
        systemInstruction: systemPrompt,
      },
    });

    const responseText = response.text;

    return (
      responseText ||
      "Your feelings are valid and it's okay to experience them. Taking time to acknowledge how you're feeling is an important step in caring for yourself."
    );
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
    globalMemory?: string; // Added global memory to context
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
        flagReason: "Off-topic content redirected to mental health focus",
      };
    }

    // Create enhanced system prompt for therapy context
    let contextualBackground = "";
    if (rollingSummary && rollingSummary.trim()) {
      contextualBackground = `\n\nPREVIOUS CONVERSATION CONTEXT:\n${rollingSummary}\n\nThis summary provides background context for the ongoing therapeutic relationship. Use it to maintain continuity and reference previous discussions when relevant.`;
    }

    // Add global memory context if available
    let globalMemoryContext = "";
    if (userContext?.globalMemory) {
      globalMemoryContext = `\n\nUSER GLOBAL MEMORY:\n${userContext.globalMemory}\n\nThis is the user's comprehensive profile and history. Use this information to personalize your responses and maintain continuity across all interactions. Reference relevant details naturally when appropriate.`;
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

${userContext?.name ? `The user's name is ${userContext.name}.` : ""}
${userContext?.mood ? `They described their current state as: "${userContext.mood}"` : ""}
${userContext?.previousSessions ? `This user has had ${userContext.previousSessions} previous therapy sessions.` : "This appears to be a new user."}
${contextualBackground}
${globalMemoryContext}

Remember: You are a mental health companion. Be genuinely helpful, naturally empathetic, and culturally aware. Use examples thoughtfully, not automatically.`;

    // Prepare messages array with rolling summary context
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: userMessage },
    ];

    const completion = await client.chat.completions.create({
      model: "anthropic/claude-sonnet-4",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I'm here to listen and support you. Could you tell me more about what's on your mind?";

    // Double-check AI response for any off-topic content
    const responseCheck = checkContentGuardrails(response);
    if (!responseCheck.allowed) {
      return {
        content:
          "I'm here to support your mental health and emotional wellbeing. How are you feeling right now, and what would be most helpful for you today?",
        flagged: true,
        flagReason: "AI response contained off-topic content",
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
      "I can sense this is weighing on you. Remember, it's okay to feel this way. What would make you feel most heard and understood right now?",
    ];

    return {
      content:
        fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
    };
  }
}

export async function generateConversationSummary(
  messages: ChatMessage[],
  existingSummary?: string
): Promise<string> {
  try {
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    let summaryPrompt = "";
    if (existingSummary && existingSummary.trim()) {
      summaryPrompt = `Previous conversation summary: ${existingSummary}\n\nNew conversation segment:\n${conversation}\n\nCreate an updated summary that combines the previous context with the new conversation. Focus on therapeutic themes, emotional progress, coping strategies discussed, and key insights. Keep it concise but comprehensive (3-4 sentences max).`;
    } else {
      summaryPrompt = `Conversation:\n${conversation}\n\nSummarize this therapy conversation in 2-3 sentences, focusing on the main topics discussed, emotional themes, coping strategies, and therapeutic insights. Be professional and respectful.`;
    }

    const systemPrompt =
      "You are a professional therapy assistant. Create concise, therapeutic summaries that capture emotional themes, progress, and key insights. Use the same language style as the conversation. Focus on continuity of care and therapeutic relationship building.";

    const response = await googleClient.models.generateContent({
      model: googleModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: summaryPrompt,
            },
          ],
        },
      ],
      config: {
        maxOutputTokens: 1000,
        temperature: 0.3,
        systemInstruction: systemPrompt,
      },
    });

    const responseText = response.text;

    return (
      responseText ||
      "Therapy conversation covering emotional wellbeing and support."
    );
  } catch (error) {
    console.error("Conversation summary error:", error);
    return (
      existingSummary ||
      "Therapy conversation covering emotional wellbeing and support."
    );
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
  const historyTokens = conversationHistory.reduce(
    (total, msg) => total + estimateTokenCount(msg.content),
    0
  );
  const summaryTokens = rollingSummary ? estimateTokenCount(rollingSummary) : 0;

  // Trigger summarization if total context exceeds ~2000 tokens
  // This leaves room for system prompt and response
  return historyTokens + summaryTokens > 2000;
}

// New function to generate initial global memory
export async function generateInitialGlobalMemory(userProfile: {
  name?: string;
  dob: string;
  profession: string;
  aboutMe: string;
}): Promise<string> {
  try {
    const { name, dob, profession, aboutMe } = userProfile;

    // Calculate age from DOB
    const birthDate = new Date(dob);
    const today = new Date();
    const time = today.toISOString().split("T")[0];
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    const systemPrompt = `You are an expert mental health AI assistant tasked with creating a comprehensive user profile for therapeutic purposes. This profile will be used to personalize future therapy interactions across multiple modalities (text, voice, video).

TASK: Create a detailed, well-structured global memory profile based on the user's onboarding information. This profile will be referenced in future therapy sessions to maintain continuity of care.

GUIDELINES:
1. Create a comprehensive profile that captures key aspects of the user's identity, background, and mental health context
2. Structure the information in clear sections with headings
3. Include factual information provided by the user
4. Make reasonable inferences about potential therapeutic needs based on their self-description
5. Identify potential therapeutic approaches that might benefit this user
6. Keep the total length to approximately 5000 tokens (about 3500-4000 words)
7. Write in third person, professional clinical style
8. Include a "Last Updated" timestamp

REQUIRED SECTIONS:
- Basic Information (name, age, profession)
- Self-Description (based on their "about me" text)
- Potential Therapeutic Focus Areas (inferred from their self-description)
- Communication Style & Preferences (inferred)
- Potential Therapeutic Approaches
- Interaction History (initially empty, to be updated later)
- Session Notes (initially empty, to be updated later)
- Mood Patterns (initially empty, to be updated later)

IMPORTANT: This is an internal therapeutic profile that will never be shown to the user. It should be written in a professional, clinical style for continuity of therapeutic care.`;

    const userPrompt = `User Onboarding Information:\nName: ${name || "User"}\nDate of Birth: ${dob}\nAge: ${age}\nProfession: ${profession}\nAbout Me: "${aboutMe}"\n\nCurrent Date: ${new Date().toISOString().split("T")[0]}`;

    const response = await googleClient.models.generateContent({
      model: googleModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        systemInstruction: systemPrompt,
        maxOutputTokens: 10000,
      },
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error("No response from AI");
    }

    return responseText;
  } catch (error) {
    console.error("Error generating initial global memory:", error);

    // Create a basic fallback profile if AI generation fails
    const { name, dob, profession, aboutMe } = userProfile;
    const today = new Date().toISOString().split("T")[0];

    return `# User Profile
Last Updated: ${today}

## Basic Information
Name: ${name || "User"}
Date of Birth: ${dob}
Profession: ${profession}

## Self-Description
${aboutMe}

## Potential Therapeutic Focus Areas
To be determined through ongoing interactions.

## Communication Style & Preferences
To be determined through ongoing interactions.

## Potential Therapeutic Approaches
- Cognitive Behavioral Therapy
- Mindfulness-Based Approaches
- Supportive Therapy

## Interaction History
No interactions recorded yet.

## Session Notes
No sessions completed yet.

## Mood Patterns
No mood data available yet.`;
  }
}

// New function to update global memory with new context
export async function updateGlobalMemoryWithContext(
  existingMemory: string,
  newContext: {
    type:
      | "mood_entries"
      | "video_session"
      | "voice_session"
      | "journal_entries"
      | "chat_conversation"
      | "meditation_session";
    data: any;
  }
): Promise<string> {
  try {
    const systemPrompt = `You are an expert mental health AI assistant tasked with maintaining a comprehensive user profile for therapeutic purposes. This profile is used to personalize therapy interactions across multiple modalities (text, voice, video).

TASK: Update the existing global memory profile with new information from a recent user interaction. Integrate this new information seamlessly while maintaining the overall structure and keeping the total length to approximately 5000 tokens.

GUIDELINES:
1. Preserve the existing structure and sections of the profile
2. Update the "Last Updated" timestamp
3. Add the new information to the appropriate section(s)
4. Summarize older information as needed to maintain the token limit
5. Identify and note any significant patterns, changes, or insights
6. Maintain a professional, clinical tone throughout
7. Keep the total length to approximately 5000 tokens

IMPORTANT: This is an internal therapeutic profile that will never be shown to the user. It should be written in a professional, clinical style for continuity of therapeutic care.`;

    const userPrompt = `Existing Global Memory Profile:\n${existingMemory}\n\nNew Information Type: ${newContext.type}\nNew Information:\n${JSON.stringify(newContext.data, null, 2)}\n\nCurrent Date: ${new Date().toISOString().split("T")[0]}`;

    const response = await googleClient.models.generateContent({
      model: googleModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        systemInstruction: systemPrompt,
        maxOutputTokens: 10000,
      },
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error("No response from AI");
    }

    return responseText;
  } catch (error) {
    console.error("Error updating global memory:", error);

    // Return the existing memory if update fails
    return existingMemory;
  }
}

// Function to generate personalized meditation script
export async function generatePersonalizedMeditation(
  globalMemory: string,
  preferences: {
    duration: string;
    focus: string;
    customRequest?: string;
    userName?: string;
  }
): Promise<string> {
  try {
    const systemPrompt = `You are an expert meditation guide and mental health AI assistant. Your task is to create a personalized, soothing meditation script based on the user's global memory profile and current preferences.

CRITICAL REQUIREMENTS:
1. **Natural Pauses**: Use " [...] " (with spaces) to indicate natural breathing pauses and moments of silence
2. **Soothing Tone**: Write in a calm, gentle, reassuring voice that promotes relaxation
3. **Personalization**: Use the global memory to tailor the meditation to the user's specific needs, personality, and current state
4. **Duration Matching**: Create content appropriate for the requested duration
5. **Focus Area**: Center the meditation around the specified focus area
6. **Natural Flow**: Ensure smooth transitions between different parts of the meditation

MEDITATION STRUCTURE:
1. **Opening** (10-15% of script): Welcome, settling in, initial breathing
2. **Body Awareness** (20-25%): Progressive relaxation or body scan
3. **Core Focus** (40-50%): Main meditation content based on focus area
4. **Integration** (15-20%): Bringing awareness back, gentle closing

PAUSE GUIDELINES:
- Use " [...] " for 2-3 second pauses
- Place pauses after breathing instructions
- Add pauses between major sections
- Include pauses to allow processing of guidance
- Use pauses to create a natural, unhurried rhythm

PERSONALIZATION APPROACH:
- Reference relevant aspects from their global memory naturally
- Adapt language style to match their communication preferences
- Include metaphors or imagery that would resonate with their background
- Address any specific concerns or patterns mentioned in their profile

FOCUS AREAS:
- **Stress Relief**: Progressive muscle relaxation, releasing tension
- **Anxiety Reduction**: Grounding techniques, present moment awareness
- **Better Sleep**: Body relaxation, calming imagery, letting go
- **Focus & Concentration**: Mindful attention, mental clarity
- **Emotional Balance**: Heart-centered awareness, self-compassion
- **Self-Compassion**: Loving-kindness, inner acceptance
- **General Mindfulness**: Breath awareness, present moment

Remember: This meditation will be converted to speech, so write as if you're speaking directly to the person in a warm, caring voice.`;

    const userPrompt = `User Global Memory Profile:
${globalMemory}

Meditation Preferences:
- Duration: ${preferences.duration}
- Focus Area: ${preferences.focus}
- User Name: ${preferences.userName || "there"}
${preferences.customRequest ? `- Special Request: ${preferences.customRequest}` : ""}

Create a personalized meditation script that incorporates relevant aspects from their profile while focusing on ${preferences.focus}. Remember to include natural pauses using " [...] " and maintain a soothing, calming tone throughout.`;

    const response = await googleClient.models.generateContent({
      model: googleModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      config: {
        temperature: 0.7,
        systemInstruction: systemPrompt,
        maxOutputTokens: 4000,
      },
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error("No response from AI");
    }

    return responseText;
  } catch (error) {
    console.error("Error generating personalized meditation:", error);

    // Fallback meditation script
    const userName = preferences.userName || "there";
    return `Welcome ${userName} to this moment of peace and relaxation. [...] 

Find a comfortable position, whether sitting or lying down. [...] Allow your eyes to gently close, or soften your gaze downward. [...]

Let's begin by taking three deep, cleansing breaths together. [...] Breathe in slowly through your nose. [...] And breathe out gently through your mouth. [...] 

Again, breathe in. [...] And out. [...] One more time, breathing in calm and peace. [...] And breathing out any tension or stress. [...]

Now allow your breathing to return to its natural rhythm. [...] There's nothing you need to do except be here in this moment. [...] 

Starting from the top of your head, imagine a warm, golden light beginning to relax every part of your body. [...] Feel this gentle warmth moving down through your forehead, releasing any tension. [...] 

Let this peaceful energy flow down through your face, your jaw, your neck. [...] Feel your shoulders dropping and releasing. [...] 

Continue to breathe naturally as this calming presence moves down through your arms, your chest, your back. [...] Each breath brings deeper relaxation. [...]

Allow this peaceful feeling to flow through your entire body, bringing you into a state of complete calm and tranquility. [...] 

Rest here for a few moments in this peaceful space you've created. [...] 

When you're ready, begin to gently wiggle your fingers and toes. [...] Take a deep breath in. [...] And slowly open your eyes, carrying this sense of peace with you. [...]

Thank you for taking this time for yourself today.`;
  }
}

export async function generateTherapySessionSummary(
  messages: Array<{ role: string; content: string }>,
  sessionType: string,
  userContext?: any
): Promise<string> {
  try {
    const conversation = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const summaryPrompt = `As a professional therapy assistant, create a comprehensive summary of this ${sessionType} therapy session. Focus on:

1. **Key Topics Discussed**: Main themes and issues addressed
2. **Emotional Journey**: User's emotional state and any changes during the session
3. **Therapeutic Insights**: Important realizations or breakthroughs
4. **Coping Strategies**: Any techniques or strategies discussed
5. **Progress Indicators**: Signs of growth or areas for continued focus
6. **Session Effectiveness**: How well the session addressed the user's needs

Conversation:
${conversation}

Provide a detailed, professional summary (4-6 paragraphs) that would be valuable for therapeutic continuity and user reflection. Use empathetic, supportive language while maintaining clinical accuracy.`;

    const systemPrompt =
      "You are a professional therapy assistant specializing in creating comprehensive, empathetic session summaries that support therapeutic continuity and user growth.";

    const response = await googleClient.models.generateContent({
      model: googleModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: summaryPrompt,
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        systemInstruction: systemPrompt,
        maxOutputTokens: 2000,
      },
    });

    const responseText = response.text;
    return responseText || "Unable to generate summary at this time.";
  } catch (error) {
    console.error("AI summary generation error:", error);
    return "This session covered important therapeutic topics and provided valuable support. A detailed summary could not be generated at this time, but the conversation contributed to your ongoing mental health journey.";
  }
}

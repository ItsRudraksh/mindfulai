# 🧠 MindfulAI - Advanced AI-Powered Mental Health Platform

<div align="center">

![MindfulAI Logo](https://img.shields.io/badge/MindfulAI-Mental%20Health%20Platform-blue?style=for-the-badge&logo=heart&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Convex-Database-purple?style=flat-square)](https://convex.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer-Motion-black?style=flat-square&logo=framer)](https://www.framer.com/motion/)

**A revolutionary mental health platform combining AI therapy, real-time video sessions, voice calls, intelligent mood tracking, and personalized meditation with advanced global memory management.**

[🚀 Live Demo](https://mindfulai.app)

</div>

---

## 🌟 Platform Overview

MindfulAI represents the next generation of digital mental health support, seamlessly integrating multiple AI-powered therapeutic modalities with sophisticated global memory management and personalized insights. Our platform provides 24/7 mental health support through various channels while maintaining therapeutic continuity and user privacy through an advanced global memory system that learns and adapts to each user's unique needs.

### 🎯 Core Mission

Democratize access to quality mental health support through cutting-edge AI technology, making therapeutic assistance available anytime, anywhere, while maintaining the highest standards of privacy and clinical effectiveness through personalized, context-aware interactions.

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 15 App Router]
        B[React 19 Components]
        C[Tailwind CSS + Framer Motion]
        D[TypeScript]
    end

    subgraph "Authentication & State"
        E[Convex Auth]
        F[Context Providers]
        G[Real-time Subscriptions]
    end

    subgraph "AI Services Layer"
        H[Claude Sonnet 4]
        I[Gemini 2.5 Flash]
        J[Content Guardrails]
        K[Global Memory System]
    end

    subgraph "External AI & Payment Platforms"
        L[Tavus - Video AI]
        M[ElevenLabs - Voice AI]
        N[OpenRouter API]
        RZ[Razorpay - Payments]
    end

    subgraph "Database Layer"
        O[Convex Database]
        P[Real-time Sync]
        Q[ACID Transactions]
        R[Global Memory Storage]
    end

    subgraph "Core Features"
        S[Video Therapy]
        T[Voice Sessions]
        U[Chat Therapy]
        V[Mood Tracking]
        W[Smart Recommendations]
        X[Personalized Meditation]
        Y[Journal System]
        Z[Subscription Management]
    end

    A --> E
    B --> F
    C --> D
    E --> G
    F --> H
    H --> I
    I --> J
    J --> K

    H --> L
    H --> M
    H --> N
    Z --> RZ

    G --> O
    O --> P
    P --> Q
    Q --> R

    K --> S
    K --> T
    K --> U
    K --> V
    K --> W
    K --> X
    K --> Y

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style H fill:#10b981,stroke:#059669,color:#fff
    style O fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style K fill:#f59e0b,stroke:#d97706,color:#fff
    style X fill:#ec4899,stroke:#db2777,color:#fff
    style RZ fill:#2563eb,stroke:#1d4ed8,color:#fff
```

---

## 🚀 Key Features

### 🎥 **Multi-Modal AI Therapy**

- **Video Therapy**: Real-time AI avatar sessions using Tavus technology
- **Voice Conversations**: Natural phone-based therapy via ElevenLabs
- **Text Chat**: Intelligent messaging with context-aware responses
- **Seamless Switching**: Move between modalities while maintaining context

### 🧠 **Advanced Global Memory System**

- **Comprehensive User Profiling**: 5000-token global memory for deep personalization
- **Onboarding Integration**: Captures user background, personality, and preferences
- **Cross-Session Continuity**: Maintains therapeutic relationship across all interactions
- **Intelligent Updates**: Automatically updates from mood entries, sessions, and journal entries
- **Context-Aware Responses**: All AI interactions leverage global memory for personalization

### 🧘‍♀️ **Personalized Meditation**

- **AI-Generated Scripts**: Custom meditation scripts based on global memory
- **Natural Voice Synthesis**: ElevenLabs TTS with natural pauses and soothing delivery
- **Multiple Focus Areas**: Stress relief, anxiety reduction, sleep, focus, emotional balance
- **Adaptive Duration**: 3-20 minute sessions based on user preference
- **Progress Tracking**: Session completion updates global memory for future personalization

### 📊 **Intelligent Mood Tracking**

- **Daily Check-ins**: Simple mood selection with intensity tracking
- **AI-Powered Insights**: Personalized reflections based on mood patterns
- **Smart Recommendations**: Activity suggestions tailored to current emotional state
- **Pattern Recognition**: Identify triggers and emotional trends
- **Global Memory Integration**: Mood patterns inform all future interactions

### 📝 **Advanced Journal System**

- **Rich Text Editor**: TipTap-powered editor with full formatting capabilities
- **Real-time Saving**: Auto-save functionality with conflict resolution
- **Search & Organization**: Full-text search and tagging system
- **Privacy Controls**: Secure, encrypted journal entries
- **Memory Integration**: Journal insights automatically update global memory

### 🌟 **Subscription & Usage Management**

- **Flexible Plans**: Free tier with usage limits and a Pro tier with unlimited access.
- **Secure Payments**: Powered by Razorpay for both recurring subscriptions and one-time purchases.
- **User Dashboard**: Manage subscription status (pause, resume, cancel), view invoices, and track usage.
- **Automated Billing**: Seamless handling of subscription cycles and payments.

### 💌 **Personalized Email Notifications**

- **Daily Check-ins**: Warm, AI-generated emails for Pro users based on their global memory.
- **Weekly Reflections**: In-depth summary of the week's activity and insights.
- **Onboarding & Milestones**: Welcome emails and notifications for subscription events.
- **Deeply Personalized**: All email content is crafted using the user's unique global memory for a truly personal touch.

### 🔒 **Enterprise-Grade Security**

- **End-to-End Encryption**: All conversations and data protected
- **HIPAA Compliance**: Healthcare-grade privacy standards
- **Content Guardrails**: AI safety measures and topic boundaries
- **Secure Authentication**: Multi-provider auth with Convex Auth

---

## 🔄 Global Memory System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant O as Onboarding
    participant GM as Global Memory
    participant AI as AI Services
    participant DB as Database
    participant S as Sessions

    U->>O: Complete Onboarding
    O->>AI: Generate Initial Profile
    AI-->>GM: Create Global Memory (5000 tokens)
    GM->>DB: Store Global Memory

    Note over GM: Global Memory Updates Triggered By:

    U->>S: Complete Mood Entry
    S->>GM: Update with mood patterns

    U->>S: End Video/Voice Session
    S->>GM: Update with session insights

    U->>S: Leave Journal Page
    S->>GM: Update with journal insights

    U->>S: Complete Chat Session
    S->>GM: Update with conversation summary

    GM->>AI: Enhanced Context for All Interactions
    AI-->>U: Personalized Responses

    Note over GM: All AI interactions use<br/>Global Memory for personalization
```

---

## 🧘‍♀️ Meditation System Architecture

```mermaid
flowchart TD
    A[User Selects Preferences] --> B[Duration & Focus Area]
    B --> C[Optional Custom Request]
    C --> D[Fetch Global Memory]

    D --> E[AI Script Generation]
    E --> F[Gemini 2.5 Flash API]
    F --> G[Personalized Script with Pauses]

    G --> H[ElevenLabs TTS]
    H --> I[Natural Voice Synthesis]
    I --> J[Audio Player Interface]

    J --> K{Session Complete?}
    K -->|Yes| L[Update Global Memory]
    K -->|No| M[Continue Playing]

    L --> N[Store Session Data]
    M --> J

    subgraph "Meditation Features"
        O["Natural Pauses (...)"]
        P["Soothing Voice Settings"]
        Q["Progress Tracking"]
        R["Volume Controls"]
        S["Replay Options"]
    end

    I --> O
    I --> P
    J --> Q
    J --> R
    J --> S

    style E fill:#10b981,stroke:#059669,color:#fff
    style H fill:#3b82f6,stroke:#1e40af,color:#fff
    style L fill:#f59e0b,stroke:#d97706,color:#fff
```

---

## 🎭 Mood Tracking & Recommendations System

```mermaid
flowchart TD
    A[User Selects Mood] --> B[Create Mood Entry]
    B --> C{User Choice}

    C -->|Get Recommendations| D[Fetch Today's Mood History]
    C -->|Reflect on Mood| E[Fetch Today's Mood History]

    D --> F[AI Analyzes Patterns + Global Memory]
    E --> G[AI Generates Insight + Global Memory]

    F --> H[Return Top 2 Activities]
    G --> I[Return Personalized Reflection]

    H --> J[Update Entry with Recommendations]
    I --> K[Update Entry with Insight]

    J --> L[User Selects Activity]
    K --> M[User Reflects]

    L --> N[Track Recommendation Usage]
    M --> O[Update Global Memory]

    subgraph "Available Activities"
        P[Video Therapy]
        Q[Voice Call]
        R[Chat Session]
        S[Journaling]
        T[Meditation]
        U[Breathing Exercises]
    end

    H --> P
    H --> Q
    H --> R
    H --> S
    H --> T
    H --> U

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style F fill:#10b981,stroke:#059669,color:#fff
    style G fill:#f59e0b,stroke:#d97706,color:#fff
    style O fill:#ec4899,stroke:#db2777,color:#fff
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    users {
        string _id PK
        string name
        string email
        string image
        string dob
        string profession
        string aboutMe
        boolean onboardingComplete
        string globalMemory
        number createdAt
        object subscription
        object preferences
    }

    sessions {
        string _id PK
        string userId FK
        string type
        string status
        number startTime
        number endTime
        string mood
        string notes
        string elevenlabsConversationId
        string aiSummary
        string voiceSessionSummary
        object metadata
    }

    chatConversations {
        string _id PK
        string userId FK
        string sessionId FK
        string title
        string status
        number messageCount
        string rollingSummary
        array tags
    }

    messages {
        string _id PK
        string userId FK
        string conversationId FK
        string content
        string sender
        number timestamp
        boolean isEdited
        object metadata
    }

    moodEntries {
        string _id PK
        string userId FK
        string mood
        number intensity
        number timestamp
        string notes
        array triggers
        string aiInsight
        array recommendationsUsed
    }

    journalEntries {
        string _id PK
        string userId FK
        string title
        any content
        array tags
        boolean isPrivate
        number createdAt
        number updatedAt
    }

    users ||--o{ sessions : "has many"
    users ||--o{ chatConversations : "has many"
    users ||--o{ messages : "has many"
    users ||--o{ moodEntries : "has many"
    users ||--o{ journalEntries : "has many"
    sessions ||--o{ chatConversations : "belongs to"
    chatConversations ||--o{ messages : "has many"
```

---

## 💳 Subscription & Payment System

```mermaid
flowchart TD
    subgraph "User Flow"
        A[User visits Pricing Page] --> B{Chooses Plan};
        B -->|Free| C[Continues with free tier limits];
        B -->|Pro| D{Selects Payment Type};
        D -->|Subscription| E[Initiate Razorpay Subscription];
        D -->|One-Time| F[Initiate Razorpay Order];
    end

    subgraph "Backend: Razorpay Integration"
        E --> G[Create Subscription via API];
        F --> H[Create Order via API];
        G --> I{Razorpay Checkout};
        H --> I;
    end

    subgraph "Payment & Verification"
        I --> J[User Completes Payment];
        J --> K[Webhook/Callback to Server];
        K --> L[Verify Payment Signature];
    end

    subgraph "System Update"
        L -->|Success| M[Update User Subscription in Convex DB];
        M --> N[Trigger 'Welcome to Pro' Email];
        L -->|Failure| O[Log Error & Notify User];
    end

    subgraph "User Profile Management"
        P[User visits Profile Page] --> Q[View Subscription Status];
        Q --> R{Manage Subscription};
        R -->|Cancel/Pause/Resume| S[Call Razorpay API];
        S --> T[Update Status in Convex DB];
        T --> U[Trigger Cancellation Email];
        R -->|View Invoices| V[Fetch Invoices from Razorpay];
    end

    style M fill:#10b981,stroke:#059669,color:#fff
    style S fill:#3b82f6,stroke:#1e40af,color:#fff
    style O fill:#ef4444,stroke:#b91c1c,color:#fff
```

---

## 💌 Automated Email System

```mermaid
sequenceDiagram
    participant C as Cron Job
    participant DB as Convex Database
    participant AI as Gemini AI
    participant E as Email Service
    participant U as User

    C->>DB: Trigger daily/weekly job
    DB->>AI: Fetch Pro User's Global Memory
    AI->>AI: Generate Personalized Email Content
    AI->>E: Send Email (Daily/Weekly)
    E->>U: Receives personalized reflection

    participant S as System
    S->>DB: User completes onboarding
    DB->>E: Trigger Welcome Email
    E->>U: Receives welcome message

    S->>DB: User upgrades to Pro
    DB->>E: Trigger Pro Welcome Email
    E->>U: Receives Pro confirmation

    S->>DB: User cancels subscription
    DB->>E: Trigger Cancellation Email
    E->>U: Receives cancellation confirmation
```

---

## 🛠️ Technology Stack

### **Frontend**

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.8.3
- **Styling**: Tailwind CSS with custom therapeutic design system
- **Animations**: Framer Motion for smooth micro-interactions
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Rich Text**: TipTap editor with full formatting

### **Backend & Database**

- **Database**: Convex (Real-time, serverless)
- **Authentication**: Convex Auth with multi-provider support
- **Real-time**: Built-in subscriptions and live queries
- **Type Safety**: End-to-end TypeScript
- **Background Jobs**: Convex actions for delayed processing

### **AI & External Services**

- **Primary AI**: Claude Sonnet 4 via OpenRouter
- **Secondary AI**: Gemini 2.5 Flash for meditation scripts
- **Video AI**: Tavus for realistic avatar conversations
- **Voice AI**: ElevenLabs for natural phone conversations and meditation audio
- **Payment Processing**: Razorpay for secure subscriptions and payments
- **Content Safety**: Custom guardrails and topic boundaries

### **Development & Deployment**

- **Package Manager**: npm
- **Linting**: ESLint with Next.js config
- **Styling**: PostCSS with Tailwind
- **Deployment**: Vercel (recommended)

---

## 📦 Installation

### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn package manager
- Convex account
- API keys for external services

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ItsRudraksh/mindfulai.git
cd mindfulai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure Convex
npx convex dev

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
CONVEX_DEPLOYMENT="your-value-here"
NEXT_PUBLIC_CONVEX_URL="your-value-here"
TAVUS_API_KEY="your-value-here"
TAVUS_REPLICA_ID="your-value-here"
TAVUS_PERSONA_ID="your-value-here"
ELEVENLABS_API_KEY="your-value-here"
ELEVENLABS_AGENT_PHONE_NUMBER_ID="your-value-here"
ELEVENLABS_AGENT_ID="your-value-here"
OPENROUTER_API_KEY="your-value-here"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER="your-value-here"
SMTP_PASSWORD="your-value-here"
ENCRYPTION_KEY="your-value-here"
NODE_ENV=development || production
GEMINI_API_KEY="your-value-here"
TAVUS_AWS_ARN="your-value-here"
TAVUS_BUCKET_REGION="your-value-here"
TAVUS_BUCKET_NAME="your-value-here"
RAZORPAY_KEY="your-value-here"
RAZORPAY_KEY_SECRET="your-value-here"
AUTH_GOOGLE_ID="your-value-here"
AUTH_GOOGLE_SECRET="your-value-here"
```

---

## 🎨 Design System

### **Therapeutic Design Principles**

- **Calming Colors**: Soft blues, greens, purples, and warm neutrals
- **Glassmorphism**: Subtle transparency and blur effects
- **Micro-interactions**: Gentle animations that provide feedback
- **Accessibility**: WCAG 2.1 AA compliant design
- **Responsive**: Mobile-first approach with fluid layouts

### **Custom CSS Classes**

```css
.glass-card          /* Glassmorphism card effect */
.therapeutic-hover   /* Gentle hover animations */
.floating-card       /* Elevated card with shadow */
.ripple-effect       /* Button press feedback */
.animate-gentle-pulse /* Subtle pulsing animation */
.backdrop-blur-therapeutic /* 15px blur for glass effects */
```

---

## 🧠 Global Memory System

### **Memory Structure**

The global memory system maintains a comprehensive 5000-token profile for each user, including:

- **Basic Information**: Demographics, profession, calculated age
- **Personality Profile**: Self-description, habits, behavioral patterns
- **Therapeutic History**: Session summaries, progress notes
- **Mood Patterns**: Emotional trends and triggers
- **Interaction Preferences**: Communication style, preferred modalities
- **Session Notes**: Key insights from therapy sessions
- **Journal Insights**: Themes and patterns from journal entries

### **Update Triggers**

Global memory is automatically updated when:

1. **Mood Entries**: After creating mood entries (with recent history context)
2. **Video Sessions**: When sessions end and transcript is available
3. **Voice Sessions**: After call completion with transcript summary
4. **Journal Activity**: When user leaves journal page with recent entries
5. **Chat Sessions**: After conversation summary updates

### **Personalization Impact**

Global memory enhances:

- **Therapy Sessions**: Contextual responses based on user history
- **Meditation Scripts**: Personalized content and focus areas
- **Mood Recommendations**: Activities tailored to user patterns
- **Communication Style**: AI adapts to user's preferred interaction style

---

## 🧘‍♀️ Meditation Feature

### **Personalization Engine**

- **Global Memory Integration**: Scripts generated using comprehensive user profile
- **Adaptive Content**: Meditation style adapts to user's personality and needs
- **Focus Areas**: 7 specialized meditation types (stress, anxiety, sleep, focus, etc.)
- **Duration Flexibility**: 3-20 minute sessions based on user preference

### **Audio Generation**

- **Natural Pauses**: Scripts include " [...] " for breathing spaces
- **ElevenLabs TTS**: High-quality voice synthesis optimized for meditation
- **Voice Settings**: Stability: 50%, Similarity: 75%, Speed: 0.9 for calming delivery
- **Real-time Generation**: Custom audio created for each session

### **User Experience**

- **Intuitive Interface**: Simple preference selection with beautiful animations
- **Full Audio Controls**: Play/pause, restart, volume, progress tracking
- **Session Management**: Replay, create new, or complete with memory update
- **Progress Integration**: Completed sessions update global memory for future personalization

---

## 🔐 Security & Privacy

### **Data Protection**

- All user data encrypted at rest and in transit
- HIPAA-compliant data handling procedures
- Regular security audits and penetration testing
- Minimal data collection principle
- Global memory stored securely with encryption

### **AI Safety**

- Content guardrails prevent off-topic discussions
- Therapeutic focus maintained through system prompts
- Crisis detection and emergency resource routing
- Regular model safety evaluations
- Global memory access controls

### **Privacy Features**

- Anonymous usage options
- Data export and deletion rights
- Transparent privacy policy
- User consent management
- Global memory user control

---

## 📊 Performance Metrics

### **Technical Performance**

- **Page Load Time**: < 2 seconds
- **First Contentful Paint**: < 1.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3 seconds

### **AI Response Times**

- **Chat Messages**: < 3 seconds average
- **Mood Recommendations**: < 5 seconds
- **Global Memory Updates**: < 2 seconds background
- **Meditation Generation**: < 15 seconds (including audio)
- **Voice Call Initiation**: < 10 seconds

---

### **Development Workflow**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### **Code Standards**

- TypeScript strict mode
- ESLint configuration compliance
- Prettier code formatting
- Conventional commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Anthropic** for Claude AI technology
- **Google** for Gemini AI capabilities
- **Tavus** for video AI capabilities
- **ElevenLabs** for voice AI and meditation audio technology
- **Convex** for real-time database infrastructure
- **Open source community** for amazing tools and libraries

---

## 📞 Support & Contact

- **Support Email**: [rudrakshkapoor2004@gmail.com](mailto:rudrakshkapoor2004@gmail.com)
- **Twitter**: [@rudraksh_kapoor](#https://x.com/rudraksh_kapoor)
- **LinkedIn**: [Rudraksh Kapoor](#https://www.linkedin.com/in/rudraksh-kapoor)

---

<div align="center">

**Built with ❤️ for mental health awareness and support**

_Featuring advanced AI personalization through global memory management_

</div>

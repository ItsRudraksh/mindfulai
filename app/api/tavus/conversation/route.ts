import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { tavusClient } from '@/lib/tavus';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, conversationId } = await request.json();

    if (action === 'create') {
      // Create new Tavus conversation
      const conversation = await tavusClient.createConversation({
        replica_id: process.env.TAVUS_REPLICA_ID!,
        conversation_name: `Therapy Session - ${new Date().toISOString()}`,
        properties: {
          max_duration: 3600, // 1 hour
          enable_recording: true,
          language: 'en',
        },
      });

      // Create session record in Convex
      const sessionId = await convex.mutation(api.sessions.createSession, {
        userId: session.user.id as any,
        type: 'video',
        startTime: Date.now(),
      });

      // Update session with Tavus conversation ID
      await convex.mutation(api.sessions.updateSessionMetadata, {
        sessionId,
        metadata: {
          tavusSessionId: conversation.conversation_id,
        },
      });

      return NextResponse.json({
        success: true,
        conversation,
        sessionId,
      });
    }

    if (action === 'end' && conversationId) {
      // End Tavus conversation
      await tavusClient.endConversation(conversationId);

      // Find and update session in Convex
      const sessions = await convex.query(api.sessions.getUserSessions, {
        userId: session.user.id as any,
      });

      const currentSession = sessions.find(s => 
        s.metadata?.tavusSessionId === conversationId && s.status === 'active'
      );

      if (currentSession) {
        await convex.mutation(api.sessions.endSession, {
          sessionId: currentSession._id,
          endTime: Date.now(),
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'status' && conversationId) {
      // Get conversation status from Tavus
      const conversation = await tavusClient.getConversation(conversationId);
      return NextResponse.json({ conversation });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Tavus API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
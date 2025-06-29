import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifySubscriptionPaymentSignature } from "@/lib/razorpay";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const isSignatureValid = verifySubscriptionPaymentSignature({
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

    await convex.mutation(api.users.updateSubscription, {
      userId,
      subscription: {
        plan: "pro",
        planName: "The depressed one",
        status: "active",
        currentPeriodEnd: oneMonthFromNow,
        provider: "razorpay",
        subscriptionId: razorpay_subscription_id,
        limits: {
          videoSessions: -1,
          voiceCalls: -1,
          chatMessages: -1,
        },
        usage: {
          videoSessions: 0,
          voiceCalls: 0,
          chatMessages: 0,
          lastResetDate: now,
        },
      },
    });

    await convex.mutation(api.paymentTransactions.createPaymentTransaction, {
      userId,
      provider: "razorpay",
      transactionId: razorpay_payment_id,
      orderId: razorpay_subscription_id, // Using subscription_id as orderId here for tracking
      amount: 35000,
      currency: "INR",
      status: "captured",
      planName: "The depressed one",
      metadata: {
        razorpay_signature,
        verifiedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
    });
  } catch (error) {
    console.error("Subscription verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    );
  }
}

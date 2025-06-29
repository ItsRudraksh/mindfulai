import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay configuration missing" },
        { status: 500 }
      );
    }

    const {
      razorpay_order_id,
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

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Payment is verified, update user subscription
    const now = Date.now();
    const oneMonthFromNow = now + 30 * 24 * 60 * 60 * 1000;

    // Update user subscription to pro using internal mutation
    await convex.mutation(api.users.updateSubscription, {
      userId,
      subscription: {
        plan: "pro",
        planName: "The depressed one",
        status: "active",
        currentPeriodEnd: oneMonthFromNow,
        provider: "razorpay",
        subscriptionId: razorpay_payment_id,
        limits: {
          videoSessions: -1, // Unlimited
          voiceCalls: -1, // Unlimited
          chatMessages: -1, // Unlimited
        },
        usage: {
          videoSessions: 0,
          voiceCalls: 0,
          chatMessages: 0,
          lastResetDate: now,
        },
      },
    });

    // Create payment transaction record using internal mutation
    await convex.mutation(api.paymentTransactions.createPaymentTransaction, {
      userId,
      provider: "razorpay",
      transactionId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: 1200, // $12 in cents
      currency: "USD",
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
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

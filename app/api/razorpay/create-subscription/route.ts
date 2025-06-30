import { NextRequest, NextResponse } from "next/server";
import { createSubscription } from "@/lib/razorpay";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_KEY_ID) {
      return NextResponse.json(
        { error: "Razorpay configuration missing" },
        { status: 500 }
      );
    }

    const subscriptionData = {
      plan_id: "plan_QnOsvZeQp2d6Ht",
      total_count: 12,
      quantity: 1,
      customer_notify: false,
      notes: {
        description: "MindfulAI Pro Subscription",
      },
    };

    const subscription = await createSubscription(subscriptionData);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

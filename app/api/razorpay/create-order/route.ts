import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_KEY_ID) {
      return NextResponse.json(
        { error: "Razorpay configuration missing" },
        { status: 500 }
      );
    }

    const { planName } = await request.json();

    if (planName !== "The depressed one") {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const orderData = {
      amount: 35000, // ₹350 in paise (350 * 100)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        planName: planName,
        description: "MindfulAI Pro Subscription",
      },
    };

    const order = await createOrder(orderData);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}

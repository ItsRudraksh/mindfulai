import { NextRequest, NextResponse } from "next/server";
import razorpay, {
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  updateSubscription,
  fetchSubscriptionInvoices,
} from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const { subscription_id, action, new_plan_id } = await request.json();

    if (!subscription_id) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    if (action === "cancel") {
      const cancelledSubscription = await cancelSubscription(subscription_id);
      return NextResponse.json({ success: true, data: cancelledSubscription });
    }

    if (action === "pause") {
      const pausedSubscription = await pauseSubscription(subscription_id);
      return NextResponse.json({ success: true, data: pausedSubscription });
    }

    if (action === "resume") {
      const resumedSubscription = await resumeSubscription(subscription_id);
      return NextResponse.json({ success: true, data: resumedSubscription });
    }

    if (action === "update" && new_plan_id) {
      const updatedSubscription = await updateSubscription(
        subscription_id,
        new_plan_id
      );
      return NextResponse.json({ success: true, data: updatedSubscription });
    }

    if (action === "invoices") {
      const invoices = await fetchSubscriptionInvoices(subscription_id);
      return NextResponse.json({ success: true, data: invoices });
    }

    if (action === "portal") {
      // const portalLink = await razorpay.subscriptions.createAddon({
      //   subscription_id: subscription_id,
      //   addon: {
      //     item: {
      //       name: "Customer Portal",
      //       amount: 0,
      //       currency: "INR",
      //     },
      //   },
      // });
      return NextResponse.json({
        success: true,
        // portal_url: portalLink.short_url,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing Razorpay subscription:", error);
    return NextResponse.json(
      { error: "Failed to manage subscription" },
      { status: 500 }
    );
  }
}

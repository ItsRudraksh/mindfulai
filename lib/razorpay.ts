import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: `${process.env.RAZORPAY_KEY}`,
  key_secret: `${process.env.RAZORPAY_KEY_SECRET}`,
});

export const createOrder = async (options: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string | number>;
}) => {
  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new Error("Failed to create Razorpay order");
  }
};

export const verifyPaymentSignature = (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("Razorpay key secret is not defined");
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpay_signature;
};

export const verifySubscriptionPaymentSignature = (data: {
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } =
    data;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("Razorpay key secret is not defined");
  }

  const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpay_signature;
};

export const createPlan = async (options: {
  period: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  item: {
    name: string;
    amount: number;
    currency: string;
    description?: string;
  };
}) => {
  try {
    const plan = await razorpay.plans.create(options);
    return plan;
  } catch (error) {
    console.error("Error creating Razorpay plan:", error);
    throw new Error("Failed to create Razorpay plan");
  }
};

export const createSubscription = async (options: {
  plan_id: string;
  total_count: number;
  quantity?: number;
  start_at?: number;
  expire_by?: number;
  customer_notify?: boolean;
  addons?: any[];
  notes?: Record<string, string | number>;
}) => {
  try {
    const subscription = await razorpay.subscriptions.create(options);
    return subscription;
  } catch (error) {
    console.error("Error creating Razorpay subscription:", error);
    throw new Error("Failed to create Razorpay subscription");
  }
};

export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtCycleEnd: boolean = false
) => {
  try {
    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId,
      cancelAtCycleEnd
    );
    return subscription;
  } catch (error) {
    console.error("Error canceling Razorpay subscription:", error);
    throw new Error("Failed to cancel Razorpay subscription");
  }
};

export const pauseSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await razorpay.subscriptions.pause(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error pausing Razorpay subscription:", error);
    throw new Error("Failed to pause Razorpay subscription");
  }
};

export const resumeSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await razorpay.subscriptions.resume(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error resuming Razorpay subscription:", error);
    throw new Error("Failed to resume Razorpay subscription");
  }
};

export const updateSubscription = async (
  subscriptionId: string,
  planId: string
) => {
  try {
    const subscription = await razorpay.subscriptions.update(subscriptionId, {
      plan_id: planId,
      schedule_change_at: "cycle_end",
    });
    return subscription;
  } catch (error) {
    console.error("Error updating Razorpay subscription:", error);
    throw new Error("Failed to update Razorpay subscription");
  }
};

export const fetchSubscriptionInvoices = async (subscriptionId: string) => {
  try {
    const invoices = await razorpay.invoices.all({
      subscription_id: subscriptionId,
    });
    console.log("invoices: ", invoices);
    return invoices;
  } catch (error) {
    console.error("Error fetching Razorpay subscription invoices:", error);
    throw new Error("Failed to fetch subscription invoices");
  }
};

export default razorpay;

import { Webhook } from "svix";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Direct Convex client - no need for HTTP endpoint
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  console.log("[Webhook] Received request");

  // Get Clerk webhook secret
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!CLERK_WEBHOOK_SECRET) {
    console.error("[Webhook] Missing CLERK_WEBHOOK_SECRET");
    return new Response("Server configuration error", { status: 500 });
  }

  // Get svix headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("[Webhook] Missing svix headers");
    return new Response("Missing svix headers", { status: 400 });
  }

  // Verify webhook
  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: { type: string; data: Record<string, unknown> };
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("[Webhook] Verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;
  const data = evt.data;
  console.log(`[Webhook] Event: ${eventType}`);
  console.log(`[Webhook] Data keys: ${Object.keys(data)}`);

  // Handle subscription events
  if (eventType.startsWith("subscription.")) {
    console.log("[Webhook] Full payload:", JSON.stringify(data, null, 2));

    // Try to get user identifier from various fields
    const clerkUserId = 
      (data.user_id as string) ||
      (data.subscriber_user_id as string) ||
      ((data.subscriber as Record<string, unknown>)?.user_id as string) ||
      ((data.user as Record<string, unknown>)?.id as string) ||
      null;

    // Try to get email
    const email =
      ((data.subscriber as Record<string, unknown>)?.email_address as string) ||
      ((data.user as Record<string, unknown>)?.email as string) ||
      (data.email as string) ||
      null;

    console.log(`[Webhook] Found clerkUserId: ${clerkUserId}, email: ${email}`);

    if (!clerkUserId && !email) {
      console.error("[Webhook] No user identifier found");
      // Return 200 to prevent Clerk from retrying
      return new Response("No user identifier, skipping", { status: 200 });
    }

    // Determine plan from status
    const status = data.status as string | undefined;
    const plan: "free" | "pro" = 
      status === "active" || status === "trialing" ? "pro" : "free";

    console.log(`[Webhook] Status: ${status}, Plan: ${plan}`);

    // Update user in Convex
    try {
      const result = await convex.mutation(api.users.updatePlanByIdentifier, {
        clerkUserId: clerkUserId || undefined,
        email: email || undefined,
        plan,
      });
      console.log("[Webhook] Convex result:", result);
      return new Response(JSON.stringify({ success: true, result }), { status: 200 });
    } catch (error) {
      console.error("[Webhook] Convex error:", error);
      // Return 200 anyway to prevent infinite retries
      return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 200 });
    }
  }

  return new Response("Event ignored", { status: 200 });
}

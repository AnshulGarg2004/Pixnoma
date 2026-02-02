import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient } from "@clerk/nextjs/server";

// Convex HTTP endpoint URL - update this after deployment
const CONVEX_HTTP_URL = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
  ".convex.cloud",
  ".convex.site"
);

export async function POST(req: Request) {
  // Get Clerk webhook secret from environment
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!CLERK_WEBHOOK_SECRET) {
    console.error("[Webhook] Missing CLERK_WEBHOOK_SECRET");
    return new Response("Server configuration error", { status: 500 });
  }

  // Get svix headers for verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("[Webhook] Missing svix headers");
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get and verify the webhook payload
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  
  // Clerk webhook event type (using any to support billing events not in SDK types)
  let evt: { type: string; data: Record<string, any> };

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as { type: string; data: Record<string, any> };
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Extract event type and data
  const eventType = evt.type;
  console.log(`[Webhook] Received event: ${eventType}`);

  if (!CONVEX_HTTP_URL) {
    console.error("[Webhook] Missing NEXT_PUBLIC_CONVEX_URL");
    return new Response("Server configuration error", { status: 500 });
  }

  // Handle subscription events from Clerk Billing
  if (
    eventType === "subscription.created" ||
    eventType === "subscription.updated" ||
    eventType === "subscription.deleted"
  ) {
    const subscription = evt.data;
    console.log("Subcsription: ", subscription);
    
    
    // Extract user ID - Clerk may store it in different fields
    const clerkId =
      subscription.user_id ??
      subscription.userId ??
      subscription.user?.id ??
      subscription.subscriber_id ??
      subscription.subscriber?.id ??
      subscription.customer_id ??
      subscription.customer?.id ??
      null;
    if (!clerkId) {
      console.error("[Webhook] No user_id in subscription event", {
        keys: Object.keys(subscription ?? {}),
      });
      return new Response("Missing user_id", { status: 400 });
    }

    // Determine the plan based on subscription status
    let plan: "free" | "pro" = "free";
    const status = subscription.status as string | undefined;
    const proStatuses = new Set(["active", "trialing"]);
    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      // Treat active or trialing as Pro; anything else downgrades to free
      plan = status && proStatuses.has(status) ? "pro" : "free";
      console.log(`[Webhook] Subscription ${eventType}: status=${status}, plan=${plan}`);
    } else if (eventType === "subscription.deleted") {
      // Subscription cancelled/deleted = downgrade to free
      plan = "free";
      console.log(`[Webhook] Subscription deleted, downgrading to free`);
    }

    // Fetch user email from Clerk for fallback matching in Convex
    let email: string | null = null;
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);
      const primaryEmailId = clerkUser.primaryEmailAddressId;
      const primaryEmail = clerkUser.emailAddresses.find(
        (addr: { id: string; emailAddress: string }) => addr.id === primaryEmailId,
      );
      email = primaryEmail?.emailAddress ?? null;
    } catch (error) {
      console.error("[Webhook] Failed to fetch Clerk user email:", error);
    }

    // Call Convex HTTP action to update user plan
    try {
      const convexResponse = await fetch(`${CONVEX_HTTP_URL}/clerk-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": process.env.CONVEX_WEBHOOK_SECRET || "",
        },
        body: JSON.stringify({ clerkId, plan, email }),
      });

      const result = await convexResponse.json();
      console.log(`[Webhook] Convex update result:`, result);

      if (!convexResponse.ok) {
        console.error("[Webhook] Convex update failed:", result);
        return new Response("Failed to update Convex", { status: 500 });
      }
    } catch (error) {
      console.error("[Webhook] Error calling Convex:", error);
      return new Response("Failed to call Convex", { status: 500 });
    }
  }

  // Handle user.updated event (for metadata-based plan changes)
  if (eventType === "user.updated") {
    const { id, public_metadata } = evt.data;
    const metadataPlan = public_metadata?.plan as string | undefined;

    if (metadataPlan === "pro" || metadataPlan === "free") {
      console.log(`[Webhook] User metadata plan: ${metadataPlan}`);

      try {
        const emailAddress = evt.data?.email_addresses?.find(
          (addr: { id: string }) => addr.id === evt.data?.primary_email_address_id,
        )?.email_address as string | undefined;
        const convexResponse = await fetch(`${CONVEX_HTTP_URL}/clerk-webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.CONVEX_WEBHOOK_SECRET || "",
          },
          body: JSON.stringify({ clerkId: id, plan: metadataPlan, email: emailAddress }),
        });

        const result = await convexResponse.json();
        console.log(`[Webhook] Convex update result:`, result);
      } catch (error) {
        console.error("[Webhook] Error calling Convex:", error);
      }
    }
  }

  return new Response("Webhook processed", { status: 200 });
}

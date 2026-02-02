import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Webhook endpoint for Clerk subscription/user updates
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook secret
    const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;
    const providedSecret = request.headers.get("x-webhook-secret");

    if (!webhookSecret || providedSecret !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { clerkId, plan, email } = body as {
      clerkId: string;
      plan: "free" | "pro";
      email?: string | null;
    };

    if (!clerkId || !plan) {
      return new Response("Missing clerkId or plan", { status: 400 });
    }

    // Call the internal mutation to update the user
    try {
      await ctx.runMutation(internal.users.updateUserPlan, {
        clerkId,
        plan,
        email: email ?? undefined,
      });

      return new Response(
        JSON.stringify({ success: true, clerkId, plan }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error updating user plan:", error);
      return new Response(
        JSON.stringify({ success: false, error: String(error) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;

import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if we've already stored this identity before.
    // Note: If you don't want to define an index right away, you can use
    // ctx.db.query("users")
    //  .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
    //  .unique();
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user !== null) {
        // Patch user if data has changed (including backfilling clerkId for existing users)
        const updates: Partial<{
          name: string;
          clerkId: string;
        }> = {};
      
        if (user.name !== identity.name) {
          updates.name = identity.name;
        }
      
        // Backfill clerkId for existing users who don't have it
        if (!user.clerkId && identity.subject) {
          updates.clerkId = identity.subject;
        }
      
        if (Object.keys(updates).length > 0) {
          await ctx.db.patch(user._id, updates);
        }
      
      return user._id;
    }
    // If it's a new identity, create a new `User`.
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email : identity.email ?? "",
      tokenIdentifier: identity.tokenIdentifier,
      clerkId: identity.subject,
      plan : "free",
      projectUsed : 0,
      exportsThisMonth : 0,
      createdAt : Date.now(),
      lastActiveAt : Date.now(),
    });
  },
});

export const getCurrentUser = query({
    handler : async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) {
            // throw new Error("User not authenticated")
            return null;
        }

        const user = await ctx.db.query("users").withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier) ).unique();

        if(!user) {
            throw new Error("User does not exist");
        }

        return user;
    }
})

// Internal mutation called by webhook to update user plan
export const updateUserPlan = internalMutation({
  args: {
    clerkId: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro")),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, plan, email }) => {
    // Find user by clerkId if provided
    let user = null;
    if (clerkId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .unique();
    }

    // Fallback: find by email
    if (!user && email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
    }

    if (!user) {
      throw new Error(`User not found for clerkId ${clerkId ?? "(none)"}`);
    }

    // Update the user's plan and backfill clerkId if needed
    const updates: { plan: "free" | "pro"; clerkId?: string } = { plan };
    if (!user.clerkId && clerkId) {
      updates.clerkId = clerkId;
    }

    await ctx.db.patch(user._id, updates);

    console.log(`Updated user ${user.email} to ${plan} plan`);
    return { success: true, userId: user._id, plan };
  },
});
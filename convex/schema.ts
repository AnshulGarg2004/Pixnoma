import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email : v.string(),
        tokenIdentifier: v.string(),
        imageUrl : v.optional(v.string()),

        plan : v.union(v.literal("free"), v.literal("pro")),

        projectUsed : v.number(),
        exportsThisMonth : v.number(),
        createdAt : v.number(),
        lastActiveAt : v.number(),

    }).index("by_token", ["tokenIdentifier"]).index("by_email", ["email"]).searchIndex("search_name", {searchField : "name"}).searchIndex("search_email", {searchField : "email"}),


    projects : defineTable({
        // basic info
        userId : v.id('users'),
        title : v.string(),

        // fibre.js canvas dimension
        canvasState : v.any(),
        height : v.number(),
        width : v.number(),

        // image pipeline
        originalImageUrl : v.optional(v.string()),
        currentImageUrl : v.optional(v.string()),
        thumbnailUrl : v.optional(v.string()),

        // imagekit transformation state
        activeTransformation : v.optional(v.string()),

        // ai featured state
        backgroundRemoved : v.optional(v.boolean()),

        // organisation
        folderId : v.optional(v.id('folders')),

        // timestamps
        createdAt : v.number(),
        updatedAt : v.number(),


    }).index('by_user', ['userId']).index('by_user_updated', ['userId', 'updatedAt']).index('by_folder', ['folderId']),

    folders : defineTable({
        name : v.string(),
        userId : v.id('users'),

        createdAt : v.number(),
    
    }).index('by_user', ['userId']),


})


/*
    free plan : 3 projects, 20 exports/month
    pro plan : unlimited projects/exports/month and all ai features
*/ 
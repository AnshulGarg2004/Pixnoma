import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const create: ReturnType<typeof mutation> = mutation({
    args: v.object({
        title: v.string(),
        originalImageUrl: v.optional(v.string()),
        currentImageUrl: v.optional(v.string()),
        thumbnailUrl: v.string(),
        width: v.number(),
        height: v.number(),
        canvasState: v.optional(v.any())
    }),
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getCurrentUser);
        console.log("User got: ", user);

        if (!user) {
            throw new Error("Not authenticated");
        }

        if (user.plan === 'free') {
            const projectCount = await ctx.db.query('projects').withIndex('by_user', (q) => q.eq('userId', user._id)).collect()
            if (projectCount.length >= 3) {
                throw new Error("Free plan is limited to 3 projects. Upgrade to Pro to have unlimited projects");
            }
        }

        console.log("Args in project: ", args);


        const projectId = await ctx.db.insert('projects', {
            title: args.title,
            userId: user._id,
            height: args.height,
            width: args.width,
            currentImageUrl: args.currentImageUrl,
            thumbnailUrl: args.thumbnailUrl,
            originalImageUrl: args.originalImageUrl,
            canvasState: args.canvasState,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        console.log("Content of projectId: ", projectId);


        await ctx.db.patch(user._id, {
            projectUsed: user.projectUsed + 1,

            lastActiveAt: Date.now()
        })

        return projectId;
    }
})


export const getUserProjects: ReturnType<typeof query> = query({
    handler: async (ctx): Promise<any> => {
        const user = await ctx.runQuery(api.users.getCurrentUser);
        if (!user) {
            throw new Error("Not authenticated");
        }
        const projects = await ctx.db.query('projects').withIndex('by_user_updated', (q) => q.eq('userId', user._id)).order('desc').collect();

        return projects;
    }
})

export const deleteUserProject: ReturnType<typeof mutation> = mutation({
    args: v.object({ projectId: v.id('projects') }),
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        const user = await ctx.runQuery(api.users.getCurrentUser);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error("Project does not exist");
        }
        if (!user || project.userId !== user._id) {
            throw new Error("Not authorized to delete this project");
        }

        await ctx.db.delete(args.projectId);

        await ctx.db.patch(user._id, {
            projectUsed: Math.max(0, user.projectUsed - 1),
            lastActiveAt: Date.now()
        });

        return { success: true };
    }
})

export const getProjects: ReturnType<typeof query> = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getCurrentUser);
        const project = await ctx.db.get(args.projectId);
        if (!user) {
            console.log("User not found");
            throw new Error("User does not exist");
        }

        if (!project) {
            console.log("Project does not exists");
            throw new Error('Project does not exist');
        }

        if (project.userId !== user._id) {
            throw new Error("Access denied!");
        }

        return project;
    }
})



export const updateProject : ReturnType<typeof mutation> = mutation({
    args : v.object({
        projectId : v.id('projects'),
        canvasState :v.optional( v.any()),
        height : v.optional(v.number()),
        width : v.optional(v.number()),
        thumbnailUrl : v.optional(v.string()),
        currentImageUrl : v.optional(v.string()),
        originalImageUrl : v.optional(v.string()),
        backgroundRemoved  : v.optional(v.boolean()),
        activeTransformation : v.optional(v.string()),
    }),
    handler : async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getCurrentUser);
        const project = await ctx.db.get(args.projectId);
        if (!user) {
            console.log("User not found");
            throw new Error("User does not exist");
        }

        if (!project) {
            console.log("Project does not exists");
            throw new Error('Project does not exist');
        }

        if (project.userId !== user._id) {
            throw new Error("Access denied!");
        }

        const updatedData  = {
            updatedAt : Date.now(),
        } as Record<string, any>

        if(args.height !== undefined) {
            updatedData.height = args.height;
        }
        if(args.width !== undefined) {
            updatedData.width = args.width;
        }
        if(args.backgroundRemoved !== undefined) {
            updatedData.backgroundRemoved = args.backgroundRemoved;
        }
        if(args.thumbnailUrl !== undefined) {
            updatedData.thumbnailUrl = args.thumbnailUrl;
        }
        if(args.currentImageUrl !== undefined) {
            updatedData.currentImageUrl = args.currentImageUrl;
        }
        if(args.originalImageUrl !== undefined) {
            updatedData.originalImageUrl = args.originalImageUrl;
        }
        if(args.activeTransformation !== undefined) {
            updatedData.activeTransformation = args.activeTransformation;
        }
        if(args.canvasState !== undefined) {
            updatedData.canvasState = args.canvasState;
        }

        await ctx.db.patch(args.projectId, updatedData);

        return args.projectId;

        
    }
})
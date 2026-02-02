import { useAuth } from "@clerk/nextjs";
import { useConvexQuery } from "./use-convex-query";
import { api } from "@/convex/_generated/api";
import { TruckElectric } from "lucide-react";

interface ConvexUser {
    _id: string;
    _creationTime: number;
    name: string;
    email: string;
    tokenIdentifier: string;
    imageUrl?: string;
    plan: "free" | "pro";
    projectUsed: number;
    exportsThisMonth: number;
    createdAt: number;
    lastActiveAt: number;
}

export function usePlanAccess() {
    const { userId } = useAuth();
    const { data: user } = useConvexQuery(api.users.getCurrentUser, undefined) as { data: ConvexUser | null };
    
    const isPro = user?.plan === 'pro' || false;
    const isFree = !isPro;

    type ToolId = "resize" | "crop" | "adjust" | "text" | "ai_extender" | "ai_edit" | "background";
    
    const planAccess : Record<ToolId, boolean> = {
        // Free
        resize : true,
        crop : true,
        adjust : true,
        text : true,

        // pro
        ai_extender : isPro,
        ai_edit : isPro,
        background : isPro
    }

    const hasAccess = (toolId : ToolId) => {
        return planAccess[toolId] === true;
    }

    const getRestrictedTools = () => {
        return Object.entries(planAccess).filter(([_, hasAcce]) => !hasAcce).map(([toolId]) => toolId);
    }

    const canCreateProject = (currentProjectCount : number) => {
        if(isPro) return true;
        return currentProjectCount < 3;
    }

    const canExport = (currentProjectExport : number) => {
        if(isPro) return true;
        return currentProjectExport < 20;
    }

    return { userPlan : isPro ? 'pro' : 'free', hasAccess, isFree, getRestrictedTools, canCreateProject, canExport, planAccess, isPro};
}
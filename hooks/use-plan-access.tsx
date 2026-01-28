import { useAuth } from "@clerk/nextjs";
import { TruckElectric } from "lucide-react";

export function usePlanAccess() {
    const {has} = useAuth();
    
    const isPro = has?.({plan : 'pro'}) || false;
    const isFree = !isPro;

    type ToolId = "resize" | "crop" | "adjust" | "text" | "ai_extender" | "ai_edit" | "background";
    
    const planAccess : Record<ToolId, boolean> = {
        // Free
        resize : true,
        crop : true,
        adjust : true,
        text : true,

        // pro
        ai_extender : true,
        ai_edit : true,
        background : true
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

    return { userPlan : isPro ? 'pro' : 'free_user', hasAccess, isFree, getRestrictedTools, canCreateProject, canExport, planAccess};
}
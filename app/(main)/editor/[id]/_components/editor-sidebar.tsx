import { Project } from '@/app/(main)/dashboard/_components/project-card'
import { useCanvas } from '@/context/use-context';
import { Crop, Expand, Eye, Maximize2, Palette, Sliders, Text } from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import React from 'react'
import CropContent from './tools/crop';
import AdjustControl from './tools/adjust';
import ResizeControls from './tools/resize';
import AiBackground from './tools/ai-background';
import TextControl from './tools/text';
import AiExtendTool from './tools/ai-extend';
import AIEditTool from './tools/ai-edit';

interface EditorSidebarProps {
    project: Project;
}

interface RenderToolConfigProps {
    activeTool : ToolId,
    project : Project
}




type ToolId = "resize" | "crop" | "adjust" | "ai_edit" | "text" | "ai_extender" | "background";


const TOOL_CONFIGS : Record<ToolId , {
    title : string,
    icon : LucideIcon,
    description : string

}> = {
    resize: {
        title: "Resize",
        icon: Expand,
        description: "Change project dimensions",
    },
    crop: {
        title: "Crop",
        icon: Crop,
        description: "Crop and trim your image",
    },
    adjust: {
        title: "Adjust",
        icon: Sliders,
        description: "Brightness, contrast, and more (Manual saving required)",
    },
    background: {
        title: "Background",
        icon: Palette,
        description: "Remove or change background",
    },
    ai_extender: {
        title: "AI Image Extender",
        icon: Maximize2,
        description: "Extend image boundaries with AI",
    },
    text: {
        title: "Add Text",
        icon: Text,
        description: "Customize in Various Fonts",
    },
    ai_edit: {
        title: "AI Editing",
        icon: Eye,
        description: "Enhance image quality with AI",
    },
};


const EditorSidebar = ({ project }: EditorSidebarProps) => {
    const {activeTool} = useCanvas();

    const toolConfig  = TOOL_CONFIGS[activeTool as ToolId];
    
    if(!toolConfig) return;
    
    const Icon = toolConfig.icon;
    return (
        <div className='flex flex-col border-r min-w-96' >
            <div className='p-4 border-b'>
                <div className='flex gap-3 items-center'>
                    <Icon className='h-5 w-5 text-white' />
                    <h2 className='font-semibold text-white text-lg'>{toolConfig.title}</h2>
                </div>

                <p className='text-sm mt-1 text-white'>{toolConfig.description}</p>
            </div>

            <div className='p-4 flex-1 overflow-y-scroll'>
                {renderToolConfig(activeTool, project)}
            </div>
        </div>
    )
}
const renderToolConfig = (activeTool : string | null, project : Project) => {
    switch(activeTool) {
        case "crop" : 
        return <CropContent/>

        case "resize" : 
        return <ResizeControls project={project}/>
        
        case "adjust" : 
        return <AdjustControl/>

        case "background" :
            return <AiBackground project={project}/>
        case "text" :
            return <TextControl />
            case "ai_extender" :
                return <AiExtendTool project={project} />
                case "ai_edit" :
                    return <AIEditTool project={project}/>
    }

}

export default EditorSidebar

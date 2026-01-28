'use client'
import { Project } from '@/app/(main)/dashboard/_components/project-card';
import { Button } from '@/components/ui/button';
import UpgradModel from '@/components/UpgradModel';
import { useCanvas } from '@/context/use-context';
import { usePlanAccess } from '@/hooks/use-plan-access';
import { ArrowLeft, Crop, Expand, Eye, Icon, Lock, Maximize2, Palette, RotateCcw, RotateCw, Sliders, Text } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

interface TopbarProps {
    project : Project;
}

type ToolsId = "resize" | "crop" | "adjust" | "text" | "background" | "ai_extender" | "ai_edit";

type Tool = {
  id: ToolsId;
  label: string;
  icon: LucideIcon;   // ✅ THIS FIXES iconNode
  proOnly?: boolean;
  isActive?: boolean;
};

const TOOLS : Tool[] = [
  {
    id: "resize",
    label: "Resize",
    icon: Expand,
    isActive: true,
  },
  {
    id: "crop",
    label: "Crop",
    icon: Crop,
  },
  {
    id: "adjust",
    label: "Adjust",
    icon: Sliders,
  },
  {
    id: "text",
    label: "Text",
    icon: Text,
  },
  {
    id: "background",
    label: "AI Background",
    icon: Palette,
    proOnly: true,
  },
  {
    id: "ai_extender",
    label: "AI Image Extender",
    icon: Maximize2,
    proOnly: true,
  },
  {
    id: "ai_edit",
    label: "AI Editing",
    icon: Eye,
    proOnly: true,
  },
];

const EXPORT_FORMATS = [
  {
    format: "PNG",
    quality: 1.0,
    label: "PNG (High Quality)",
    extension: "png",
  },
  {
    format: "JPEG",
    quality: 0.9,
    label: "JPEG (90% Quality)",
    extension: "jpg",
  },
  {
    format: "JPEG",
    quality: 0.8,
    label: "JPEG (80% Quality)",
    extension: "jpg",
  },
  {
    format: "WEBP",
    quality: 0.9,
    label: "WebP (90% Quality)",
    extension: "webp",
  },
];

const EditorTopbar = ({project} : TopbarProps) => {
    const router = useRouter();
    const [upgradedModel, setUpgradedModel] = useState<boolean>(false);
    const [restrictedTools, setRestrictedTools] = useState<"ai_extender" | "ai_edit" | "background" | "exports" | null>(null);
    const {activeTool, onToolChange, canvasEditor} = useCanvas(); 
    const {hasAccess, isFree, canExport} = usePlanAccess();

    const handleBackToDashboard = () => {
        router.push('/dashboard');
    }

    const handleToolChange = (toolId: ToolsId) => {
        if(!hasAccess(toolId)) {
            if (toolId === 'background' || toolId === 'ai_extender' || toolId === 'ai_edit') {
                setRestrictedTools(toolId);
            }
            setUpgradedModel(true);
            return;
        }
        onToolChange(toolId);
    }

    const handleExport = () => {
        if (!canExport) {
            setRestrictedTools('exports');
            setUpgradedModel(true);
            return;
        }
        // Handle actual export logic here
    }
  return (
    <>
    <div className='px-6 py-3 border-b'>
        <div className='flex items-center justify-between mb-4'>

            <Button onClick={handleBackToDashboard} variant={'ghost'} size={'sm'} className='text-white hover:text-gray-300'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                All Projects
                </Button>

                <h1 className="font-extrabold capitalize">{project.title}</h1>
                <div>Right actions </div>
        </div>

        <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
                {TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    const hasToolAccess = hasAccess(tool.id);
                    return (
                        <Button className={`gap-2 relative 
                        ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-white hover:bg-gray-100 hover:text-gray-300'}
                        ${!hasToolAccess ? 'opacity-60' : ''}`}
                         key={tool.id} variant={isActive ? 'default' : 'ghost'} size={'sm'} onClick={() =>handleToolChange(tool.id)} >
                            <Icon className='h-4 w-4' />  {tool.label} 
                            {tool.proOnly && !hasToolAccess && (
                                <Lock className='h-3 w-3 ml-1 text-amber-300' />
                            )}
                        </Button>
                    )
                })}
            </div>


            <div className='flex gap-1 items-center'>
                <Button className='text-white' variant={'ghost'} size={'sm'}>
                    <RotateCcw className='h-4 w-4'/>
                </Button>

                <Button className='text-white' variant={'ghost'} size={'sm'}>
                    <RotateCw className='h-4 w-4'/>
                </Button>

                <Button className='text-white' variant={'ghost'} size={'sm'} onClick={handleExport}>
                    Export
                </Button>
            </div>

            <UpgradModel isOpen={upgradedModel} onClose={() => {
                setUpgradedModel(false);
                setRestrictedTools(null);
            }} 
            restrictedTool={restrictedTools}
            reason={
                restrictedTools === "background" ? 'AI Background Removal is a Pro feature. Upgrade to unlock this tool.' :
                restrictedTools === "ai_extender" ? 'AI Image Extender is a Pro feature. Upgrade to unlock this tool.' :
                restrictedTools === "ai_edit" ? 'AI Editing is a Pro feature. Upgrade to unlock this tool.' :
                restrictedTools === "exports" ? 'Free plan is limited to 20 exports. Upgrade to Pro for unlimited exports.' :
                ''
            }
            />
        </div>
    </div>
    </>
  )
}

export default EditorTopbar

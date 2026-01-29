'use client'
import { Project } from '@/app/(main)/dashboard/_components/project-card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UpgradModel from '@/components/UpgradModel';
import { useCanvas } from '@/context/use-context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query';
import { usePlanAccess } from '@/hooks/use-plan-access';
import { User } from '@clerk/nextjs/server';
import { FabricImage } from 'fabric';
import { ArrowLeft, Crop, Download, Expand, Eye, FileImage, Icon, Loader2, Lock, Maximize2, Palette, RefreshCcw, RotateCcw, RotateCw, Save, Sliders, Text } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'path';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

interface TopbarProps {
  project: Project;
}

type ToolsId = "resize" | "crop" | "adjust" | "text" | "background" | "ai_extender" | "ai_edit";

type Tool = {
  id: ToolsId;
  label: string;
  icon: LucideIcon;   // ✅ THIS FIXES iconNode
  proOnly?: boolean;
  isActive?: boolean;
};

const TOOLS: Tool[] = [
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


interface ExportImageProps {
  format: string;
  quality: number;
  label: string;
  extension: string;

}

const EXPORT_FORMATS: ExportImageProps[] = [
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

const EditorTopbar = ({ project }: TopbarProps) => {
  const router = useRouter();
  const [upgradedModel, setUpgradedModel] = useState<boolean>(false);
  const [restrictedTools, setRestrictedTools] = useState<"ai_extender" | "ai_edit" | "background" | "exports" | null>(null);
  const { activeTool, onToolChange, canvasEditor } = useCanvas();
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const { hasAccess, isFree, canExport } = usePlanAccess();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const { mutate: updateProject } = useConvexMutation(api.projects.updateProject);
  const [isUndoRedo, setIsUndoRedo] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const { data: user } = useConvexQuery(api.users.getCurrentUser, undefined);

  const MAX_HISTORY = 20;

  console.log("User: ", user);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  }

  const handleResetToOriginal = async () => {
    if (!canvasEditor || !project || !project.originalImageUrl) {
      toast.error("No original image to resize to ")
      return;
    }

    try {
      setIsSaving(true);
      canvasEditor.clear();
      canvasEditor.backgroundColor = '#ffffff';
      canvasEditor.backgroundImage = undefined;

      const fabricImage = await FabricImage.fromURL(project.originalImageUrl, {
        crossOrigin: 'anonymous'
      })

      const imgAspectRatio = fabricImage.width / fabricImage.height;
      const canvasAspectRatio = project.width / project.height;

      const scale = imgAspectRatio > canvasAspectRatio ? project.width / fabricImage.width! : project.height / fabricImage.height!;

      fabricImage.set({
        left: project.width / 2,
        top: project.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true
      })

      fabricImage.filters = [];
      canvasEditor.add(fabricImage);
      canvasEditor.centerObject(fabricImage);
      canvasEditor.setActiveObject(fabricImage);
      canvasEditor.requestRenderAll();

      await updateProject({
        projectId: project._id,
        currentImageUrl: project.originalImageUrl,
        canvasState: canvasEditor.toJSON(),
        activeTransformation: undefined,
        backgroundRemoved: false,
      })

      toast.success("Project reset to original successfully");

    } catch (error) {
      console.log("Cannot go back to original immage: ", error);
      toast.error("Error in resetting to original image. Please try again!");
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!canvasEditor || !project) {
      toast.error("No canvas to save");
      return;
    }

    try {
      setIsSaving(true)
      await updateProject({
        projectId: project._id,
        canvasState: canvasEditor.toJSON(),
      });

      toast.success("Project saved successfully");
    } catch (error) {
      console.log("Error saving project: ", error);
      toast.error("Error saving project. Please try again!");
    }
    finally {
      setIsSaving(false);
    }
  }

  const handleToolChange = (toolId: ToolsId) => {
    if (!hasAccess(toolId)) {
      if (toolId === 'background' || toolId === 'ai_extender' || toolId === 'ai_edit') {
        setRestrictedTools(toolId);
      }
      setUpgradedModel(true);
      return;
    }
    onToolChange(toolId);
  }

  const handleExport = (config: ExportImageProps) => {
    if(!canvasEditor || !project) {
      toast.error("Canvas not ready");
      return;
    }

    if(!canExport(user?.exportsThisMonth)) {
      setRestrictedTools("exports");
      setUpgradedModel(true);
      toast.error("Export limit reached. Please upgrade your plan.");
      return;
    }

    setIsExporting(true);
    setExportFormat(config.format);
    try {
      const currentZoom = canvasEditor.getZoom();
      const currentViewPortTransform = canvasEditor.viewportTransform ? [...canvasEditor.viewportTransform] as [number, number, number, number, number, number] : [1, 0, 0, 1, 0, 0] as [number, number, number, number, number, number];
      canvasEditor.setZoom(1);
      canvasEditor.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvasEditor.setDimensions({
        width : project.width,
        height: project.height,
      })
      canvasEditor.requestRenderAll();
  
      const dataUrl = canvasEditor.toDataURL({
        format : config.format.toLowerCase() as 'png' | 'jpeg' | 'webp',
        quality : config.quality, 
        multiplier : 1
      });
  
      canvasEditor.setZoom(currentZoom);
      canvasEditor.setViewportTransform(currentViewPortTransform);
      canvasEditor.setDimensions({
        width : project.width * currentZoom,
        height: project.height * currentZoom,
      })
      canvasEditor.requestRenderAll();
  
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${project.title}.${config.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      toast.success(`Image exported as ${config.format} Successfully`);
    } catch (error) {
      console.log("Error exporting image: ", error);
      toast.error("Error exporting image. Please try again!");
    }
    finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  }

const saveToUndoStack = () => {
  if (!canvasEditor || isUndoRedo) return;

  const canvasState = JSON.stringify(canvasEditor.toJSON());

  setUndoStack((prev) => {
    const last = prev[prev.length - 1];
    if (last === canvasState) return prev; // prevent duplicates

    const next = [...prev, canvasState];
    if (next.length > MAX_HISTORY) next.shift();

    return next;
  });

  // Clear redo stack on new action
  setRedoStack([]);
};

  useEffect(() => {
    if(!canvasEditor) {
      return;
    }
    
    const handleCanvasModified = () => {
      if(!isUndoRedo) {
        saveToUndoStack();
      }
    }

    canvasEditor.on('object:added', handleCanvasModified);
    canvasEditor.on('object:modified', handleCanvasModified);
    canvasEditor.on('object:removed', handleCanvasModified);
    canvasEditor.on('path:created', handleCanvasModified);

    return () => {
      canvasEditor.off('object:added', handleCanvasModified);
      canvasEditor.off('object:modified', handleCanvasModified);
      canvasEditor.off('object:removed', handleCanvasModified);
      canvasEditor.off('path:created', handleCanvasModified);
    }
  }, [canvasEditor, isUndoRedo]);

  useEffect(() => {
    if(!canvasEditor) return;
    
    const initialState = JSON.stringify(canvasEditor.toJSON());
    setUndoStack([initialState]);
    setRedoStack([]);
  }, [canvasEditor]);

  const handleUndo = async () => {
    if (!canvasEditor || undoStack.length <= 1) return;

    setIsUndoRedo(true);

    try {
      const newUndo = [...undoStack];
      const current = newUndo.pop()!;
      const previous = newUndo[newUndo.length - 1];

      // Push current to redo
      setRedoStack((prevRedo) => {
        const nextRedo = [...prevRedo, current];
        if (nextRedo.length > MAX_HISTORY) nextRedo.shift();
        return nextRedo;
      });

      // Load previous
      await canvasEditor.loadFromJSON(JSON.parse(previous));
      canvasEditor.renderAll();
      setUndoStack(newUndo);
    } catch (error) {
      console.error("Error in undo:", error);
    } finally {
      setTimeout(() => setIsUndoRedo(false), 300);
    }
  };

  const handleRedo = async () => {
    if (!canvasEditor || redoStack.length === 0) return;

    setIsUndoRedo(true);

    try {
      const newRedo = [...redoStack];
      const nextState = newRedo.pop()!;

      // Push the state we're about to load into undo stack
      setUndoStack((prevUndo) => {
        const nextUndo = [...prevUndo, nextState];
        if (nextUndo.length > MAX_HISTORY) nextUndo.shift();
        return nextUndo;
      });

      // Load redo state
      await canvasEditor.loadFromJSON(JSON.parse(nextState));
      canvasEditor.renderAll();
      setRedoStack(newRedo);
    } catch (error) {
      console.error("Error in redo:", error);
    } finally {
      setTimeout(() => setIsUndoRedo(false), 300);
    }
  };
  
  return (
    <>
      <div className='px-6 py-3 border-b'>
        <div className='flex items-center justify-between mb-4'>

          <Button onClick={handleBackToDashboard} variant={'ghost'} size={'sm'} className='text-white hover:text-gray-300'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            All Projects
          </Button>

          <h1 className="font-extrabold capitalize">{project.title}</h1>
          <div className='flex items-center gap-3'>
            <Button variant={'outline'} onClick={handleResetToOriginal} className='gap-2' disabled={!project.originalImageUrl || isSaving} size={'sm'}>
              <RefreshCcw className='h-5 w-5' />
              Reset
            </Button>

            <Button variant={'outline'} onClick={handleSave} className='gap-2' disabled={!canvasEditor || isSaving} size={'sm'}>
              {isSaving ? (
                <>
                  <Loader2 className='h-5 w-5 animate-spin' />Saving...
                </>
              ) : (
                <>
                  <Save className='h-5 w-5' />Save
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={'glassy'} className='gap-2' size={'sm'} disabled={!canvasEditor || isExporting}>
                  {isExporting ? (
                    <>
                      <Loader2 className='h-5 w-5 animate-spin' />Exporting...
                    </>
                  ) : (
                    <>
                      <Download className='h-5 w-5' /> Export
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56 bg-slate-800 border-slate-700'>
                <DropdownMenuLabel className='px-3 py-2 text-sm text-white/70' >Export Resolution: {project.width} x {project.height}px</DropdownMenuLabel>
                {EXPORT_FORMATS.map((config, index) => (
                  <DropdownMenuItem key={index} onClick={() => handleExport(config)} className='text-white hover:bg-slate-700 flex cursor-pointer items-center gap-2'>
                    <FileImage className='h-5 w-5' />
                    <div className='flex-1'>
                      <div className='font-medium'>{config.label}</div>
                      <div className='text-xs text-white/50'> {config.format} {Math.round(config.quality * 100)}% quality</div>
                    </div>
                  </DropdownMenuItem>
                ))}
                {isFree && (
                  <>
                    <DropdownMenuSeparator className='bg-slate-700' />
                    <div className='px-3 py-2 text-xs text-white/50'>
                      Free Plan : {user?.exportsThisMonth}/20 exports this month
                      {(user?.exportsThisMonth) >= 20 && (
                        <div className='text-amber-400 mt-1'>Upgrade to pro for unlimited Exports.</div>
                      )}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                  key={tool.id} variant={isActive ? 'default' : 'ghost'} size={'sm'} onClick={() => handleToolChange(tool.id)} >
                  <Icon className='h-4 w-4' />  {tool.label}
                  {tool.proOnly && !hasToolAccess && (
                    <Lock className='h-3 w-3 ml-1 text-amber-300' />
                  )}
                </Button>
              )
            })}
          </div>


          <div className='flex gap-1 items-center'>
            <Button className='text-white' variant={'ghost'} size={'sm'} onClick={handleUndo} disabled={!canvasEditor || undoStack.length <= 1}>
              <RotateCcw className='h-4 w-4' />
            </Button>

            <Button className='text-white' variant={'ghost'} size={'sm'} onClick={handleRedo} disabled={!canvasEditor || redoStack.length === 0}>
              <RotateCw className='h-4 w-4' />
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

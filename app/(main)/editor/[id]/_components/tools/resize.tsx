'use client'
import { Project } from '@/app/(main)/dashboard/_components/project-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCanvas } from '@/context/use-context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { Expand, Lock, Monitor, Unlock } from 'lucide-react';
import React, { useState } from 'react'
import { toast } from 'sonner';

interface ResizeProp {
    project: Project;
}

interface ASPECT_RATIOS_PROPS {
    name: string;
    ratio: number[];
    label: string;
}
const ASPECT_RATIOS: ASPECT_RATIOS_PROPS[] = [
    { name: "Instagram Story", ratio: [9, 16], label: "9:16" },
    { name: "Instagram Post", ratio: [1, 1], label: "1:1" },
    { name: "Youtube Thumbnail", ratio: [16, 9], label: "16:9" },
    { name: "Portrait", ratio: [2, 3], label: "2:3" },
    { name: "Facebook Cover", ratio: [851, 315], label: "2.7:1" },
    { name: "Twitter Header", ratio: [3, 1], label: "3:1" },
];

const ResizeControls = (project: ResizeProp) => {

    const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
    const [newWidth, setNewWidth] = useState(project.project.width || 800);
    const [newHeight, setNewHeight] = useState(project.project.height || 600);
    const [lockAspectRatio, setLockAspectRatio] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    const { mutate: updateProject, data, isLoading } = useConvexMutation(api.projects.updateProject);

    console.log("Project in resize: ", project);


    
    const hasChanged = newWidth !== project.project.width || newHeight !== project.project.height;
    const changeLockState = () => {
        setLockAspectRatio(!lockAspectRatio);
    }
    const handleHeightChange = (hie: string) => {
        const height = parseInt(hie) || 0;
        setNewHeight(height);

        if(lockAspectRatio && project) {
            const ratio = project.project.width / project.project.height;
            setNewWidth(Math.round(height * ratio));
        }
        
        setSelectedPreset(null);
    }
    const handleWidthChange = (wid: string) => {
        const width = parseInt(wid) || 0;
        setNewWidth(width);
        
        if(lockAspectRatio && project) {
            const ratio = project.project.height / project.project.width;
            setNewHeight(Math.round(width * ratio));
        }
        
        setSelectedPreset(null);
    }

    const calculateAspectRatioDimensions = (ratio: number[]) => {
        if(!project || !project.project) {
            return {
                width: project.project.width,
                height: project.project.height
            }
        }

        const [ratioW, ratioH] = ratio;

        const aspectRatio = ratioW / ratioH;
        
        const originalArea = project.project.width * project.project.height;
        const width = Math.sqrt(originalArea * aspectRatio);
        const height = width / aspectRatio;

        return {width : Math.round(width), height : Math.round(height)};
    }

    const applyPreset = (aspectRatio : ASPECT_RATIOS_PROPS) => {
        const dimesnion = calculateAspectRatioDimensions(aspectRatio.ratio);
        setNewWidth(dimesnion.width);
        setNewHeight(dimesnion.height);
        setSelectedPreset(aspectRatio.name);
    }
    const handleApplyResize = async() => {
        if(!project || !project.project || !canvasEditor) return;

        setProcessingMessage("Resizing Canvas...");

        try {
            // Set the actual canvas dimensions
            canvasEditor.width = newWidth;
            canvasEditor.height = newHeight;
            
            // Calculate and apply viewport scaling
            const viewPortScale = calculateViewPortSize();
            
            // Set the display dimensions
            canvasEditor.setDimensions({
                width: newWidth * viewPortScale,
                height: newHeight * viewPortScale
            });

            canvasEditor.setZoom(viewPortScale);
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();

            await updateProject({
                projectId : project.project._id,
                width : newWidth,
                height : newHeight,
                canvasState : canvasEditor.toJSON()
            });
            
            toast.success("Canvas resized successfully!");
        } catch (error) {
            console.log("Error resizing canvas:", error);
            toast.error("Failed to resize canvas. Please try again.");
            
        }
        finally {
            setProcessingMessage(null);
        }
    }

    const calculateViewPortSize = () => {
        if(!canvasEditor || !project.project) return 1;
        
        const container = canvasEditor.getElement().parentElement as HTMLElement;
        if(!container) return 1;
        
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;

        const scaleX = containerWidth / newWidth;
        const scaleY = containerHeight / newHeight;

        return Math.min(scaleX, scaleY, 1);
    }
    if (!canvasEditor || !project.project) {
        return (
            <div className='p-4'>
                <p className='text-sm text-white/70'>Canvas not ready</p>
            </div>
        )
    }
    return (
        <div className='space-y-6'>
            <div className='bg-slate-700/30 p-3 rounded-lg'>
                <h4 className='text-sm font-medium mb-2 text-white'>Current Size</h4>
                <div className='text-xs text-white/70'>{project.project.width} x {project.project.height} pixels</div>
            </div>

            <div className='space-y-4'>
                <div className='flex items-center justify-between mb-2'>
                    <h3>Custom Size</h3>
                    <Button variant={'ghost'} size={'sm'} className='text-white/70 hover:text-white p-1' onClick={changeLockState}>
                        {lockAspectRatio ? (
                            <Lock className='h-5 w-5' />
                        ) : (
                            <Unlock className='h-5 w-5' />
                        )}
                    </Button>
                </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
                <div>
                    <Label className='text-xs mb-1 block text-white/70' htmlFor='width'>Width: </Label>
                    <Input type='number' value={newWidth} className='bg-slate-700 border-white/20 text-white' min={100} max={5000} onChange={(e) => handleWidthChange(e.target.value)} defaultValue={project.project.width} />

                </div>
                <div>
                    <Label className='text-xs mb-1 block text-white/70' htmlFor='width'>Heght: </Label>
                    <Input type='number' value={newHeight} className='bg-slate-700 border-white/20 text-white' min={100} max={5000} onChange={(e) => handleHeightChange(e.target.value)} defaultValue={project.project.height} />

                </div>
            </div>

            <div className='text-xs flex items-center justify-center'>
                <span className='text-white/70'>
                    {lockAspectRatio ? 'Locked Aspect Ratio' : 'Free Resize'}
                </span>
            </div>

            <div className='space-y-3'>
                <h3 className='text-sm font-medium text-white'>Aspect Ratios</h3>
                <div className='grid grid-cols-1 max-h-60 overflow-y-auto gap-2'>
                    {ASPECT_RATIOS.map((aspectRatio) => {
                        
                        const dimension = calculateAspectRatioDimensions(aspectRatio.ratio);
                        return (
                            <Button key={aspectRatio.name} variant={selectedPreset === aspectRatio.name ? 'default' : 'outline'} size={'sm'}
                            onClick={() => applyPreset(aspectRatio)}
                            className={`justify-between h-auto py-2 ${
                                selectedPreset === aspectRatio.name ? 'bg-cyan-400 hover:bg-cyan-600' : 'text-left'
                            }`}
                            >
                                <div>
                                    <div className='font-medium'>{aspectRatio.name}</div>
                                    <div className='text-xs opacity-70'>
                                        {dimension.width} x {dimension.height} ({aspectRatio.label})
                                    </div>
                                </div>
                                <Monitor className='h-4 w-4' />
                            </Button>
                        )
                    })}
                </div>
            </div>

            {hasChanged && (
                <div className='bg-slate-700/30 rounded-lg p-3'>
                    <h4 className='text-sm font-medium text-white mb-2'>
                        New Size Preview
                    </h4>
                    <div>
                        <div className='text-xs text-white/70'>
                            New Canvas : {newHeight} x {newWidth} pixels
                        </div>
                        <div className='text-cyan-400'>
                            {newWidth > project.project.width || newHeight > project.project.height ? 'Canvas will be expanded' : 'Canvas will be cropped'} {" "}
                        </div>
                        <div className='text-white/50 mt-1'>Objects will maintain their current size and position</div>
                    </div>
                </div>
            )}

            <Button onClick={handleApplyResize} disabled={!hasChanged || !!processingMessage} variant={'primary'} className='w-full'><Expand className='mr-2 h-5
             w-5'/>Apply Resize</Button>

             <div className='bg-slate-700/30 p-3 rounded-lg'>
                <p className='text-xs text-white/70'>
                    <strong>Resize Canvas: </strong> Changes canvas dimensions. <br />
                    <strong>Aspect Ratio:</strong> Smart sizing based on your current canvas. <br />
                    Object maintain their size and position.
                </p>
             </div>
        </div>
    )
}

export default ResizeControls


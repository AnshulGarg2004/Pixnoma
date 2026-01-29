'use client'
import { Project } from '@/app/(main)/dashboard/_components/project-card';
import { Button } from '@/components/ui/button'
import { useCanvas } from '@/context/use-context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { FabricImage } from 'fabric';
import { get } from 'http';
import { Camera, CheckCircle, Info, Leaf, Mountain, Sparkles, User, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react'
import { toast } from 'sonner';

interface AIEditProps {
    project: Project;
}

interface RetouchProps {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;
    transform: string;
    recommended: boolean;
}

const RETOUCH_PRESETS: RetouchProps[] = [
    {
        key: "ai_retouch",
        label: "AI Retouch",
        description: "Improve image quality with AI",
        icon: Sparkles,
        transform: "e-retouch",
        recommended: true,
    },
    {
        key: "ai_upscale",
        label: "AI Upscale",
        description: "Increase resolution to 16MP",
        icon: User,
        transform: "e-upscale",
        recommended: false,
    },
    {
        key: "enhance_sharpen",
        label: "Enhance & Sharpen",
        description: "AI retouch + contrast + sharpening",
        icon: Mountain,
        transform: "e-retouch,e-contrast,e-sharpen",
        recommended: false,
    },
    {
        key: "premium_quality",
        label: "Premium Quality",
        description: "AI retouch + upscale + enhancements",
        icon: Camera,
        transform: "e-retouch,e-upscale,e-contrast,e-sharpen",
        recommended: false,
    },
];




const AIEditTool = ({ project }: AIEditProps) => {
    
    console.log("Project in aiEdit: ", project);
    
    
    const [selectPreset, setSelectPreset] = useState<string>('ai_retouch');
    const { canvasEditor, setProcessingMessage } = useCanvas();
    const { mutate: updateProject } = useConvexMutation(api.projects.updateProject);
    
    const getMainImage = (): FabricImage | undefined => {
        if (!canvasEditor) return;
        
        const objs = canvasEditor.getObjects();
        
        return objs.find((obj) => obj.type === 'image') as FabricImage | undefined;
    }

    const buildRetouchQuery = (imageUrl : string, presetKey : string) => {
        const preset = RETOUCH_PRESETS.find((p) => p.key === presetKey);

        if(!imageUrl || !preset) return imageUrl;

        const [baseUrl, existingQuery] = imageUrl.split('?');
        if(existingQuery) {
            const params = new URLSearchParams(existingQuery);
            const existingTr = params.get("tr")

            if(existingTr) {
                return `${baseUrl}?tr=${existingTr},${preset.transform}`
            }
        }

        return `${baseUrl}?tr=${preset.transform}`
    }
    
    const applyRetouch = async () => {
        if(!canvasEditor) return;

        const mainImage = getMainImage();

        if(!mainImage || !project || !selectedPResetData()) {
            return;
        }

        setProcessingMessage(`Enhancing Image with ${selectedPResetData()?.label}...`);

        try {
            const currentImageUrl = mainImage.getSrc();
            const retouchedUrl = buildRetouchQuery(currentImageUrl, selectPreset);

            const retoucedImage = await FabricImage.fromURL(retouchedUrl, {
                crossOrigin : 'anonymous'
            });

            const imageProps = {
                left : mainImage.left,
                top : mainImage.top,
                scaleX : mainImage.scaleX,
                scaleY : mainImage.scaleY,
                angle : mainImage.angle,
                originX : mainImage.originX,
                originY : mainImage.originY,
                selectable : true,
                evented : true,
            }

            canvasEditor.remove(mainImage);
            retoucedImage.set(imageProps);
            canvasEditor.add(retoucedImage);
            retoucedImage.setCoords();
            canvasEditor.setActiveObject(retoucedImage);
            canvasEditor.requestRenderAll();

            await updateProject({
                projectId : project._id,
                currentImageUrl : retouchedUrl,
                canvasState : canvasEditor.toJSON(),
                activeTransformation : selectedPResetData()?.transform
            })

            toast.success("Image Retouched Successfully")
            
        } catch (error) {
            console.log("Error in updating retouching: ", error);
            toast.error("Error in Retouching. Please try again!")
            
        }
        finally {
            setProcessingMessage(null);
        }
    } 
    
    const hasActiveTransformation = project.activeTransformation?.includes('e-retouch');

    const selectedPResetData = () => {
        return RETOUCH_PRESETS.find((p) => p.key === selectPreset);
    }
    return (
        <div className='space-y-6'>
            {hasActiveTransformation && (
                <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                        <CheckCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-500' />
                        <div>
                            <h3 className='font-medium text-green-400 mb-1'>Image Enhanced</h3>
                            <p className='text-green-300/80 text-sm '>AI enhancement have been applied to this image</p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h3 className='text-sm font-medium mb-3 text-white'>Choose Enhancement Style</h3>

                <div className='grid grid-cols-2 gap-4'>
                    {RETOUCH_PRESETS.map((retouch) => {
                        const Icon = retouch.icon;
                        const isSelected = selectPreset === retouch.key;
                        return (
                            <div
                                onClick={() => setSelectPreset(retouch.key)}
                                key={retouch.key} className={`relative p-4 border cursor-pointer rounded-lg transition-all ${isSelected ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/20 bg-slate-700/30 hover:border-white/40'
                                    }`
                                }>
                                <div className='flex items-center text-center flex-col'>
                                    <Icon className='h-8 w-8 text-cyan-400 mb-2' />
                                    <div className='flex items-center gap-2 mb-1 '>
                                        <h4 className='text-white font-medium text-sm'> {retouch.label}</h4>
                                        {retouch.recommended && (
                                            <span className='px-1.5 py-0.5 bg-cyan-500 text-white rounded-full text-sm'>★</span>

                                        )}
                                    </div>

                                    <p className='text-white/70 text-sm'>{retouch.description}</p>
                                </div>

                                {isSelected && (
                                    <div className='absolute top-2 right-2'>
                                        <div className='bg-cyan-500 rounded-full w-3 h-3'></div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

            </div>
            <Button variant={'primary'} className='w-full' onClick={applyRetouch} >
                <Wand2 className='h-5 w-5' />
                Apply {selectedPResetData()?.label}
            </Button>

            <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How AI Retouch Works
                </h4>
                <div className="space-y-2 text-xs text-white/70">
                    <p>
                        • <strong>AI Retouch:</strong> AI analyzes and applies optimal
                        improvements
                    </p>
                    <p>
                        • <strong>Smart Processing:</strong> Preserves details while
                        enhancing quality
                    </p>
                    <p>
                        • <strong>Multiple Styles:</strong> Choose enhancement that fits
                        your image
                    </p>
                    <p>
                        • <strong>Instant Results:</strong> See improvements in seconds
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AIEditTool

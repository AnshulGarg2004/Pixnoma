'use client'
import { Project } from '@/app/(main)/dashboard/_components/project-card'
import { useCanvas } from '@/context/use-context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { Loader2 } from 'lucide-react';
import { Canvas, FabricImage } from 'fabric';
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner';


interface CanvasEditorProps {
    project: Project;
}

const CanvasEditor = ({ project }: CanvasEditorProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasInstanceRef = useRef<Canvas | null>(null);
    const [isloading, setisloading] = useState(true);
    const isInitializedRef = useRef(false);
    const { onToolChange, activeTool, setCanvasEditor, canvasEditor, processingMessage } = useCanvas() as {
        canvasEditor: Canvas | null;
        setCanvasEditor: React.Dispatch<React.SetStateAction<Canvas | null>>;
        onToolChange: (tool: string) => void;
        activeTool: string;
        processingMessage: string | null;
    };
    const { mutate: updateProject, data, isLoading } = useConvexMutation(api.projects.updateProject);
    console.log("Updated project in canvas: ", updateProject);

    useEffect(() => {
        if(!isLoading && data) {
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 500)
        }
    },[data, isLoading])

    const calculateViewPortSize = () => {
        if (!containerRef.current || !project) {
            return;
        }

        const container = containerRef.current;
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;

        const scaleX = containerWidth / project.width;
        const scaleY = containerHeight / project.height;

        return Math.min(scaleX, scaleY, 1);
    }

    useEffect(() => {
        if (!containerRef.current || !project) {
            return;
        }

        // Skip re-initialization if already initialized for this project
        if (isInitializedRef.current && canvasInstanceRef.current) {
            return;
        }
        

        const initialiseCanvas = async () => {
            // Dispose existing canvas if it exists
            if (canvasInstanceRef.current) {
                try {
                    canvasInstanceRef.current.dispose();
                } catch (error) {
                    console.error('Error disposing previous canvas:', error);
                }
                canvasInstanceRef.current = null;
            }

            const viewPortSize = calculateViewPortSize();

            if(!viewPortSize) {
                console.log("View port size is not defined: ", viewPortSize);
                return;;
                
            }
            const canvas = new Canvas(canvasRef.current!, {
                width: project.width,
                height: project.height,

                backgroundColor: '#ffffff',

                preserveObjectStacking: true,
                controlsAboveOverlay: true,
                selection: true,

                hoverCursor: 'move',
                moveCursor: 'move',
                defaultCursor: 'default',

                skipTargetFind: false,
                allowTouchScrolling: false,
                renderOnAddRemove: true,

                enableRetinaScaling: true,
            });

            canvas.setDimensions({
                width: project.width * viewPortSize!,
                height: project.height * viewPortSize!
            }, { backstoreOnly: false });

            

            canvas.setZoom(viewPortSize!);

            const scaleFactor = window.devicePixelRatio || 1;

            if (scaleFactor > 1) {
                canvas.getElement().width = project.width * scaleFactor;
                canvas.getElement().height = project.height * scaleFactor;

                canvas.getContext().scale(scaleFactor, scaleFactor);
            }

            if (project.canvasState) {
                try {
                    await canvas.loadFromJSON(project.canvasState, () => {
                        canvas.renderAll();
                    });
                    canvas.requestRenderAll();
                } catch (error) {
                    console.error("Error loading canvas state: ", error);
                    toast.error("Error loading canvas state");
                }
            }

            else if (project.currentImageUrl || project.originalImageUrl) {
                try {
                    const imageUrl = project.currentImageUrl || project.originalImageUrl;
                    console.log("Loading image from URL: ", imageUrl);

                    const fabricImage = await FabricImage.fromURL(imageUrl, {
                        crossOrigin: 'anonymous'
                    });

                    console.log("Image is loaded: ", fabricImage);


                    const imgAspectRatio = fabricImage.width! / fabricImage.height!;
                    const canvasAspectRatio = project.width / project.height;

                    let scaleX, scaleY;
                    if (imgAspectRatio > canvasAspectRatio) {
                        // img is wider than canvas
                        scaleX = project.width / fabricImage.width!;
                        scaleY = scaleX;
                    } else {
                        // img is taller than canvas
                        scaleY = project.height / fabricImage.height!;
                        scaleX = scaleY;
                    }

                    fabricImage.set({
                        left: project.width / 2,
                        top: project.height / 2,
                        originX: 'center',
                        originY: 'center',
                        scaleX, scaleY,
                        selectable: true,
                        evented: true
                    });

                    canvas.add(fabricImage);
                    canvas.centerObject(fabricImage);
                    canvas.sendObjectToBack(fabricImage);
                    canvas.requestRenderAll();
                } catch (error) {
                    console.error("Error loading image in canvas", error);
                    toast.error("Error loading image in canvas");
                }
            }


            canvas.calcOffset();
            canvas.requestRenderAll();
            canvasInstanceRef.current = canvas;
            setCanvasEditor(canvas);
            isInitializedRef.current = true;

            setTimeout(() => {
                window.dispatchEvent(new Event('resize'))
            }, 500)
            setisloading(false);
        }

        initialiseCanvas();

        return () => {
            if (canvasInstanceRef.current) {
                try {
                    canvasInstanceRef.current.dispose();
                } catch (error) {
                    console.error('Error disposing canvas:', error);
                }
                canvasInstanceRef.current = null;
                setCanvasEditor(null);
                isInitializedRef.current = false;
            }
        }

    }, [project._id]);

    useEffect(() => {
        if(!canvasEditor || !onToolChange) {
            return;
        }

        const handleSelection = (e: any) => {
            const selectedObject = e.target?.selected?.[0] || e.selected?.[0];
            if(selectedObject && selectedObject.type === 'i-text') {
                return onToolChange('text');
            }
        }

        canvasEditor.on('selection:created', handleSelection);
        canvasEditor.on('selection:updated', handleSelection);

        return () => {
            canvasEditor.off('selection:created', handleSelection);
            canvasEditor.off('selection:updated', handleSelection);
        }
    }, [onToolChange, canvasEditor])

    const saveCanvasState = async () => {
        try {
            if (!canvasEditor || !project) {
                return;
            }
            const canvasJSON = canvasEditor.toJSON();

            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON
            });
        } catch (error) {
            console.error('Error in saving canvas state: ', error);
            toast.error("Error in saving canvas state");
            return;

        }

    }

    useEffect(() => {
        if (!canvasEditor) {
            return;
        }

        let saveTimeout: NodeJS.Timeout;
        const handleCanvasChange = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCanvasState();
            }, 2000);
        }

        canvasEditor.on('object:added', handleCanvasChange);
        canvasEditor.on('object:modified', handleCanvasChange);
        canvasEditor.on('object:removed', handleCanvasChange);

        return () => {
            clearTimeout(saveTimeout);
            canvasEditor.off('object:added', handleCanvasChange);
            canvasEditor.off('object:modified', handleCanvasChange);
            canvasEditor.off('object:removed', handleCanvasChange);
        }
    }, [canvasEditor]);

    useEffect(() => {
        if (!canvasEditor) return;

        switch (activeTool) {
            case "crop":
                canvasEditor.defaultCursor = 'crosshair'
                canvasEditor.hoverCursor = 'crosshair'
                break;
            default:
                canvasEditor.defaultCursor = 'default'
                canvasEditor.hoverCursor = 'move'
        }
    }, [canvasEditor, activeTool])

    useEffect(() => {
        if (!canvasEditor || !project) {
            return;
        }
        const handleResize = async () => {

            const newScale = calculateViewPortSize();

            if (!newScale) {
                console.log("cannot resize imae error: ", newScale);
                return;
            }

            if (!canvasEditor) return;

            canvasEditor.setDimensions({
                width: project.width * newScale!,
                height: project.height * newScale!
            }, { backstoreOnly: false });

            canvasEditor.setZoom(newScale);
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [canvasEditor, project]);
    return (
        <div ref={containerRef} className='relative flex items-center justify-center bg-secondary overflow-hidden w-full h-full'>
            <div className='absolute inset-0 pointer-events-none opacity-10'
                style={{
                    backgroundImage: `
                    linear-gradient(45deg, #64748b 25%, transparent 25%),
                     linear-gradient(-45deg, #64748b 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #64748b 75%),
                       linear-gradient(-45deg, transparent 75%, #64748b 75%)
                       `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }} />

            <canvas ref={canvasRef} id='canvas' className='border w-full h-full' />

            {isloading && (
                <div className='absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10'>
                    <div className='flex flex-col items-center gap-4'>
                        <Loader2 className='animate-spin h-8 w-8 text-cyan-400' />
                        <p className='text-white/70 text-sm'>Loading Canvas...</p>
                    </div>
                </div>
            )}
        </div>

    )
}

export default CanvasEditor

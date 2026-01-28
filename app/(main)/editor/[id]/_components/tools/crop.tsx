'use client';
import { Button } from '@/components/ui/button';
import { useCanvas } from '@/context/use-context';
import { set } from 'date-fns';
import { FabricImage, Rect } from 'fabric';
import { CheckCheck, Crop, Maximize, RectangleHorizontal, RectangleVertical, Smartphone, Square, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React, { act, useEffect, useState } from 'react'
import { toast } from 'sonner';

interface ASPECT_RATIOS_PROPS {
    label : string;
    value : number | null;
    icon : LucideIcon;
    ratio? : string;
}

interface OriginalImageProps {
    left: number;
    top: number ;
    width: number;
    height: number ;
    scaleX: number ;
    scaleY: number;
    angle: number;
    selectable: boolean;
    evented: boolean ;
}

const ASPECT_RATIOS: ASPECT_RATIOS_PROPS[] = [
    { label: "Freeform", value: null, icon: Maximize },
    { label: "Square", value: 1, icon: Square, ratio: "1:1" },
    { label: "Widescreen", value: 16 / 9, icon: RectangleHorizontal, ratio: "16:9"},
    { label: "Portrait", value: 4 / 5, icon: RectangleVertical, ratio: "4:5" },
    { label: "Story", value: 9 / 16, icon: Smartphone, ratio: "9:16" },
];

const CropContent = () => {
    const {canvasEditor, activeTool} = useCanvas();

    const [selectedImage, setSelectedImage] = useState<FabricImage | null>(null);
    const [isCropMode, setIsCropMode] = useState<boolean>(false);
    const [cropRect, setCropRect] = useState<Rect | null>(null);
    const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
    const [originalProps, setOriginalProps] = useState<OriginalImageProps | null>(null);

    const getActiveImage = (): FabricImage | null => {
        if(!canvasEditor) {
            return null;
        }

        const activeObject = canvasEditor.getActiveObject();
        if(activeObject && activeObject.type === 'image') {
            return activeObject as FabricImage;
        }

        const objs = canvasEditor.getObjects();
        return objs.find((obj) => obj.type === 'image') as FabricImage;
         
    }

    const activeImage = getActiveImage();
    console.log("Active image got: ", activeImage);
    

    useEffect(() => {
        if(activeTool === 'crop' && canvasEditor && isCropMode) {
            const image = getActiveImage();
            if(image) {
                initialiseCropMode(image);
            }
        }

        else if(activeTool !== 'crop' && isCropMode) {
            exitCropMode();
        }
    }, [activeTool, canvasEditor]);

    useEffect(() => {
        return () => {
            if(isCropMode) {
                exitCropMode();
            }
        }
    }, []);

    const removeAllCropRectangles = () => {
        if(!canvasEditor) return;

        const objs = canvasEditor.getObjects();
        const rectToRemove = objs.filter((obj) => obj.type === 'rect');

        rectToRemove.forEach((rect) => {
            canvasEditor.remove(rect)
        })
    }

    const createCropRectangle = (image : FabricImage) => {
        const bounds = image.getBoundingRect();

        const cropReactangle = new Rect({
            left : bounds.left + bounds.width * 0.2,
            top : bounds.top + bounds.height * 0.2,
            width : bounds.width * 0.6,
            height : bounds.height * 0.6,
            fill : 'transparent',
            stroke : '#00bcd4',
            strokeWidth : 2,
            strokeDashArray : [5,5],
            evented : true,
            selectable : true,
            name : "cropRect",

            cornerColor : '#00bcd4',
            cornerSize : 12,
            transparentCorners : false,
            cornerStyle : 'circle',
            borderColor : '#00bcd4',
            borderScaleFactor  : 1,

            isCropRectangle : true

            
        });

        cropReactangle.on('scaling', (e) => {
            const rect = e.transform.target as Rect;
            if(selectedRatio !== null) {
                const currentRatio = (rect.width! * rect.scaleX!) / (rect.height! * rect.scaleY!);

                if(Math.abs(currentRatio - selectedRatio) > 0.01) {
                    const newHeight = (rect.width! * rect.scaleX!) / selectedRatio / rect.scaleY!;

                    rect.set("height", newHeight);
                }
            }

            canvasEditor?.requestRenderAll();

        })

        canvasEditor?.add(cropReactangle);
        canvasEditor?.setActiveObject(cropReactangle);
        setCropRect(cropReactangle);
    };

    const applyAspectRatio = (ratio : number | null) => {
        setSelectedRatio(ratio);
        
        if(!cropRect) {
            return;
        }

        if(ratio === null) {
            // Freeform - no aspect ratio constraint
            return;
        }

        const currentWidth = cropRect.width! * cropRect.scaleX!;
        const newHeight = currentWidth / ratio ;

        cropRect.set({
            height : newHeight / cropRect.scaleY!,
            scaleY : cropRect.scaleX
        })

        canvasEditor?.requestRenderAll();
    }

    const initialiseCropMode = (image : FabricImage) => {
        if(!image && isCropMode) {
            return;
        }

        removeAllCropRectangles();  

        const original: OriginalImageProps = {
            left : image.left,
            top : image.top,
            width : image.width,
            height  : image.height,
            scaleX : image.scaleX,
            scaleY  : image.scaleY,
            angle : image.angle || 0,
            selectable : image.selectable,
            evented : image.evented
        }

        console.log("Original Content of image: ", original);
        

        setOriginalProps(original);
        setSelectedImage(image);
        setIsCropMode(true);

        image.set({
            selectable : false,
            evented : false
        });

        createCropRectangle(image);
        canvasEditor?.requestRenderAll();
    };
    const exitCropMode = () => {
        if(!isCropMode) {
            return;
        }

        removeAllCropRectangles();
        setCropRect(null);

        if(selectedImage && originalProps) {
            selectedImage.set({
                left : originalProps.left,
                top : originalProps.top,
                width : originalProps.width,
                height  : originalProps.height,
                scaleX : originalProps.scaleX,
                scaleY  : originalProps.scaleY,
                angle : originalProps.angle,
                selectable : originalProps.selectable,
                evented : originalProps.evented
            });

            canvasEditor?.setActiveObject(selectedImage);
            setCropRect(null);
            setSelectedImage(null);
            setIsCropMode(false);
            setOriginalProps(null);
            if(canvasEditor) {
                canvasEditor.requestRenderAll();
            }

        }
    }

    const applyCrop = () => {
        if(!cropRect || !selectedImage ||  !canvasEditor) {
            return;
        }

        try {
            const cropBounds = cropRect.getBoundingRect();
            const imageBounds = selectedImage.getBoundingRect();    

            const cropX = Math.max(0, cropBounds.left - imageBounds.left);
            const cropY = Math.max(0, cropBounds.top - imageBounds.top);
            const cropWidth = Math.min(cropBounds.width, imageBounds.width - cropX);
            const cropHeight = Math.min(cropBounds.height, imageBounds.height - cropY);

            const imageScaleX = selectedImage.scaleX || 1;
            const imageScaleY = selectedImage.scaleY || 1;

            const actualCropX = cropX / imageScaleX;
            const actualCropY = cropY / imageScaleY;
            
            const actualCropWidth = cropWidth / imageScaleX;
            const actualCropHeight = cropHeight / imageScaleY;

            const croppedImage = new FabricImage(selectedImage._element, {
                left : cropBounds.left + cropBounds.width / 2,
                top : cropBounds.top + cropBounds.height / 2,
                originX : 'center',
                originY : 'center',

                selectable : true,
                evented : true,

                cropX : actualCropX,
                cropY : actualCropY,
                width : actualCropWidth,
                height : actualCropHeight,
        
                scaleX : imageScaleX,
                scaleY : imageScaleY,   
            })

            canvasEditor.remove(selectedImage);
            canvasEditor.add(croppedImage);

            canvasEditor.setActiveObject(croppedImage);
            canvasEditor.requestRenderAll();

            exitCropMode();

        } catch (error) {
            console.error("Error in apllyin crop mode: ", error);
            toast.error("Failed to apply crop. Please try again.");
            exitCropMode();
            
        }
    }

     if (!canvasEditor) {
        return (
            <div className='p-4'>
                <p className='text-white/70 text-xs'>Load an image to start adjusting</p>
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            {isCropMode && (
                <div className='bg-cyan-500/10 border-cyan-500/20 p-3 rounded-lg border'>
                    <p className='text-sm text-cyan-400 font-medium'>✂️ Crop Mode Active</p>
                    <p className='text-xs text-cyan-300/80 mt-1'>Adjust the blue Rectangle to set crop area.</p>
                </div>
            )}

            {!isCropMode && activeImage && (
                <Button
                onClick={() => initialiseCropMode(activeImage)}
                variant={'primary'} className='w-full'
                >
                    <Crop className='h-5 w-5 mr-2'/>
                    Start Croping
                </Button>
            )}

            {isCropMode && (
                <div>
                    <h3 className='text-sm text-white font-medium mb-3'>Crop Aspect Ratios</h3>
                    <div className='grid grid-cols-3 gap-2'>
                        {ASPECT_RATIOS.map((ratio) => {
                            const Icon = ratio.icon;
                            return(
                                <button
                                className={`text-center p-3 rounded-lg border transition-colors cursor-pointer ${
                                    selectedRatio === ratio.value
                                    ? "border-cyan-400 bg-cyan-400/10"
                                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                                }`}
                                key={ratio.label}
                                onClick={() => applyAspectRatio(ratio.value)}
                                >
                                     <Icon className='h-6 w-6 mb-2 mx-auto text-white' />
                                <div className='text-xs text-white'>{ratio.label}</div>
                                {ratio.ratio && (
                                    <div className='text-xs text-white/80'>
                                        {ratio.ratio}
                                    </div>
                                )}
                                </button>
                            )
                        })}
                    </div>
                </div>

            )}

            {isCropMode && (
                <div className='border-t space-y-3 pt-4 border-white/10'>
                    <Button className='w-full' variant={'primary'} onClick={() => applyCrop()} >
                    <CheckCheck className='h-5 w-5 mr-2' />
                    Apply Crop
                </Button>
                <Button className='w-full' variant={'outline'} onClick={() => exitCropMode()}>
                    <X className='h-5 w-5 mr-2' />
                    Cancel  
                </Button>
                </div>
            )}

            <div className='bg-slate-700/30 p-3 rounded-lg'>
                <p className='text-sx text-white/70'>
                <strong>How to Crop: </strong>
                1. Click "Start Cropping"
                <br />
                2. Drag the blue rectangle to select the crop area.
                <br />
                3. Choose an aspect ratio (optional).
                <br />
                4. Click "Apply Crop" to finalize or "Cancel" to revert.
                </p>
            </div>
            
        </div>
    )
}

export default CropContent

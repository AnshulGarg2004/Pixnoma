'use client';
import { Project } from '@/app/(main)/dashboard/_components/project-card'
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/use-context';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { set } from 'date-fns';
import { FabricImage } from 'fabric';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Images, Wand, Wand2, type LucideIcon } from 'lucide-react';
import React, { useState } from 'react'
import { toast } from 'sonner';

interface AiExtendToolProps {
  project: Project;
}

interface DirectionProps {
  key: string,
  label: string,
  icon: LucideIcon
}

const Directions: DirectionProps[] = [
  { key: 'left', label: 'left', icon: ArrowLeft },
  { key: 'right', label: 'right', icon: ArrowRight },
  { key: 'top', label: 'top', icon: ArrowUp },
  { key: 'bottom', label: 'bottom', icon: ArrowDown },
]

const focusMap: Record<string, string> = {
  left: 'fo-right',
  right: 'fo-left',
  top: 'fo-bottom',
  bottom: 'fo-top'
}
const AiExtendTool = ({ project }: AiExtendToolProps) => {

  console.log("Project in ai_extend: ", project);
  

  const { canvasEditor, setProcessingMessage } = useCanvas();
  const [selectDirection, setSelectDirection] = useState<string | null>(null);
  const [extensionAmount, setExtensionAmount] = useState(200);

  const { mutate: updateProject } = useConvexMutation(api.projects.updateProject);

  const getMainImage = (): FabricImage | undefined => {
    if (!canvasEditor) return;

    const objs = canvasEditor.getObjects();

    return objs.find((obj) => obj.type === 'image') as FabricImage | undefined;
  }

  const getImageSrc = (image: FabricImage): string => {
    return image.getSrc();
  }

  const SelectDirection = (direction: string) => {
    setSelectDirection((prev) => (prev === direction ? null : direction));
  }

  const hasBackgroundRemoval = (): boolean => {
    const mainImage = getMainImage();
    if (!mainImage) return false;

    const imageSrc = getImageSrc(mainImage);
    return imageSrc.includes('e-bgremove') || imageSrc.includes('e-removedotbg') || imageSrc.includes('e-changebg');
  }

  const calculateDimension = () => {
    const mainImage = getMainImage();
    if (!mainImage || !selectDirection) return {
      width: 0,
      height: 0
    }

    const currentWidth = mainImage.width * (mainImage.scaleX || 1);
    const currentHeight = mainImage.height * (mainImage.scaleY || 1);

    const isHorizontal = ['left', 'right'].includes(selectDirection);
    const isVertical = ['top', 'bottom'].includes(selectDirection);

    return {
      width: Math.round(currentWidth + (isHorizontal ? extensionAmount : 0)),
      height: Math.round(currentHeight + (isVertical ? extensionAmount : 0))
    }
  }

  const buildExtensionUrl = (imageUrl : string) => {
    const baseUrl = imageUrl.split('?')[0];
    const {width, height} = calculateDimension();

    const transformation = [
      'bg-genfill',
      `w-${width}`,
      `h-${height}`,
      'cm-pad_resize',
    ];

    const focus = focusMap[selectDirection!];
    if (focus) {
      transformation.push(focus);
    }

    return `${baseUrl}?tr=${transformation.join(',')}`;
  }

  const applyExtension = async () => {
    const image = getMainImage();
    if (!canvasEditor || !image || !selectDirection) return;
    setProcessingMessage('Applying AI Extension...');
    try {
      const imageSrc = getImageSrc(image);
      const extendedImageUrl = buildExtensionUrl(imageSrc);

      const extendedImage = await FabricImage.fromURL(extendedImageUrl, {
        crossOrigin: 'anonymous'
      });

      const scale = Math.min(
        project.width / extendedImage.width!,
        project.height / extendedImage.height!,
        1
      );

      extendedImage.set({
        left : project.width /2,
        top: project.height / 2, 
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented : true
      })

      canvasEditor.remove(image);
      canvasEditor.add(extendedImage);
      canvasEditor.setActiveObject(extendedImage);
      canvasEditor.requestRenderAll();

      
      // Update project image in database
      await updateProject({
        projectId: project._id,
        currentImageUrl: extendedImageUrl,
        canvasState : canvasEditor.toJSON()
      });

      setSelectDirection(null)
      
      toast.success('AI Extension Applied Successfully');
    
    } catch (error) {
      console.log("Error in extending image: ", error);
      toast.error('Failed to apply AI Extension. Please try again.');
      
    }

    finally {
      setProcessingMessage(null);
    }
  }

  const { width: newWidth, height: newHeight } = calculateDimension();
  const currentImage = getMainImage();

  if (hasBackgroundRemoval()) {
    return (
      <div className='text-amber-500/10 border border-amber-500/20 p-4 rounded-lg'>
        <h3 className='text-amber-400 font-medium mb-2'>
          Extension not Available
        </h3>

        <p className='text-amber-300/80 text-sm'>AI Extension cannot be used on images with removed backgrounds. Use extension first, then remove background.</p>
      </div>
    )
  }
  return (
    <div className='space-y-4'>
      <div>
        <h1 className='text-sm font-medium text-white mb-2'>Select Extension Direction</h1>
        <p className='text-xs text-white/70 mb-3'>Choose one direction to extend.</p>
      </div>

      <div className='grid grid-cols-2 gap-2'>
        {Directions.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            onClick={() => SelectDirection(key)}
            variant={selectDirection === key ? 'default' : 'outline'}
            className={`flex items-center gap-2 ${selectDirection === key ? 'bg-cyan-500 hover:bg-cyan-600' : ''}`}>
            <Icon className='h-4 w-4' />
            {label}
          </Button>
        ))}
      </div>

      <div>
        <div className='flex justify-between items-center mb-2'>
          <label className='text-white text-sm'>Extension Amount</label>
          <span className='text-xs text-white/70'>{extensionAmount}px</span>
        </div>

        <Slider value={[extensionAmount]} min={50} max={500} step={25} className='w-full' disabled={!selectDirection} onValueChange={([value]) => setExtensionAmount(value)} />
      </div>

      {selectDirection && (
        <div className='bg-slate-700/30 rounded-lg p-3'>
          <h4 className='text-sm font-medium text-white mb-2'>Preview</h4>
        <div className='text-xs space-y-1 text-white/70'>
          <div >
            Current: {Math.round(currentImage?.width!) * (currentImage?.scaleX || 1)} x {Math.round(currentImage?.height!) * (currentImage?.scaleY || 1)}px
          </div>

          <div className='text-cyan-400'>
            Extended: {newWidth} x {newHeight}px
          </div>
        </div>
        </div>
      )}

      <Button
      variant={'primary'}
      onClick={applyExtension}
      disabled={!selectDirection}
      className='w-full'
      ><Wand2 className='h-4 w-4 mr-2' />Apply AI extension</Button>
    </div>
  )
}

export default AiExtendTool

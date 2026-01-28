import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/use-context';
import { set } from 'date-fns';
import { FabricImage, filters } from 'fabric';
import { Loader2, RotateCcw } from 'lucide-react';
import { config } from 'process';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

type AdjustKey =
    | 'brightness'
    | 'contrast'
    | 'saturation'
    | 'vibrance'
    | 'blur'
    | 'hue';

interface AdjustTools {
    key: AdjustKey;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    filterClass: any;
    valueKey: string;
    transform: (val: number) => number;
    suffix?: string;
}

const ADJUST_CONFIG: AdjustTools[] = [
    {
        key: "brightness",
        label: "Brightness",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Brightness,
        valueKey: "brightness",
        transform: (value) => value / 100,
    },
    {
        key: "contrast",
        label: "Contrast",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Contrast,
        valueKey: "contrast",
        transform: (value) => value / 100,
    },
    {
        key: "saturation",
        label: "Saturation",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Saturation,
        valueKey: "saturation",
        transform: (value) => value / 100,
    },
    {
        key: "vibrance",
        label: "Vibrance",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Vibrance,
        valueKey: "vibrance",
        transform: (value) => value / 100,
    },
    {
        key: "blur",
        label: "Blur",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Blur,
        valueKey: "blur",
        transform: (value) => value / 100,
    },
    {
        key: "hue",
        label: "Hue",
        min: -180,
        max: 180,
        step: 1,
        defaultValue: 0,
        filterClass: filters.HueRotation,
        valueKey: "rotation",
        transform: (value) => value * (Math.PI / 180),
        suffix: "°",
    },
]

const DEFAULT_VALUES = ADJUST_CONFIG.reduce((acc, config) => {
    acc[config.key] = config.defaultValue;
    return acc;
}, {} as Record<string, number>)

const AdjustControl = () => {

    const [isApplying, setIsApplying] = useState<boolean>(false);
    const [filterValues, setFilterValues] = useState<Record<string, number>>(DEFAULT_VALUES);
    const { canvasEditor } = useCanvas();


    const resetAll = () => {
        setFilterValues(DEFAULT_VALUES);
        applyFilters(DEFAULT_VALUES);
    }

    const getActiveImage = (): FabricImage | null => {
        if (!canvasEditor) return null;

        const activeObj = canvasEditor.getActiveObject();

        if (activeObj && activeObj.type === 'image') {
            return activeObj as FabricImage;
        }

        const objs = canvasEditor.getObjects();
        return objs.find((obj) => obj.type === 'image') as FabricImage || null;
    }

    const applyFilters = async (newValues: Record<string, number>) => {
        const imageObj = getActiveImage();
        if (!imageObj || isApplying) {
            return;
        }

        if (!canvasEditor) return;

        setIsApplying(true);
        try {
            const filtersToApply: any[] = [];
            ADJUST_CONFIG.forEach((config) => {
                const value = newValues[config.key];
                if (value !== config.defaultValue) {
                    const transformedValue = config.transform(value);
                    filtersToApply.push(new config.filterClass({ [config.valueKey]: transformedValue }));
                }
            })

            imageObj.filters = filtersToApply;

            await new Promise<void>((resolve) => {
                imageObj.applyFilters();
                canvasEditor.requestRenderAll();
                setTimeout(resolve, 50)
            });
        } catch (error) {
            console.error('Error applying filters:', error);
            toast.error('Failed to apply filters. Please try again.');
        } finally {
            setIsApplying(false);
        }
    }

    const extractFilterValues = (imageObj: FabricImage) => {
        if (!imageObj.filters.length) {
            return DEFAULT_VALUES;
        }
        const extractedValues = { ...DEFAULT_VALUES };
        imageObj.filters.forEach((filter) => {
            const config = ADJUST_CONFIG.find((c) => c.filterClass.name === filter.constructor.name);
            if (config) {
                const value = (filter as any)[config.valueKey];
                if(config.key === 'hue') {
                    extractedValues[config.key] = Math.round(value * (180/Math.PI));
                }
                else {
                    extractedValues[config.key] = Math.round(value * 100);
                }
            }
        })

        return extractedValues;
    }

    useEffect(() => {
        const imageObj = getActiveImage();

        if(imageObj?.filters) {
            const existingValues = extractFilterValues(imageObj);
            setFilterValues(existingValues);
        }
    },[])



    const handleValueChange = (key: string, value: number[]) => {
        const newValues = {
            ...filterValues,
            [key]: Array.isArray(value) ? value[0] : value
        }
        setFilterValues(newValues);
        applyFilters(newValues);
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
            <div className='flex justify-between items-center'>
                <h3 className='text-sm font-medium text-white'>Image Adjustments</h3>{" "}
                <Button variant={'ghost'} size={'sm'} onClick={resetAll} className='text-white/70 hover:text-white'>
                    <RotateCcw className='h-5 w-5 mr-2' /> Reset
                </Button>
            </div>

            {ADJUST_CONFIG.map((config) => (
                <div className='space-y-2' key={config.key}>
                    <div className='flex justify-between items-center'>
                        <Label className='text-sm text-white'>{config.label}</Label>
                        <span className='text-xs text-white/70 min-w-[3rem] text-right'>
                            {filterValues[config.key]}
                            {config.suffix || ""}
                        </span>
                    </div>
                    <Slider
                        value={[filterValues[config.key]]}
                        onValueChange={(value) => handleValueChange(config.key, value)}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        className='w-full '
                    />
                </div>
            ))}

            <div className='mt-6 p-3 bg-slate-700/50 rounded-lg'>
                <p className='text-xs text-white/70'>Adjustment are applying in real time. Use reset button to restoer original values.</p>
            </div>

            {isApplying && (
                <div className='flex justify-center items-center py-2'>
                    <Loader2 className='h-5 w-5 animate-spin' />
                    <p className='text-white/70 ml-2 text-xs'>Applying Filters...</p>
                </div>
            )}
        </div>
    )
}

export default AdjustControl

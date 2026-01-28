import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/use-context';
import { set } from 'date-fns';
import { IText } from 'fabric';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Strikethrough, Trash2, Type, Underline } from 'lucide-react';
import React, { useEffect, useState } from 'react'

const FONT_FAMILIES = [
    "Arial",
    "Arial Black",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Comic Sans MS",
    "Impact",
];

const FONT_SIZES = { min: 8, max: 120, default: 20 };


const TextControl = () => {

    const [fontSize, setFontSize] = useState(FONT_SIZES.default);
    const [fontFamily, setFontFamily] = useState<string>('Arial');
    const [selectedText, setSelectedText] = useState<IText | null>(null);
    const [textColor, setTextColor] = useState<string>('#000000');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
    const [_, setChanged] = useState(0);

    const { canvasEditor } = useCanvas();

    const addText = () => {
        if (!canvasEditor) {
            return;
        }

        const text = new IText("Edit this Text", {
            left: canvasEditor.width / 2,
            top: canvasEditor.height / 2,
            originX: 'center',
            originY: 'center',
            fontFamily,
            fontSize,
            fill: textColor,
            textAlign,
            editable: true,
            selectable: true
        });

        canvasEditor.add(text);
        canvasEditor.setActiveObject(text);
        canvasEditor.requestRenderAll();

        setTimeout(() => {
            text.enterEditing();
            text.selectAll();
        }, 100)
    }

    const applyFontSize = (size: number) => {
        if (!selectedText) return;
        if (!canvasEditor) return;

        const newSize = Array.isArray(size) ? size[0] : size;
        setFontSize(newSize);
        selectedText.set("fontSize", newSize);
        canvasEditor.requestRenderAll();
    }

    const applyFontFamily = (font: string) => {
        if (!canvasEditor) return;

        if (!selectedText) return;

        setFontFamily(font);
        selectedText.set({ "fontFamily": font });
        canvasEditor.requestRenderAll();
    }

    const applyTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
        if (!canvasEditor) return;
        if (!selectedText) return;

        setTextAlign(align);
        selectedText.set({ "textAlign": align });
        canvasEditor.requestRenderAll();
    }

    const toggleFormat = (format: 'bold' | 'italic' | 'underline' ) => {
         if (!canvasEditor) return;
        if (!selectedText) return;

        switch (format) {
            case "bold":
                selectedText.set("fontWeight", selectedText.fontWeight === 'bold' ? 'normal' : 'bold');
                break;
                case "italic":
                selectedText.set("fontStyle", selectedText.fontStyle === 'italic' ? 'normal' : 'italic');
                break;
                case "underline":
                selectedText.set("underline", !selectedText.underline);
                break;
      
        }
        canvasEditor.requestRenderAll();
        setChanged(prev => prev + 1);
    }

    const deleteSelectedtext = () => {
        if (!canvasEditor) return;
        if(!selectedText) return;

        canvasEditor.remove(selectedText);
        canvasEditor.requestRenderAll();
        setSelectedText(null)
    }

    const applyTextColor = (color: string) => {
        if (!canvasEditor) return;
        if (!selectedText) return;

        setTextColor(color);
        selectedText.set("fill", color);

        canvasEditor.requestRenderAll();
    }

    const updateSelectedText = () => {
        if (!canvasEditor) {
            return;
        }
        const activeObject = canvasEditor.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            const textObj = activeObject as IText;
            setSelectedText(textObj);
            setFontSize(textObj.fontSize as number || FONT_SIZES.default);
            setFontFamily(textObj.fontFamily as string || 'Arial');
            setTextColor(textObj.fill as string || '#000000');
            setTextAlign(textObj.textAlign as 'left' | 'center' | 'right' | 'justify' || 'left');
        } else {
            setSelectedText(null);
        }
    }


    useEffect(() => {

        if (!canvasEditor) return;
        updateSelectedText()

        const handleSelectionCreated = () => updateSelectedText();
        const handleSelectionUpdated = () => updateSelectedText();
        const handleSelectionCleared = () => setSelectedText(null);

        canvasEditor.on('selection:cleared', handleSelectionCleared);
        canvasEditor.on('selection:updated', handleSelectionUpdated);
        canvasEditor.on('selection:created', handleSelectionCreated);

        return () => {
            canvasEditor.off('selection:cleared', handleSelectionCleared);
            canvasEditor.off('selection:created', handleSelectionCreated);
            canvasEditor.off('selection:updated', handleSelectionUpdated);
        }
    }, [canvasEditor])

    if (!canvasEditor) {
        return (
            <div className='p-4'>
                <p className='text-sm text-white/70'>Canvas Not Ready</p>
            </div>
        )
    }
    return (
        <div className='space-y-6'>
            <div className='space-y-4'>
                <div>
                    <h3 className='text-sm font-medium text-white mb-2'>Add Text</h3>
                    <p className='mb-4 text-sm text-white/70'>Click to add editable text to your Canvas.</p>
                </div>
                <Button variant={'primary'} className='w-full' onClick={addText}><Type className='mr-2 h-5 w-5' />Add Text</Button>
            </div>
            {selectedText && (
                <div className='border-t border-white/10 pt-6'>
                    <h3 className='text-sm font-medium text-white mb-4'>Edit Selected Text</h3>
                    <div className='space-y-2 mb-4'>
                        <label className='text-xs text-white/70'>Font Family</label>
                        <select value={fontFamily}
                            onChange={(e) => applyFontFamily(e.target.value)}
                            className='w-full px-3 py-2 my-2 bg-slate-700 border border-white/20 rounded text-white text-sm'>
                            {FONT_FAMILIES.map((font) => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </select>
                    </div>

                    <div className='space-y-2 mb-4'>
                        <div className='flex justify-between items-center'>
                            <label className='text-xs text-white/70' >Font Size: </label>
                            <span className='text-xs text-white/70' >{fontSize}px</span>
                        </div>
                        <Slider value={[fontSize]} onValueChange={(e) => applyFontSize(e[0])} min={FONT_SIZES.min} max={FONT_SIZES.max} step={1} className='w-full' />
                    </div>

                    <div className='space-y-2 mb-4'>
                        <label className='text-xs text-white/70' >Text Alignment</label>
                        <div className='grid grid-cols-4 gap-2'>
                            {([
                                ['left', AlignLeft],
                                ['right', AlignRight],
                                ['center', AlignCenter],
                                ['justify', AlignJustify],
                            ] as const).map(([align, Icon]) => (
                                <Button key={align as string}
                                    onClick={() => applyTextAlign(align as 'left' | 'center' | 'right' | 'justify')}
                                    size={'sm'} className='p-2'
                                    variant={textAlign === align ? 'default' : 'outline'}
                                >
                                    <Icon className='h-4 w-4' />
                                </Button>
                            ))
                            }
                        </div>
                    </div>
                    <div className='space-y-2 mb-4'>
                        <label className='text-xs text-white/70' >Text Color</label>
                        <div className='flex gap-2'>
                            <input type='color' value={textColor} onChange={(e) => applyTextColor(e.target.value)} className='w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer' />
                            <Input value={textColor} onChange={(e) => applyTextColor(e.target.value)} className='flex-1 bg-slate-700 border-white/20 text-white text-sm' placeholder='#000000' />
                        </div>
                    </div>

                    <div className='space-y-2 mb-4'>
                        <label className='text-xs text-white/70' >Formatting</label>
                        <div className='flex gap-2'>

                        <Button onClick={() => toggleFormat('bold')} variant={selectedText.fontWeight === 'bold' ? 'default' : 'outline'} size={'sm'} className='flex-1' >
                            <Bold className='h-5 w-5' />
                        </Button>

                        <Button onClick={() => toggleFormat('italic')} variant={selectedText.fontStyle === 'italic' ? 'default' : 'outline'} size={'sm'} className='flex-1' >
                             <Italic className='h-5 w-5 ml-2' />
                        </Button>

                        <Button onClick={() => toggleFormat('underline')} variant={selectedText.underline ? 'default' : 'outline'} size={'sm'} className='flex-1' >
                            <Underline className='h-5 w-5 ml-2' />
                        </Button>
                        </div>

                        
                    </div>
                    <Button
                    onClick={deleteSelectedtext}
                    variant={'outline'}
                    className='w-full text-red-400 border-red-400/20 hover:bg-red-400/10'>
                        <Trash2 className='h-5 w-5 mr-2' /> Delete Text
                    </Button>
                </div>


            )}

            <div className='bg-slate-700/30 rounded-lg p-3 '>
                <p className='text-xs text-white/70'>
                    <strong>Double Click</strong> any text to edit it directly on the canvas.
                    <br />
                    <strong>Select</strong> text to see more editing options.
                </p>
            </div>
        </div>
    )
}

export default TextControl

import { Project } from '@/app/(main)/dashboard/_components/project-card'
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCanvas } from '@/context/use-context';
import { FabricImage } from 'fabric';
import { HexColorPicker } from 'react-colorful';
import { Download, ImageIcon, ImagesIcon, Loader2, Palette, Search, SparkleIcon, Trash, Trash2 } from 'lucide-react';
import React, { useState } from 'react'
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { set } from 'date-fns';

interface AiBackgroundProps {
    project: Project;
}

interface UnsplashImage {
    id: string;
    urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string | null;
    user: {
        name: string;
        username: string;
    };
    width: number;
    height: number;
}

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

const AiBackground = ({ project }: AiBackgroundProps) => {

    const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
    const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [aiPrompt, setAiPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    console.log("Project in AI background tool: ", project);



    const handleBackgroundRemoval = async () => {
        const mainImage = getMainImage();
        if (!mainImage || !canvasEditor || !project) {
            return;
        }

        setProcessingMessage("Removing background with AI...");

        try {
            const currentImageUrl = project.currentImageUrl || project.originalImageUrl;
            console.log("Image url: ", currentImageUrl);

            const bgRemovedUrl = currentImageUrl.includes('ik.imagekit.io') ? `${currentImageUrl.split('?')[0]}?tr=e-bgremove` : currentImageUrl;

            const processedImage = await FabricImage.fromURL(bgRemovedUrl, {
                crossOrigin: 'anonymous',
            })

            const currentProps = {
                left: mainImage.left,
                top: mainImage.top,
                scaleX: mainImage.scaleX,
                scaleY: mainImage.scaleY,
                angle: mainImage.angle,
                originX: mainImage.originX,
                originY: mainImage.originY,
            }

            canvasEditor.remove(mainImage);
            processedImage.set(currentProps);
            canvasEditor.add(processedImage);
            processedImage.setCoords();

            canvasEditor.setActiveObject(processedImage);
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
            toast.success("Background removed successfully!");
        } catch (error) {
            console.error("Erorr removing background: ", error);
            toast.error("Failed to remove background. Please try again.");
        }
    }

    const handleColorBackground = () => {
        if (!canvasEditor) return;

        canvasEditor.backgroundImage = undefined
        canvasEditor.backgroundColor = backgroundColor;
        canvasEditor.requestRenderAll();
    }

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleImageSearch();
        }
    }

    const handleImageSearch = async () => {
        if (!searchQuery.trim() || !UNSPLASH_ACCESS_KEY) {
            return;
        }

        setIsSearching(true);
        try {
            console.log('Starting fetch for query:', searchQuery);

            const response = await fetch(`${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12`, {
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            });

            console.log("Response status:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error:", errorText);
                toast.error("Failed to fetch images from Unsplash");
                return;
            }

            const data = await response.json();
            console.log("Full API response:", data);
            console.log("Results array:", data.results);
            console.log("Number of images:", data.results?.length);

            setUnsplashImages(data.results);

        } catch (error) {
            console.error("Error in geting searched images: ", error);
            toast.error("Failed to fetch images. Please try again.");

        }
        finally {
            setIsSearching(false);
        }

        console.log("unsplash imgs: ", unsplashImages);

    }

    const handleRemoveBackground = () => {
        if (!canvasEditor) return;

        canvasEditor.backgroundImage = undefined;
        canvasEditor.backgroundColor = 'transparent';
        canvasEditor.requestRenderAll();
        toast.success("Background Removed Successfully");
    }

    const handleUpdateBackground = async() => {
        const mainImage = getMainImage();
        if(!canvasEditor || !mainImage) return;
        setIsGenerating(true);

        try {
            const currentImageUrl = project.currentImageUrl || project.originalImageUrl;
            console.log("Current image url: ", currentImageUrl);
            const updatedUrl = currentImageUrl.includes('ik.imagekit.io') ? `${currentImageUrl.split('?')[0]}?tr=e-changebg-prompt-${aiPrompt}` : currentImageUrl;
            const processedImage = await FabricImage.fromURL(updatedUrl, {
                crossOrigin : 'anonymous'
            });

            const currentProps = {
                left: mainImage.left,
                top: mainImage.top,
                scaleX: mainImage.scaleX,
                scaleY: mainImage.scaleY,
                angle: mainImage.angle,
                originX: mainImage.originX,
                originY: mainImage.originY,
            }

            canvasEditor.remove(mainImage);
            processedImage.set(currentProps);
            canvasEditor.add(processedImage);
            processedImage.setCoords();

            canvasEditor.setActiveObject(processedImage);
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
            
            toast.success("Background removed successfully!");
        } catch (error) {
            console.error("Erorr removing background: ", error);
            toast.error("Failed to remove background. Please try again.");
        }
        finally {
            setIsGenerating(false);
        }
    }

    const handleImageBackground = (imageUrl: string, imageId: string) => async () => {
        if (!canvasEditor) return;

        setSelectedImageId(imageId);
        try {
            if (UNSPLASH_API_URL) {
                await fetch(`${UNSPLASH_API_URL}/photos/${imageId}/download`, {
                    headers: {
                        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }).catch(() => { })
            }

            const fabricImage = await FabricImage.fromURL(imageUrl, {
                crossOrigin: 'anonymous'
            })

            const canvasHeight = project.height;
            const canvasWidth = project.width;

            const scaleX = canvasWidth / fabricImage.width;
            const scaleY = canvasHeight / fabricImage.height;

            const scale = Math.max(scaleX, scaleY);

            fabricImage.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: canvasWidth / 2,
                top: canvasHeight / 2
            })

            canvasEditor.backgroundImage = fabricImage;
            canvasEditor.requestRenderAll();
            setSelectedImageId(null);
            toast.success("Background Updated Successfully")
        } catch (error) {
            console.log("Error updating bgr: ", error);
            toast.error("Failed to update Background image. Please Try again!");
            setSelectedImageId(null);


        }
    }
    const getMainImage = () => {
        if (!canvasEditor) return null;

        const objects = canvasEditor.getObjects();
        return objects.find(obj => obj.type === 'image');
    }
    if(!canvasEditor) {
        return (
            <div className='p-4'>
                <p className='text-sm text-white/70'>Canvas Not Ready</p>
            </div>
        )
    }
    return (
        <div className='h-full space-y-6 relative'>
            <div>
                <div>
                    <h3 className='text-sm font-medium text-white mb-2'>AI Background Removal</h3>
                    <p className='text-xs text-white/70 mb-4'>Automatically remove backgrounds from images using AI technology.</p>
                </div>

                <Button className='w-full' onClick={handleBackgroundRemoval} disabled={!!processingMessage || !getMainImage()} variant={'primary'}><Trash2 className='h-5 w-5 mr-2' />Remove Image Background</Button>
                {
                    !getMainImage() && (
                        <p className='text-xs text-amber-400'>Please add image to the canvas to remove background.</p>
                    )
                }
            </div>

            <Tabs defaultValue='color' className='w-full'>
                <TabsList className='bg-slate-700/50 w-full grid grid-cols-3'>
                    <TabsTrigger value='color' className='data-[state=active]:bg-cyan-500 data-[state=active]:text-white' >
                        <Palette className='h-5 w-5 mr-2' /> Color
                    </TabsTrigger>
                    <TabsTrigger value='image' className='data-[state=active]:bg-cyan-500 data-[state=active]:text-white'>
                        <ImageIcon className='h-5 w-5 mr-2' /> Image
                    </TabsTrigger>
                    <TabsTrigger value='ai'  className='data-[state=active]:bg-cyan-500 data-[state=active]:text-white' >
                        <SparkleIcon className='h-5 w-5 mr-2' /> AI
                    </TabsTrigger>


                </TabsList>
                <TabsContent value='color' className='space-y-4 mt-6'>
                    <div>
                        <h3 className='mb-2 text-white font-medium text-sm'>
                            Solid Color Background
                        </h3>
                        <p className='text-xs text-white/70 mb-4'>Choose a Solid color for your canvas background</p>
                    </div>

                    <div className='space-y-4'>
                        <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} style={{ width: '100%' }} />

                        <div className='flex items-center gap-2 '>
                            <Input
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className='flex-1 bg-slate-700 text-white border-white/20'
                                placeholder='#ffffff'
                            />
                            <div className='w-10 h-10 rounded border border-white/20' style={{ backgroundColor: backgroundColor }} />
                        </div>

                        <Button className='w-full' variant={'primary'} onClick={handleColorBackground}><Palette className='h-5 w-5 mr-2' />Apply Color</Button>
                    </div>
                </TabsContent>
                <TabsContent value='image' className='space-y-4 mt-6'>
                    <div>
                        <h3 className='mb-2 text-white font-medium text-sm'>Image Background</h3>
                        <p className='text-xs text-white/70 mb-4'>Search and use high-quality images</p>
                    </div>

                    <div className='flex gap-2'>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            placeholder='Search for Backgrounds'
                            className='flex-1 bg-slate-700 text-white border-white/20'
                        />
                        <Button
                            onClick={handleImageSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            variant={'primary'}
                        >
                            {isSearching ? (
                                <Loader2 className='h-5 w-5 animate-spin' />
                            ) : (
                                <Search className='h-5 w-5' />
                            )}
                        </Button>
                    </div>

                    {unsplashImages.length > 0 && (
                        <div className='space-y-3'>
                            <h4 className='text-sm font-medium text-white'>Search Results: ({unsplashImages.length})</h4>
                            <div className='grid grid-cols-2 gap-3 max-h-96 overflow-y-auto'>
                                {unsplashImages.map((img) => (
                                    <div onClick={handleImageBackground(img.urls.regular, img.id)}
                                        key={img.id} className='relative group cursor-pointer overflow-hidden border rounded-lg transition-colors border-white/10 hover:border-cyan-500'>
                                        <img src={img.urls.small} alt={img.alt_description || 'Background Image'} className='w-full h-24  object-cover transform group-hover:scale-105 transition-transform' />

                                        {selectedImageId === img.id && (
                                            <div className='absolute inset-0 bg-black/50   flex items-center justify-center'>
                                                <Loader2 className='w-5 h-5 animate-spin text-white' />
                                            </div>
                                        )}

                                        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100'>
                                            <Download className='w-5 h-5 text-white' />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    )}

                    {!isSearching && unsplashImages.length === 0 && searchQuery.trim() && (
                        <div className="text-center py-8">
                            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-white/30" />
                            <p className='text-white/70 text-sm'>No Results Found for "{searchQuery}"</p>
                            <p className='text-xs text-white/50'>Try a different search term</p>
                        </div>
                    )}

                    {!searchQuery && unsplashImages.length === 0 && (
                        <div className='text-center py-8'>
                            <Search className="mx-auto mb-4 h-12 w-12 text-white/30" />
                            <p className='text-white/70 text-sm'>Search for background images</p>

                        </div>
                    )}
                </TabsContent>
                <TabsContent value='ai' className='space-y-4 mt-6'>
                    <div>
                        <h3 className='mb-2 text-white font-medium text-sm'>AI Generated Background</h3>
                        <p className='text-xs text-white/70 mb-4'>Create custom backgrounds using AI from text descriptions</p>
                    </div>

                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <label className='text-xs text-white/70'>Describe your background</label>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder='e.g., A serene mountain landscape at sunset with vibrant orange and purple sky'
                                className='w-full px-3 py-2 bg-slate-700 text-white border border-white/20 rounded text-sm resize-none h-24'
                                disabled={isGenerating}
                            />
                            <p className='text-xs text-white/50'>Be specific and descriptive for best results</p>
                        </div>

                        <Button
                            onClick={() => handleUpdateBackground()}
                            disabled={isGenerating || !aiPrompt.trim()}
                            variant={'primary'}
                            className='w-full'
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className='h-5 w-5 mr-2 animate-spin' />
                                    Generating Background...
                                </>
                            ) : (
                                <>
                                    <SparkleIcon className='h-5 w-5 mr-2' />
                                    Generate Background
                                </>
                            )}
                        </Button>

                        {!isGenerating && !aiPrompt.trim() && (
                            <div className='text-center py-8'>
                                <SparkleIcon className="mx-auto mb-4 h-12 w-12 text-white/30" />
                                <p className='text-white/70 text-sm'>Enter a prompt to generate</p>
                                <p className='text-xs text-white/50'>Describe the background you want to create</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <div className='border-t bottom-0 w-full pt-4 border-white/10'>
                <Button
                    onClick={handleRemoveBackground}
                    variant={'outline'}
                    className='w-full'

                >
                    <Trash2 className='h-5 w-5 mr-2' /> Remove Canvas Background
                </Button>
            </div>
        </div>
    )
}

export default AiBackground

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/convex/_generated/api'
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query'
import { usePlanAccess } from '@/hooks/use-plan-access'
import { Crown, ImageIcon, Loader, Loader2, ReceiptTurkishLira, Terminal, Upload, X } from 'lucide-react'

import { useDropzone } from 'react-dropzone'
import axios from 'axios';
import React, { useCallback, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Project } from './project-card'

type NewProjectModelProps = {
    isOpen: boolean;
    onClose: () => void;
}


const NewProjectModel = ({ isOpen, onClose }: NewProjectModelProps) => {

    const { userPlan, canCreateProject } = usePlanAccess();
    const { data: projects } = useConvexQuery<Project[]>(api.projects.getUserProjects, undefined);
    const { mutate: createProject } = useConvexMutation(api.projects.create);

    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [projectTitle, setProjectTitle] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false);
    const [showUpgradeModel, setShowUpgradeModel] = useState(false);

    const router = useRouter();


    console.log("Data is of convexQuery: ", projects);
    console.log("data is of mutate convex: ", createProject);

    const currentProjectCount = projects?.length || 0;

    const isFree = userPlan === 'free_user';
    const canCreate = canCreateProject(currentProjectCount);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log("AcceptedFile: ", acceptedFiles);
        const file = acceptedFiles[0];

        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));

            const nameWithoutEX = file.name.replace(/\.[^/.]+$/, "");
            setProjectTitle(nameWithoutEX || "Untitled Project")
        }

    }, [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'images/*': ['.png', '.jpg', 'jpeg', '.webp', '.gif'] }, maxFiles: 1, maxSize: 20 * 1024 * 1024
    });
    const handleClose = () => {
        setIsUploading(false);
        setPreviewUrl('');
        setProjectTitle('');
        setSelectedFile(null);
        onClose();
    }
    const handleCreateProject = async () => {
        if(!canCreate) {
            toast.error("Project Limit reached. Upgrade to Pro to create more Projects");
            setShowUpgradeModel(true);
            return;
        }
        if(!selectedFile || !projectTitle.trim()) {
            toast.error("Please select a Image and enter a valid Title");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('fileName', selectedFile.name);

           

            const uploadResult = await axios.post('/api/imagekit/upload', formData, {
               headers : {
                'Content-Type' : 'multipart/form-data'
               }
            });

            const uploadedData = uploadResult.data;
            console.log("Result got from imagekit on uploading: ", uploadedData);

            if(!uploadedData.success) {
                throw new Error(uploadedData.error || "Failed to upload image");
            }
            console.log("Uploading data: ", uploadedData);
            
            const projectId = await createProject({
                title: projectTitle.trim(),
                originalImageUrl: uploadedData.url,
                currentImageUrl: uploadedData.url,
                thumbnailUrl: uploadedData.thumbnailUrl,
                width: uploadedData.width || 800,
                height: uploadedData.height || 600,
                canvasState: null
            })
            toast.success("Project created Successfully🎉🎉");
            router.push(`/editor/${projectId}`)
        } catch (error) {
            console.log("Error creating project: ", error);
            toast.error("Error in creating project");
            return;
            
        }
        finally {
            setIsUploading(false);
        }
    }
    return (
        <>
            <Dialog onOpenChange={handleClose} open={isOpen}>
                <form>

                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className='text-2xl font-bold text-white'>Create new Project</DialogTitle>

                            {isFree && (
                                <Badge variant={'secondary'} className='bg-slate-700 text-white/70' >{currentProjectCount}/3 Projects</Badge>
                            )}
                        </DialogHeader>

                        {isFree && currentProjectCount >= 2 && (
                            <div className='space-y-6'>
                                <Alert className='bg-amber-500/10 border-amber-500/20'>
                                    <Crown className='h-5 w-5 text-amber-400' />

                                    <AlertDescription className='text-amber-300/80'>
                                        <div className='font-semibold text-amber-400 mb-1'>
                                            {currentProjectCount === 2 ? 'Last free Project' : 'Project Limit Reached'}
                                            {currentProjectCount === 2 ? 'This will be your last free projects. Upgrade to Pixnoma Pro for unlimited projects' : 'Free plan is limited to 3 projects. Upgrade to Pixnoma Pro for creating more projects'}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {!selectedFile ? (
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all 
                            ${isDragActive ? 'border-cyan-400 bg-cyan-400/5' : 'border-white/20 hover:border-white/40'}
                            ${!canCreate ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input {...getInputProps()} />
                                <Upload className='h-12 w-12 text-white/50 mb-4 mx-auto' />
                                <h3 className='text-xl font-semibold text-white mb-2'>{isDragActive ? 'Upload your Image here' : 'Upload an Image'}</h3>
                                <p className='text-white/70 mb-4'>{canCreate ? 'Drag n Drop your Image, or Click to Browse' : 'Upgrade to Pro to create more Projects'}</p>
                                {" "}
                                <p className='text-white/50 text-sm'>Supports PNG JPG JPEG WEBP UPTO 20MB</p>

                            </div>
                        ) : (

                            <div className='space-y-6'>
                                <div className='relative'>
                                    <Image src={previewUrl} width={50} height={40} alt='Image Uploaded' className='w-full h-64 object-cover rounded-xl border border-white/10' />
                                    <Button variant={'ghost'} size={'icon'} onClick={() => {
                                        setSelectedFile(null);
                                        setPreviewUrl('');
                                        setProjectTitle('');
                                    }} className=' absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white'>
                                        <X className='h-4 w-4' />
                                    </Button>
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor='project-title' className='text-white' >Project Title</Label>
                                    <Input id='project-title' type='text' value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder='Enter project name...' className='bg-slate-700 border-white/20 text-white placeholder-whit/50 focus:border-cyan-400 focus:ring-cyan-400' />
                                </div>

                                <div className='bg-slate-700/50 rounded-lg p-4 '>
                                    <div className='flex items-center gap-3'>
                                        <ImageIcon className='h-5 w-5 text-cyan-400' />
                                        <div>
                                            <p className='text-white font-medium'>
                                                {selectedFile.name}
                                            </p>
                                            <p className='text-white/70 text-sm'>
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>

                                </div>
                            </div>



                        )}

                        <DialogFooter className='gap-4'>
                            <Button variant={'ghost'} onClick={handleClose} disabled={isUploading} className='text-white/70 hover:text-white'>Cancel</Button>
                            <Button variant={'primary'} disabled={!selectedFile || !projectTitle.trim() || isUploading} onClick={handleCreateProject} className='text-white/70 hover:text-white'>{
                                isUploading ? (
                                    <><Loader2 className='h-5 w-5 animate-spin' /> Creating...</>
                                ) : (
                                    'Create Project'
                                )
                            }</Button>
                        </DialogFooter>
                    </DialogContent>
                </form>

            </Dialog>
        </>
    )
}

export default NewProjectModel

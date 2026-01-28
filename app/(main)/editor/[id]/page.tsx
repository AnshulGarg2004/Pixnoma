'use client'
import { CanvasContext } from '@/context/use-context';
import { api } from '@/convex/_generated/api';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { Loader2, Monitor } from 'lucide-react';
import { useParams } from 'next/navigation'
import React, { useState } from 'react'
import { RingLoader } from 'react-spinners';
import CanvasEditor from './_components/canvas';
import { Project } from '../../dashboard/_components/project-card';
import { Canvas } from 'fabric';
import EditorTopbar from './_components/editor-topbar';
import EditorSidebar from './_components/editor-sidebar';

const EditorPage = () => {
    const params = useParams();
    const id = params.id;

    const [canvasEditor, setCanvasEditor] = useState<Canvas | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState("resize");
    const { data: project, isLoading, error } = useConvexQuery<Project>(api.projects.getProjects, { projectId: id });

    if (isLoading) {
        return (
            <div className='flex items-center justify-center bg-slate-900 min-h-screen'>
                <div className='flex items-center flex-col gap-4'>
                    <Loader2 className=' animate-spin h-8 w-8 text-cyan-400' />
                    <p className='text-white/70'>Loading...</p>
                </div>
            </div>
        )
    }

    if (error || !project) {
        return (<div className='flex items-center justify-center bg-slate-900 min-h-screen'>
            <div className='text-center'>
                <h1 className='text-2xl font-bold text-white mb-2 '>Project Not Found</h1>
                <p className='text-white/70'>The project you are looking doest not exist or you don't have the access to it! </p>
            </div>
        </div>)
    }

    return (
        <CanvasContext.Provider value={{ canvasEditor, setCanvasEditor, activeTool, onToolChange: setActiveTool, processingMessage, setProcessingMessage }}>
            <div className='md:hidden min-h-screen bg-slate-900 flex items-center justify-center p-6'>
                <div className='max-w-md text-center'>
                    <Monitor className='h-16 w-16 text-cyan-400 mx-auto mb-6' />
                    <h1 className='text-2xl font-bold text-white mb-4'>Desktop Required</h1>
                    <p className='text-white/70 text-lg mb-2'>This feature is only available for desktop</p>
                    <p className='text-white/50 text-sm'>Please use a larger screen to access the full experience</p>
                </div>
            </div>
            <div className='hidden md:block min-h-screen bg-slate-900 flex flex-col'>
                <div>
                    {processingMessage && (
                        <div className='fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center'>
                            <div className='rounded-lg p-6 flex flex-col items-center gap-4'>
                                <RingLoader className='#fff' />
                                <div className='text-center'>
                                    <p className='text-white font-medium'>{processingMessage}</p>
                                    <p className='text-white/70 text-sm mt-1'>Please wait, do not switch tabs or navigate away</p>
                                </div>
                            </div>
                        </div>)}
                </div>
                <EditorTopbar project={project} />
                <div className='flex flex-1 overflow-hidden'>
                    <EditorSidebar project={project}></EditorSidebar>
                    <div className='flex-1 bg-slate-800'>
                        <CanvasEditor project={project}></CanvasEditor>
                    </div>
                </div>
            </div>

        </CanvasContext.Provider>
    )
}

export default EditorPage

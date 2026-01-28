'use client'
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { useQuery } from 'convex/react'
import { Plus, Sparkles } from 'lucide-react';
import React, { useState } from 'react'
import { BarLoader } from 'react-spinners';
import NewProjectModel from './_components/new-project-model';
import ProjectGrid from './_components/project-grid';
import { Project } from './_components/project-card';


const Dashboard = () => {
    const { data: projects, isLoading } = useConvexQuery<Project[]>(api.projects.getUserProjects, undefined);

    console.log('got data to display: ', projects);
    console.log('this will take to project grid');

    const [showDataModel, setShowDataModel] = useState(false);
    return (
        <div className="min-h-screen pt-32 pb-16">
            <div className="container mx-auto px-6 max-w-6xl">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold mb-2 text-white">
                            Your{" "}
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                Projects
                            </span>
                        </h1>
                        <p className="text-white/70 max-w-md">
                            Create and manage your AI powered image designs
                        </p>
                    </div>

                    <Button
                        onClick={() => setShowDataModel(true)}
                        variant="primary"
                        size="xl"
                        className="gap-2 self-center md:self-auto"
                    >
                        <Plus className="h-5 w-5" />
                        Create New Project
                    </Button>
                </div>

                {/* CONTENT */}
                {isLoading ? (
                    <div className="mt-16">
                        <BarLoader color="white" width="100%" />
                    </div>
                ) : projects && projects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                         <ProjectGrid projects={projects} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center mt-24">
                        <h3 className="font-semibold text-2xl text-white mb-3">
                            Create your first project
                        </h3>
                        <p className="text-white/70 mb-8 max-w-md">
                            Upload an image to start editing with our AI powered tools
                        </p>

                        <Button size="xl" variant="primary" className="gap-2" onClick={() => setShowDataModel(true)}>
                            <Sparkles className="h-5 w-5" />
                            Start Creating
                        </Button>
                    </div>
                )}

                <NewProjectModel isOpen={showDataModel} onClose={() => setShowDataModel(!showDataModel)}/>
            </div>
        </div>

    )
}

export default Dashboard

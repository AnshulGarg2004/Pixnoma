import React from 'react'
import ProjectCard, { Project } from './project-card';
import { useRouter } from 'next/navigation';

interface ProjectGridProps {
    projects: Project[];
}

const ProjectGrid = (projects: ProjectGridProps) => {
    console.log("In project grid");
    
    const router = useRouter();
    console.log("Projects: ", projects);
    console.log("This wll take to card");
    
    

    const handleEditProject = (id: string) => {
        router.push(`/editor/${id}`);
    }

    return (
        <div className='grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full'>
            {projects.projects.map((project) => (
                <ProjectCard key={project._id} project={project} onEdit={() => handleEditProject(project._id)} />
            ))}
        </div>
    )
}

export default ProjectGrid

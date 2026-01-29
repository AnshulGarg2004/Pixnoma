import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { Edit, Trash2 } from 'lucide-react';
import {formatDistanceToNow} from 'date-fns'
import Image from 'next/image';
import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProjectCardProp {
    project : Project;
    onEdit : () => void
}

export type Project = {
  _id: string;
  userId: string;

  title: string;

  originalImageUrl: string;
  currentImageUrl: string;
  thumbnailUrl : string;
  

  width: number;
  height: number;

  canvasState?: any; 
  activeTransformation?: string;

  createdAt: number;
  updatedAt: number;
};


const ProjectCard = ({project, onEdit} : ProjectCardProp) => {
    const [isLoading, setIsLoading] = useState(false);
    const {mutate : deleteProject} = useConvexMutation(api.projects.deleteUserProject);

    console.log("Project content: ", project);
    console.log("Thumbnail : ", project.thumbnailUrl);
    

    const lastUpdated = formatDistanceToNow(new Date(project.updatedAt), {addSuffix : true});
    const handleDelete = async() => {
        const confirmed = confirm(`Are you sure you want to delete ${project.title}. This Action cannot be undone`);
        try {
            if(confirmed) {
                await deleteProject({projectId : project._id});
                toast.success("Project deleted Succssfully🎉🎉");
                console.log("deleted success");
                return;
                
            }
        } catch (error) {
            console.log("error deleting project: ", error);
            toast.error("Error in deleting project");
            return;
            
        }

        
        
    }
  return (
    <div>
      <Card className='py-0 group relative bg-slate-800/50 overflow-hidden hover:border-white/20 transition-all hover:transform hover:scale-[1.02]'>

        <div
          className='relative overflow-hidden bg-slate-700'
          style={{ aspectRatio: project.width && project.height ? `${project.width}/${project.height}` : '16/9' }}
        > 
            {project.thumbnailUrl && (
              <Image
                src={project.thumbnailUrl}
                alt='Thumbnail'
                fill
                className='object-cover'
                priority={false}
              />
            )}

            <div className=' absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center justify-center'>
                <Button variant={'glassy'} size={'sm'} onClick={onEdit} className='gap-2'><Edit className='h-5 w-5'/>Edit</Button>
                <Button variant={'glassy'} size={'sm'} onClick={handleDelete} className='gap-2 text-red-400 hover:text-red-300' disabled={isLoading}><Trash2 className='h-5 w-5'/>Delete</Button>
            </div>
        </div>
        <CardContent className='pb-6'>
            <h3 className='font-semibold mb-1 truncate text-white'>{project.title}</h3>
            <div className='text-white/70 justify-between items-center text-sm flex'>

            <Badge variant={'secondary'} className='text-xs bg-slate-700 text-white/70' >{project.width} x {project.height}</Badge>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectCard

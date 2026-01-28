'use client'
import React from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Crown, Zap } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { PricingTable } from '@clerk/nextjs';

interface UpgradeModelProps {
    isOpen: boolean;
    onClose: () => void;
    restrictedTool: ToolId | null;
    reason: string;
}

type ToolId = "ai_extender" | "ai_edit" | "background" | "projects" | "exports";

const UpgradModel = ({ isOpen, onClose, restrictedTool, reason }: UpgradeModelProps) => {
    const getToolName = (toolId: ToolId) => {
        const planAccess: Record<ToolId, string> = {

            ai_extender: "AI Image Extender",
            ai_edit: "AI Editor",
            background: "Background Removal",
            projects : "More than 3 Projects",
            exports : "Unlimited Exports"
        };
        return planAccess[toolId];
    }
    return (
        <div>
            <Dialog open={isOpen} onOpenChange={onClose}>

                <DialogContent className="sm:max-w-4xl bg-slate-800 border-white/10 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className='flex items-center gap-3'>
                            <Crown className='w-5 h-5 text-yellow-500' />
                            <DialogTitle className='text-2xl font-bold text-white'>Upgrade to Pro</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div className='space-y-6'>{restrictedTool && (
                        <Alert className='bg-amber-500/10 border-amber-500/20'>
                            <Zap className='text-amber-400 h-5 w-5' />


                            <AlertDescription className='text-amber-300/80'>
                               <div className='text-amber-400 font-semibold mb-1'>
                                {getToolName(restrictedTool)} - Pro Feature
                               </div>
                                {reason  || `${restrictedTool} is only available on Pro plan. Upgrade now to unlock this powerful feature and more.`}
                            </AlertDescription>
                        </Alert>
                    )}
                    <PricingTable checkoutProps={{
                        appearance : {
                            elements : {
                                drawerRoot : {
                                    zIndex : 200000
                                }
                            }
                        }
                    }}/>
                    </div>
                    <DialogFooter className=' justify-center'>
                        <Button onClick={onClose} variant={'ghost'} className='text-white/70 hover:text-white'>Maybe Later</Button>
                    </DialogFooter>
                </DialogContent>

            </Dialog>
        </div>
    )

}

export default UpgradModel

'use client'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarLoader } from 'react-spinners'
import React from 'react'
import { Button } from './ui/button'
import { useStoreUserEffect } from '@/hooks/useStoreUserEffect'
import { Authenticated, Unauthenticated } from 'convex/react'
import { LayoutDashboard } from 'lucide-react'

const Header = () => {

    const session = useAuth();
    console.log("Auth: ", session);


    const path = usePathname();
    const { isLoading, isAuthenticated } = useStoreUserEffect();

    if (path.includes('/editor')) {
        return null;
    }


    return (
        <div className='fixed top-6 left-1/2 transform -translate-x-1/2 z-50 text-nowrap'>
            <div className=' backdrop-blur-md bg-white/20 border border-white/20 px-8 py-3 flex rounded-full items-center justify-between gap-8'>
                <Link href='/' className='mr-10 md:mr-20' >PixelNoma</Link>

                {path === '/' && <div className='hidden md:flex space-x-6'>
                    <Link href='#features' className=' text-white font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer'>Features</Link>
                    <Link href='#pricing' className=' text-white font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer'>Pricing</Link>
                    <Link href='#contact' className=' text-white font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer'>Contact</Link>
                </div>}

                <div className='flex items-center gap-3 ml-10 md:ml-20'>
                    <Unauthenticated>
                        <SignInButton>
                            <Button variant='glassy' className='hidden sm:flex'>Sign In</Button>
                        </SignInButton>
                        <SignUpButton>
                            <Button variant='primary'>Get Started</Button>
                        </SignUpButton>
                    </Unauthenticated>
                    <Authenticated>
                        <Link href={'/dashboard'}>
                        
                            <Button variant='primary'>
                                <LayoutDashboard className='h-4 w-4' />
                                <span className='hidden sm:flex'>Dashboard</span></Button>
                        </Link>
                        <UserButton appearance={{
                            elements: {
                                avatarBox: 'w-10 h-10'
                            }
                        }} />
                    </Authenticated>
                </div>

                {isLoading && <div className='fixed w-full bottom-0 left-0 z-40 flex justify-center'>
                    <BarLoader width={"95%"} color='#06b6d4' /></div>}
            </div>


        </div>
    )
}

export default Header

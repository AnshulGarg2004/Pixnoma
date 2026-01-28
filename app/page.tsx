'use client'
import Features from "@/components/Features";
import HeroSection from "@/components/HeroSection";
import Pricing from "@/components/Pricing";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HomePage = () => {

    const stats = [
        { label: "Image Processed", value: 10000, suffix: "+" },
        { label: "Active Users", value: 500, suffix: "+" },
        { label: "AI Transformation", value: 45000, suffix: "+" },
        { label: "User Satisfied", value: 98, suffix: "%" },
    ]
    return (
        <div className="pt-40">
            <HeroSection />

            <section className="py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-col-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <div className=" text-center" key={idx}>
                                <div className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                    {stat.value.toLocaleString()}{stat.suffix}
                                </div>
                                <div className=" text-gray-400 uppercase tracking-wider text-sm">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Features/>

            <Pricing />
            <section className="py-20 text-center">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-5xl font-bold mb-6">Ready to <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text tracking-tight text-transparent">Create Something Amazing?</span></h2>
                    <p className='text-xl mb-8 text-gray-300'>Join thousands of creators who are already using AI to transform their images and bring their vsion to life.</p>
                    <Link href={'/dashboard'} >
                        <Button variant={'primary'} size={'xl'}>✨Create Something New</Button></Link>
                </div>
            </section>
        </div>
    )
}

export default HomePage;
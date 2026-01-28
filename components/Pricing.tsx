// 'use client'

// import useIntersectionObserver from '@/hooks/use-intersection-observer';
// import { useAuth, ClerkLoaded } from '@clerk/nextjs';
// import { useCheckout } from '@clerk/nextjs/experimental';
// import React, { useState } from 'react';
// import { Button } from './ui/button';
// import { toast } from 'sonner';

// interface PriceCardProps {
//   id: string;
//   plan: string;
//   planId?: string;
//   price: number;
//   features: string[];
//   buttonText: string;
//   featured: boolean;
// }

// const CheckoutButton = ({ planId, isCurrentPlan, buttonText, featured }: { planId?: string, isCurrentPlan: boolean, buttonText: string, featured: boolean }) => {
//   const { checkout } = useCheckout({
//     planId: planId!,
//     planPeriod: 'month',
//     for: 'user',
//   });

//   const [loading, setLoading] = useState(false);

//   const handlePop = async () => {
//     if (isCurrentPlan || !planId) return;

//     try {
//       setLoading(true);
//       await checkout.start();
//       console.log('Checkout popup opened successfully');
//     } catch (err) {
//       console.error('Checkout error:', err);
//       toast.error('Failed to open checkout. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Button
//       className="w-full"
//       disabled={isCurrentPlan || !planId || loading}
//       variant={featured ? 'primary' : 'glassy'}
//       size="xl"
//       onClick={handlePop}
//     >
//       {isCurrentPlan ? 'Current Plan' : buttonText}
//     </Button>
//   );
// };

// const PriceCard = ({ id, plan, planId, price, features, buttonText, featured }: PriceCardProps) => {
//   const [ref, isVisible] = useIntersectionObserver();
//   const [isHovered, setIsHovered] = useState(false);
//   const { has } = useAuth();
//   const isCurrentPlan = id ? has?.({ plan: id }) : false;

//   return (
//     <div
//       ref={ref}
//       className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-8 transition-all duration-700 cursor-pointer text-center
//         ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
//         ${isHovered ? 'transform scale-105 rotate-1 shadow-2xl' : ''}
//         ${featured ? 'bg-gradient-to-r to-blue-500/20 to-purple-600/20 border-blue-400/50 scale-105' : 'bg-white/5 border-white/10'}`}
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       {featured && (
//         <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
//           <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold">
//             Most Popular
//           </div>
//         </div>
//       )}

//       <div className="text-center">
//         <h3 className="text-2xl font-bold text-white mb-2">{plan}</h3>
//         <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
//           ${price}
//           {price && <span className="text-lg text-gray-400">/month</span>}
//         </div>
//       </div>

//       <div>
//         <ul className="space-y-3 mb-8">
//           {features.map((feature, index) => (
//             <li className="flex items-center text-gray-300" key={index}>
//               <span className="text-green-400 mr-3">✓</span>
//               {feature}
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Wrap CheckoutButton inside ClerkLoaded */}
//       <ClerkLoaded>
//         <CheckoutButton
//           planId={planId}
//           isCurrentPlan={isCurrentPlan}
//           buttonText={buttonText}
//           featured={featured}
//         />
//       </ClerkLoaded>
//     </div>
//   );
// };

// const Pricing = () => {
//   const plans = [
//     {
//       id: 'free_user',
//       plan: 'Free',
//       price: 0,
//       features: [
//         '3 projects maximum',
//         '20 exports per month',
//         'Basic crop & resize',
//         'Color adjustments',
//         'Text Tool',
//       ],
//       buttonText: 'Get Started Free',
//       featured: false,
//     },
//     {
//       id: 'pro_user',
//       plan: 'Pro',
//       price: 12,
//       features: [
//         'Unlimited projects',
//         'Unlimited exports',
//         'All Editing Tools',
//         'AI Background Remover',
//         'AI Image Extender',
//         'AI Retouch, Upscaler and more',
//       ],
//       featured: true,
//       planId: 'cplan_38co97I7Bu2xP09aa70TeMOg2Ii',
//       buttonText: 'Upgrade to Pro',
//     },
//   ];

//   return (
//     <section className="py-20 mx-auto px-6 max-w-4xl">
//       <div>
// <div className="text-center mb-16">
//   <h2 className="text-5xl font-bold text-white pb-6">
//     Simple{' '}
//     <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
//       Pricing
//     </span>
//   </h2>
//   <p className="text-xl text-gray-300">
//     Start free and upgrade when you need more power. No hidden fees, cancel anytime
//   </p>
// </div>

//         <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
//           {plans.map((plan, index) => (
//             <PriceCard key={index} {...plan} />
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Pricing;

'use client'
import { PricingTable } from '@clerk/nextjs'
import React from 'react'

const Pricing = () => {
    return (
        <div className="flex flex-col  items-center justify-center min-h-screen">
            <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-white pb-6">
                    Simple{' '}
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        Pricing
                    </span>
                </h2>
                <p className="text-xl text-gray-300">
                    Start free and upgrade when you need more power. No hidden fees, cancel anytime
                </p>
            </div>
            <div className='max-w-4xl'>

                <PricingTable />
            </div>
        </div>
    );
}

export default Pricing;


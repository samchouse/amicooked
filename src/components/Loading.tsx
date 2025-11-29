'use client';

import { useEffect, useState } from 'react';
import { Brain, Database, Globe, Lock, Search, Server, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const loadingSteps = [
  { msg: 'Initializing neural link...', icon: Brain },
  { msg: 'Decrypting student records...', icon: Lock },
  { msg: 'Scanning academic parameters...', icon: Search },
  { msg: 'Querying global student database...', icon: Globe },
  { msg: 'Analyzing failure probabilities...', icon: Database },
  { msg: 'Calculating "Cooked" index...', icon: Zap },
  { msg: 'Finalizing verdict...', icon: ShieldCheck },
];

export default function Loading() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Cycle through steps
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden bg-zinc-900/20">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/20 blur-[100px] rounded-full animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-orange-500/10 blur-[80px] rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full p-8">
        
        {/* Scanner Visual */}
        <div className="relative w-32 h-32 mb-12">
           {/* Hexagon/Circle Container */}
           <div className="absolute inset-0 rounded-full border border-zinc-700 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500 via-transparent to-transparent" />
              
              {/* Scanning Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-scanner shadow-[0_0_10px_#f97316]" />
              
              {/* Icon Transition */}
              <div className="relative z-10 transition-all duration-500 transform key={currentStep}">
                  <CurrentIcon className="w-12 h-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
           </div>

           {/* Rotating Rings */}
           <div className="absolute inset-[-10px] border border-zinc-800 rounded-full animate-[spin_10s_linear_infinite] border-t-purple-500/50 border-r-transparent border-b-transparent border-l-transparent" />
           <div className="absolute inset-[-20px] border border-zinc-800/50 rounded-full animate-[spin_15s_linear_infinite_reverse] border-b-orange-500/30 border-t-transparent border-l-transparent border-r-transparent" />
        </div>

        {/* Text & Progress */}
        <div className="w-full space-y-6 text-center">
           <div className="h-8 overflow-hidden relative">
              {loadingSteps.map((step, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "absolute inset-0 transition-all duration-500 flex items-center justify-center gap-3",
                    idx === currentStep ? "opacity-100 translate-y-0" : idx < currentStep ? "opacity-0 -translate-y-full" : "opacity-0 translate-y-full"
                  )}
                >
                  <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-wide">
                    {step.msg}
                  </span>
                </div>
              ))}
           </div>

           {/* Progress Bar */}
           <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-zinc-800 animate-shimmer opacity-20" />
              <div 
                 className="h-full bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500 transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                 style={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
              />
           </div>
           
           <div className="flex justify-between text-xs font-mono text-zinc-500 uppercase tracking-widest">
              <span>System Processing</span>
              <span className="animate-pulse">{Math.round(((currentStep + 1) / loadingSteps.length) * 100)}%</span>
           </div>
        </div>

      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Brain, Search, Calculator, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Processing Data", sub: "Analyzing your survey responses...", icon: Brain },
  { label: "Pattern Matching", sub: "Comparing with 600+ student records...", icon: Search },
  { label: "Risk Assessment", sub: "Calculating academic failure probability...", icon: Calculator },
  { label: "Insight Generation", sub: "identifying key performance indicators...", icon: Sparkles },
  { label: "Finalizing Report", sub: "Preparing your dashboard...", icon: FileText },
];

export default function Loading() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Total duration for the loading sequence (e.g., 8 seconds)
    const TOTAL_DURATION = 8000;
    const STEP_DURATION = TOTAL_DURATION / STEPS.length;

    // Step Timer
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, STEP_DURATION);

    // Smooth Progress Bar
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
      setProgress(p);
    }, 16); // 60fps

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const CurrentIcon = STEPS[currentStep].icon;

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center relative bg-zinc-950/50">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[128px] animate-pulse-glow" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center text-center space-y-10">
        
        {/* Icon Halo */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative w-24 h-24 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl ring-1 ring-white/5">
            <div key={currentStep} className="animate-scale-in duration-500">
              <CurrentIcon className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-3 max-w-xs mx-auto">
          <h3 key={currentStep + "title"} className="text-2xl font-bold text-white tracking-tight animate-fade-in-up delay-0">
            {STEPS[currentStep].label}
          </h3>
          <p key={currentStep + "sub"} className="text-zinc-400 text-sm font-medium animate-fade-in-up delay-100">
            {STEPS[currentStep].sub}
          </p>
        </div>

        {/* Precision Progress Bar */}
        <div className="w-full max-w-[240px] space-y-4">
          <div className="h-[2px] w-full bg-zinc-800 rounded-full overflow-hidden relative">
             <div 
               className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(168,85,247,0.5)]"
               style={{ width: `${progress}%` }}
             />
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
             <span>System.Processing</span>
             <span className="text-zinc-500">{Math.round(progress)}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}

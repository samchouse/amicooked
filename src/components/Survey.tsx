"use client";

import { useState } from "react";
import { StudentData, analyzeStudentPerformance, AnalysisResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, Brain, Zap, Clock, School } from "lucide-react";

interface SurveyProps {
  onComplete: (data: StudentData, result: AnalysisResult) => void;
}

const INITIAL_DATA: StudentData = {
  hoursStudied: 10,
  attendance: 90,
  sleepHours: 7,
  parentalInvolvement: "Medium",
  accessToResources: "Medium",
  extracurricularActivities: false,
  motivationLevel: "Medium",
  internetAccess: true,
  familyIncome: "Medium",
};

export default function Survey({ onComplete }: SurveyProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<StudentData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof StudentData>(field: K, value: StudentData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const steps = [
    {
      id: "study",
      icon: <Brain className="w-6 h-6 text-purple-400" />,
      question: "Weekly Grind Hours",
      subtext: "How much are you actually locking in (studying) per week?",
      render: () => (
        <div className="space-y-12">
          <div className="flex items-end gap-4 justify-center">
             <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tracking-tighter">
               {formData.hoursStudied}
             </span>
             <span className="text-2xl text-zinc-500 mb-4 font-bold">HRS</span>
          </div>
          <div className="relative px-4">
            <input
              type="range"
              min="0"
              max="40"
              value={formData.hoursStudied}
              onChange={(e) => updateField("hoursStudied", parseInt(e.target.value))}
              className="w-full h-3 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
            />
            <div className="flex justify-between text-xs font-mono text-zinc-600 mt-4 uppercase tracking-widest">
              <span>Touching Grass</span>
              <span>Einstein Mode</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "attendance",
      icon: <School className="w-6 h-6 text-blue-400" />,
      question: "Class Presence",
      subtext: "Be real. How often do you actually show up?",
      render: () => (
        <div className="space-y-12">
          <div className="flex items-end gap-4 justify-center">
             <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tracking-tighter">
               {formData.attendance}
             </span>
             <span className="text-2xl text-zinc-500 mb-4 font-bold">%</span>
          </div>
          <div className="relative px-4">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.attendance}
              onChange={(e) => updateField("attendance", parseInt(e.target.value))}
              className="w-full h-3 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
            />
            <div className="flex justify-between text-xs font-mono text-zinc-600 mt-4 uppercase tracking-widest">
              <span>Ghost</span>
              <span>NPC</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "sleep",
      icon: <Clock className="w-6 h-6 text-cyan-400" />,
      question: "Sleep Schedule",
      subtext: "Are you sleepmaxxing or running on caffeine?",
      render: () => (
        <div className="space-y-12">
           <div className="flex items-end gap-4 justify-center">
             <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tracking-tighter">
               {formData.sleepHours}
             </span>
             <span className="text-2xl text-zinc-500 mb-4 font-bold">HRS</span>
          </div>
          <div className="relative px-4">
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={formData.sleepHours}
              onChange={(e) => updateField("sleepHours", parseFloat(e.target.value))}
              className="w-full h-3 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
            />
             <div className="flex justify-between text-xs font-mono text-zinc-600 mt-4 uppercase tracking-widest">
              <span>Zombie</span>
              <span>Coma</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "categorical",
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      question: "Vibe Check",
      subtext: "Rate your mental and environment.",
      render: () => (
        <div className="space-y-8 px-4">
          <div className="space-y-4">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Motivation Level</label>
            <div className="flex gap-3">
              {(["Low", "Medium", "High"] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => updateField("motivationLevel", val)}
                  className={cn(
                    "flex-1 py-4 px-4 rounded-xl text-sm font-bold border transition-all duration-200",
                    formData.motivationLevel === val
                      ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] scale-105"
                      : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Resource Buffs</label>
            <div className="flex gap-3">
              {(["Low", "Medium", "High"] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => updateField("accessToResources", val)}
                  className={cn(
                    "flex-1 py-4 px-4 rounded-xl text-sm font-bold border transition-all duration-200",
                    formData.accessToResources === val
                      ? "bg-green-400 text-black border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)] scale-105"
                      : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await analyzeStudentPerformance(formData);
      onComplete(formData, result);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const currentStep = steps[step];

  return (
    <div className="w-full bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="min-h-[450px] flex flex-col justify-between relative z-10">
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 key={step}">
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-800 rounded-lg">{currentStep.icon}</div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Question {step + 1}/{steps.length}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">{currentStep.question}</h2>
          <p className="text-zinc-400 text-lg mb-12 font-medium">{currentStep.subtext}</p>
          
          {currentStep.render()}
        </div>

        <div className="flex justify-end pt-8">
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={cn(
              "group flex items-center gap-3 px-8 py-4 text-lg font-bold text-black bg-white rounded-xl transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>Calculating <Loader2 className="w-5 h-5 animate-spin" /></>
            ) : step === steps.length - 1 ? (
              <>See The Truth <Brain className="w-5 h-5" /></>
            ) : (
              <>
                Next <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

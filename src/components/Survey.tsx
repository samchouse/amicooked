"use client";

import { useState } from "react";
import { StudentData, analyzeStudentPerformance, AnalysisResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, Brain, Zap, Clock, School, Beer, HeartPulse, GraduationCap, Heart } from "lucide-react";

interface SurveyProps {
  onComplete: (data: StudentData, result: AnalysisResult) => void;
}

const INITIAL_DATA: StudentData = {
  studyTime: 2,
  failures: 0,
  absences: 2,
  goOut: 3,
  freeTime: 3,
  alcohol: 1,
  health: 5,
  internet: true,
  romantic: false,
  higherEdu: true,
  motivationLevel: "Medium", // Added motivationLevel
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
      id: "academic_grind",
      icon: <Brain className="w-6 h-6 text-purple-400" />,
      question: "Focus Flow",
      subtext: "How much are you actually studying?",
      render: () => (
        <div className="space-y-12">
           <div className="space-y-6">
             <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block text-center">Weekly Study Hours</label>
             <div className="flex flex-col gap-3">
               {[
                 { val: 1, label: "< 2 Hours (Ngmi)", desc: "Speedrunning failure?" },
                 { val: 2, label: "2 - 5 Hours (Mid)", desc: "Doing the bare minimum" },
                 { val: 3, label: "5 - 10 Hours (Valid)", desc: "Actually trying" },
                 { val: 4, label: "> 10 Hours (Sweat)", desc: "Academic Weapon status" }
               ].map((opt) => (
                 <button
                   key={opt.val}
                   onClick={() => updateField("studyTime", opt.val)}
                   className={cn(
                     "w-full p-4 rounded-xl text-left border transition-all duration-200 flex justify-between items-center group",
                     formData.studyTime === opt.val
                       ? "bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-102"
                       : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600"
                   )}
                 >
                    <div>
                      <div className={cn("font-bold", formData.studyTime === opt.val ? "text-white" : "text-zinc-300")}>{opt.label}</div>
                      <div className="text-xs text-zinc-500">{opt.desc}</div>
                    </div>
                    <div className={cn("w-4 h-4 rounded-full border-2", formData.studyTime === opt.val ? "bg-purple-500 border-purple-500" : "border-zinc-600")} />
                 </button>
               ))}
             </div>
           </div>
        </div>
      ),
    },
    {
      id: "track_record",
      icon: <School className="w-6 h-6 text-red-400" />,
      question: "Track Record",
      subtext: "Past performance predicts future behavior.",
      render: () => (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
             <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Past Failures</span>
                <span className="text-4xl font-black text-white">{formData.failures}</span>
             </div>
             <input
              type="range"
              min="0"
              max="4"
              value={formData.failures}
              onChange={(e) => updateField("failures", parseInt(e.target.value))}
              className="w-full h-4 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all"
            />
            <div className="flex justify-between mt-3 text-xs font-mono text-zinc-500">
               <span>Clean Record</span>
               <span>Academic Victim</span>
            </div>
          </div>

           <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
             <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Absences</span>
                <span className="text-4xl font-black text-white">{formData.absences}</span>
             </div>
             <input
              type="range"
              min="0"
              max="30"
              value={formData.absences}
              onChange={(e) => updateField("absences", parseInt(e.target.value))}
              className="w-full h-4 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
            />
             <div className="flex justify-between mt-3 text-xs font-mono text-zinc-500">
               <span>Perfect Attendance</span>
               <span>Ghost</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "lifestyle",
      icon: <Beer className="w-6 h-6 text-yellow-400" />,
      question: "Lifestyle Check",
      subtext: "Are you partying too hard?",
      render: () => (
        <div className="space-y-4">
           {/* Alcohol */}
           <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
             <div className="flex justify-between items-center">
               <label className="text-sm font-bold text-zinc-400 uppercase">Party Level</label>
               <span className="text-sm font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">{formData.alcohol}/5</span>
             </div>
             <input
              type="range"
              min="1"
              max="5"
              value={formData.alcohol}
              onChange={(e) => updateField("alcohol", parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
            />
            <div className="flex justify-between text-xs text-zinc-600 font-mono">
              <span>Monk</span>
              <span>Project X</span>
            </div>
           </div>

           {/* Going Out */}
           <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
             <div className="flex justify-between items-center">
               <label className="text-sm font-bold text-zinc-400 uppercase">Going Out</label>
               <span className="text-sm font-bold text-pink-400 bg-pink-400/10 px-2 py-1 rounded">{formData.goOut}/5</span>
             </div>
             <input
              type="range"
              min="1"
              max="5"
              value={formData.goOut}
              onChange={(e) => updateField("goOut", parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
            />
             <div className="flex justify-between text-xs text-zinc-600 font-mono">
              <span>Hermit</span>
              <span>Mr. Worldwide</span>
            </div>
           </div>
           
           {/* Health */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
             <div className="flex justify-between items-center">
               <label className="text-sm font-bold text-zinc-400 uppercase">Health Status</label>
               <span className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">{formData.health}/5</span>
             </div>
             <input
              type="range"
              min="1"
              max="5"
              value={formData.health}
              onChange={(e) => updateField("health", parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
            />
             <div className="flex justify-between text-xs text-zinc-600 font-mono">
              <span>1 HP</span>
              <span>Tank</span>
            </div>
           </div>
        </div>
      ),
    },
    {
      id: "final_boss",
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      question: "Final Variables",
      subtext: "The last few stats to calculate your fate.",
      render: () => (
        <div className="grid grid-cols-1 gap-4">
           <button
             onClick={() => updateField("higherEdu", !formData.higherEdu)}
             className={cn(
               "p-4 rounded-xl border flex items-center justify-between transition-all",
               formData.higherEdu 
                ? "bg-blue-500/20 border-blue-500 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
             )}
           >
             <div className="flex items-center gap-3">
               <GraduationCap className="w-5 h-5" />
               <span className="font-bold">Wants Higher Edu?</span>
             </div>
             <div className={cn("w-4 h-4 rounded border", formData.higherEdu ? "bg-blue-500 border-blue-500" : "border-zinc-600")} />
           </button>

           <button
             onClick={() => updateField("romantic", !formData.romantic)}
             className={cn(
               "p-4 rounded-xl border flex items-center justify-between transition-all",
               formData.romantic 
                ? "bg-pink-500/20 border-pink-500 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
             )}
           >
             <div className="flex items-center gap-3">
               <Heart className="w-5 h-5" />
               <span className="font-bold">In a Relationship?</span>
             </div>
             <div className={cn("w-4 h-4 rounded border", formData.romantic ? "bg-pink-500 border-pink-500" : "border-zinc-600")} />
           </button>
           
           <button
             onClick={() => updateField("internet", !formData.internet)}
             className={cn(
               "p-4 rounded-xl border flex items-center justify-between transition-all",
               formData.internet 
                ? "bg-cyan-500/20 border-cyan-500 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
             )}
           >
             <div className="flex items-center gap-3">
               <Zap className="w-5 h-5" />
               <span className="font-bold">Internet Access?</span>
             </div>
             <div className={cn("w-4 h-4 rounded border", formData.internet ? "bg-cyan-500 border-cyan-500" : "border-zinc-600")} />
           </button>
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
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Level {step + 1}/{steps.length}</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">{currentStep.question}</h2>
          <p className="text-zinc-400 text-md mb-8 font-medium">{currentStep.subtext}</p>
          
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
              <>Processing <Loader2 className="w-5 h-5 animate-spin" /></>
            ) : step === steps.length - 1 ? (
              <>Get Verdict <Brain className="w-5 h-5" /></>
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
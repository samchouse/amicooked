"use client";

import { useState } from "react";
import { StudentData, analyzeStudentPerformance, AnalysisResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  ArrowRight, Loader2, Brain, Zap, Clock, School, Beer, HeartPulse, 
  GraduationCap, Heart, User, Home, Users, Briefcase, Car, FlaskConical, 
  Lightbulb, Wifi, BookOpen, HandCoins, HeartOff, Baby, Trophy, Calendar 
} from "lucide-react";
import Loading from "./Loading";

interface SurveyProps {
  onComplete: (data: StudentData, result: AnalysisResult) => void;
}

const INITIAL_DATA: StudentData = {
  // Basics
  sex: "F",
  age: 17,
  address: "U",
  famsize: "GT3",
  Pstatus: "T",
  
  // Family Background
  Medu: 2,
  Fedu: 2,
  Mjob: "other",
  Fjob: "other",
  
  // Support & Logistics
  traveltime: 2,
  studytime: 2,
  schoolsup: false,
  famsup: true,
  paid: false,
  activities: false,
  nursery: true,
  higher: true,
  internet: true,
  
  // Performance
  failures: 0,
  absences: 2,
  G1: 0,
  G2: 0,
  
  // Lifestyle
  romantic: false,
  famrel: 4,
  freetime: 3,
  goout: 3,
  Dalc: 1,
  Walc: 1,
  health: 3,
};

export default function Survey({ onComplete }: SurveyProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<StudentData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof StudentData>(field: K, value: StudentData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- UI Components ---

  const OptionCard = ({ icon, title, description, selected, onClick, colorClass }: { icon?: React.ReactNode, title: string, description: string, selected: boolean, onClick: () => void, colorClass: string }) => {
     const baseColor = colorClass.split('-')[1]; // e.g. "purple"
     return (
      <button
        onClick={onClick}
        className={cn(
          "w-full p-4 rounded-xl text-left border transition-all duration-200 flex justify-between items-center group relative overflow-hidden",
          selected
            ? `bg-${baseColor}-500/10 border-${baseColor}-500 shadow-[0_0_15px_rgba(var(--${baseColor}-rgb),0.3)]`
            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600"
        )}
      >
        <div className="flex items-center gap-3 z-10 relative">
          {icon && <span className={cn("w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/50", selected ? `text-${baseColor}-400` : "text-zinc-500")}>{icon}</span>}
          <div>
            <div className={cn("font-bold text-md", selected ? "text-white" : "text-zinc-300")}>{title}</div>
            <div className="text-xs text-zinc-500 font-medium">{description}</div>
          </div>
        </div>
        <div className={cn("w-5 h-5 rounded-full border-2 transition-colors z-10 relative", selected ? `bg-${baseColor}-500 border-${baseColor}-500` : "border-zinc-600")} />
        
        {selected && <div className={`absolute inset-0 bg-gradient-to-r from-${baseColor}-500/10 to-transparent opacity-50`} />}
      </button>
    );
  };

  const SliderCard = ({ icon, title, min, max, value, onChange, units, labels, colorClass }: { icon: React.ReactNode, title: string, min: number, max: number, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, units: string, labels: { min: string, max: string }, colorClass: string }) => {
    const baseColor = colorClass.split('-')[1];
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4 hover:border-zinc-700 transition-colors">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">{icon} {title}</label>
          <span className={`text-sm font-bold text-${baseColor}-400 bg-${baseColor}-500/10 px-3 py-1 rounded-md border border-${baseColor}-500/20`}>
            {value}{units}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer",
            `accent-${baseColor}-500`
          )}
        />
        <div className="flex justify-between text-xs text-zinc-500 font-mono font-medium">
          <span>{labels.min}</span>
          <span>{labels.max}</span>
        </div>
      </div>
    );
  };

  const ToggleGrid = ({ items }: { items: { icon: React.ReactNode, label: string, field: keyof StudentData, color: string }[] }) => (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <button
          key={item.field}
          onClick={() => updateField(item.field, !formData[item.field] as any)}
          className={cn(
            "p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[120px]",
            formData[item.field]
              ? `bg-${item.color}-500/10 border-${item.color}-500/50 text-white shadow-[0_0_20px_rgba(0,0,0,0.2)]`
              : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:border-zinc-700"
          )}
        >
          <div className={cn("p-2 rounded-full transition-colors", formData[item.field] ? `bg-${item.color}-500 text-white` : "bg-zinc-800 text-zinc-500")}>
            {item.icon}
          </div>
          <span className="text-sm font-bold text-center leading-tight">{item.label}</span>
          <div className={cn("text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded", formData[item.field] ? `bg-${item.color}-500/20 text-${item.color}-300` : "bg-zinc-800 text-zinc-600")}>
            {formData[item.field] ? "ACTIVE" : "OFF"}
          </div>
        </button>
      ))}
    </div>
  );

  // --- Survey Steps ---

  const steps = [
    {
      id: "identity",
      icon: <User className="w-6 h-6 text-blue-400" />,
      title: "Identity Protocol",
      subtitle: "Establishing baseline user profile.",
      render: () => (
        <div className="space-y-8 animate-fade-in-up delay-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Biological Sex</label>
               <div className="flex gap-3">
                 {(["F", "M"] as const).map((val) => (
                   <OptionCard
                     key={val}
                     title={val === "F" ? "Female" : "Male"}
                     description={val === "F" ? "XX Chromosome" : "XY Chromosome"}
                     selected={formData.sex === val}
                     onClick={() => updateField("sex", val)}
                     colorClass="text-blue-400"
                   />
                 ))}
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Environment</label>
               <div className="flex gap-3">
                 {(["U", "R"] as const).map((val) => (
                   <OptionCard
                     key={val}
                     title={val === "U" ? "Urban" : "Rural"}
                     description={val === "U" ? "City Center" : "Countryside"}
                     selected={formData.address === val}
                     onClick={() => updateField("address", val)}
                     colorClass="text-indigo-400"
                   />
                 ))}
               </div>
             </div>
          </div>

          <SliderCard
            icon={<User className="w-5 h-5" />}
            title="Age"
            min={15} max={22} value={formData.age}
            onChange={(e) => updateField("age", parseInt(e.target.value))}
            units=" years"
            labels={{ min: "15", max: "22+" }}
            colorClass="text-blue-400"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Household Size</label>
               <div className="flex gap-3">
                 <OptionCard
                   title="≤ 3"
                   description="Compact"
                   selected={formData.famsize === "LE3"}
                   onClick={() => updateField("famsize", "LE3")}
                   colorClass="text-cyan-400"
                 />
                 <OptionCard
                   title="> 3"
                   description="Expanded"
                   selected={formData.famsize === "GT3"}
                   onClick={() => updateField("famsize", "GT3")}
                   colorClass="text-cyan-400"
                 />
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Parents' Status</label>
               <div className="flex gap-3">
                 <OptionCard
                   title="Together"
                   description="Cohabitating"
                   selected={formData.Pstatus === "T"}
                   onClick={() => updateField("Pstatus", "T")}
                   colorClass="text-teal-400"
                 />
                 <OptionCard
                   title="Apart"
                   description="Separated"
                   selected={formData.Pstatus === "A"}
                   onClick={() => updateField("Pstatus", "A")}
                   colorClass="text-teal-400"
                 />
               </div>
             </div>
          </div>
        </div>
      ),
    },
    {
      id: "origin",
      icon: <Users className="w-6 h-6 text-purple-400" />,
      title: "Origin Story",
      subtitle: "Analyzing parental stats and background.",
      render: () => (
        <div className="space-y-8 animate-fade-in-up delay-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Parental Education</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SliderCard
                icon={<User className="w-4 h-4" />}
                title="Mother's Edu"
                min={0} max={4} value={formData.Medu}
                onChange={(e) => updateField("Medu", parseInt(e.target.value))}
                units=" lvl"
                labels={{ min: "None", max: "Higher Edu" }}
                colorClass="text-purple-400"
              />
              <SliderCard
                icon={<User className="w-4 h-4" />}
                title="Father's Edu"
                min={0} max={4} value={formData.Fedu}
                onChange={(e) => updateField("Fedu", parseInt(e.target.value))}
                units=" lvl"
                labels={{ min: "None", max: "Higher Edu" }}
                colorClass="text-fuchsia-400"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-bold text-white">Parental Occupation</h3>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Mother's Job</label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {["teacher", "health", "services", "at_home", "other"].map((job) => (
                      <button
                        key={job}
                        onClick={() => updateField("Mjob", job as any)}
                        className={cn(
                          "px-2 py-3 rounded-lg border text-xs font-bold uppercase transition-all",
                          formData.Mjob === job ? "bg-purple-500/20 border-purple-500 text-white" : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                        )}
                      >
                        {job.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Father's Job</label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {["teacher", "health", "services", "at_home", "other"].map((job) => (
                      <button
                        key={job}
                        onClick={() => updateField("Fjob", job as any)}
                        className={cn(
                          "px-2 py-3 rounded-lg border text-xs font-bold uppercase transition-all",
                          formData.Fjob === job ? "bg-pink-500/20 border-pink-500 text-white" : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                        )}
                      >
                        {job.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "grind",
      icon: <Brain className="w-6 h-6 text-orange-400" />,
      title: "The Grind",
      subtitle: "Your daily academic inputs.",
      render: () => (
        <div className="space-y-8 animate-fade-in-up delay-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SliderCard
              icon={<Brain className="w-5 h-5" />}
              title="Weekly Study"
              min={1} max={4} value={formData.studytime}
              onChange={(e) => updateField("studytime", parseInt(e.target.value))}
              units=" tier"
              labels={{ min: "<2h", max: ">10h" }}
              colorClass="text-orange-400"
            />
            <SliderCard
              icon={<Car className="w-5 h-5" />}
              title="Travel Time"
              min={1} max={4} value={formData.traveltime}
              onChange={(e) => updateField("traveltime", parseInt(e.target.value))}
              units=" tier"
              labels={{ min: "<15m", max: ">1h" }}
              colorClass="text-yellow-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <SliderCard
              icon={<FlaskConical className="w-5 h-5" />}
              title="Past Failures"
              min={0} max={4} value={formData.failures}
              onChange={(e) => updateField("failures", parseInt(e.target.value))}
              units=""
              labels={{ min: "Clean Record", max: "Cooked" }}
              colorClass="text-red-400"
            />
             <SliderCard
              icon={<Clock className="w-5 h-5" />}
              title="Absences"
              min={0} max={30} value={formData.absences}
              onChange={(e) => updateField("absences", parseInt(e.target.value))}
              units=""
              labels={{ min: "Perfect", max: "Ghost" }}
              colorClass="text-red-400"
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider block">Academic Buffs</label>
            <ToggleGrid items={[
              { icon: <School className="w-5 h-5" />, label: "School Support", field: "schoolsup", color: "blue" },
              { icon: <Users className="w-5 h-5" />, label: "Family Support", field: "famsup", color: "green" },
              { icon: <HandCoins className="w-5 h-5" />, label: "Paid Classes", field: "paid", color: "yellow" },
              { icon: <Lightbulb className="w-5 h-5" />, label: "Activities", field: "activities", color: "orange" },
              { icon: <Baby className="w-5 h-5" />, label: "Nursery", field: "nursery", color: "pink" },
              { icon: <Wifi className="w-5 h-5" />, label: "Internet", field: "internet", color: "cyan" },
              { icon: <GraduationCap className="w-5 h-5" />, label: "Higher Edu Plan", field: "higher", color: "purple" },
            ]} />
          </div>
        </div>
      ),
    },
    {
      id: "performance",
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      title: "Current Stats",
      subtitle: "Recent academic performance (0-20 scale).",
      render: () => (
        <div className="space-y-8 animate-fade-in-up delay-0">
           <div className="bg-zinc-800/30 p-6 rounded-xl border border-yellow-500/20">
              <div className="flex gap-3 items-start mb-4">
                 <Trophy className="w-6 h-6 text-yellow-400 shrink-0" />
                 <p className="text-sm text-zinc-400">
                   Enter your grades for the first and second periods. If you don't have them yet, leave as 0 or estimate. 
                   <span className="block mt-2 text-yellow-500/80 font-bold">Scale: 0 (Fail) - 20 (Perfect)</span>
                 </p>
              </div>
              
              <div className="space-y-6">
                <SliderCard
                  icon={<Calendar className="w-5 h-5" />}
                  title="First Period Grade (G1)"
                  min={0} max={20} value={formData.G1}
                  onChange={(e) => updateField("G1", parseInt(e.target.value))}
                  units="/20"
                  labels={{ min: "0", max: "20" }}
                  colorClass="text-yellow-400"
                />
                 <SliderCard
                  icon={<Calendar className="w-5 h-5" />}
                  title="Second Period Grade (G2)"
                  min={0} max={20} value={formData.G2}
                  onChange={(e) => updateField("G2", parseInt(e.target.value))}
                  units="/20"
                  labels={{ min: "0", max: "20" }}
                  colorClass="text-yellow-400"
                />
              </div>
           </div>
        </div>
      ),
    },
    {
      id: "lifestyle",
      icon: <HeartPulse className="w-6 h-6 text-red-400" />,
      title: "Lifestyle & Vices",
      subtitle: "What you do when you're not studying.",
      render: () => (
        <div className="space-y-8 animate-fade-in-up delay-0">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <SliderCard
                icon={<Clock className="w-5 h-5" />}
                title="Free Time"
                min={1} max={5} value={formData.freetime}
                onChange={(e) => updateField("freetime", parseInt(e.target.value))}
                units="/5"
                labels={{ min: "Low", max: "High" }}
                colorClass="text-green-400"
              />
              <SliderCard
                icon={<Beer className="w-5 h-5" />}
                title="Going Out"
                min={1} max={5} value={formData.goout}
                onChange={(e) => updateField("goout", parseInt(e.target.value))}
                units="/5"
                labels={{ min: "Low", max: "High" }}
                colorClass="text-green-400"
              />
           </div>

           <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-2xl space-y-6">
              <h3 className="text-sm font-bold text-red-400 uppercase flex items-center gap-2">
                 <Beer className="w-4 h-4" /> Consumption Habits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderCard
                  icon={<Beer className="w-5 h-5" />}
                  title="Workday Alcohol"
                  min={1} max={5} value={formData.Dalc}
                  onChange={(e) => updateField("Dalc", parseInt(e.target.value))}
                  units="/5"
                  labels={{ min: "Low", max: "High" }}
                  colorClass="text-red-400"
                />
                <SliderCard
                  icon={<Beer className="w-5 h-5" />}
                  title="Weekend Alcohol"
                  min={1} max={5} value={formData.Walc}
                  onChange={(e) => updateField("Walc", parseInt(e.target.value))}
                  units="/5"
                  labels={{ min: "Low", max: "High" }}
                  colorClass="text-red-400"
                />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <SliderCard
                icon={<HeartPulse className="w-5 h-5" />}
                title="Health Status"
                min={1} max={5} value={formData.health}
                onChange={(e) => updateField("health", parseInt(e.target.value))}
                units="/5"
                labels={{ min: "Bad", max: "Good" }}
                colorClass="text-emerald-400"
              />
               <SliderCard
                icon={<Users className="w-5 h-5" />}
                title="Family Relations"
                min={1} max={5} value={formData.famrel}
                onChange={(e) => updateField("famrel", parseInt(e.target.value))}
                units="/5"
                labels={{ min: "Bad", max: "Good" }}
                colorClass="text-purple-400"
              />
           </div>

           <ToggleGrid items={[
             { icon: <Heart className="w-5 h-5" />, label: "Romantic Relationship", field: "romantic", color: "pink" }
           ]} />
        </div>
      ),
    }
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const [result] = await Promise.all([
        analyzeStudentPerformance(formData),
        new Promise(resolve => setTimeout(resolve, 4500)) // Min loading time
      ]);
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

  if (isSubmitting) {
    return (
      <div className="w-full bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden min-h-[500px]">
        <Loading />
      </div>
    );
  }

  const currentStep = steps[step];

  return (
    <div className="w-full bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col min-h-[600px]">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-800/50">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 via-purple-500 to-indigo-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="mb-8 animate-fade-in-up delay-0">
         <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3">
             <div className="p-2.5 bg-zinc-800 rounded-xl shadow-inner border border-zinc-700">
               {currentStep.icon}
             </div>
             <div>
               <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{currentStep.title}</h2>
               <p className="text-zinc-400 text-sm font-medium">{currentStep.subtitle}</p>
             </div>
           </div>
           <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest border border-zinc-800 px-3 py-1 rounded-full">
             Step {step + 1}/{steps.length}
           </span>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow key={step}">
         {currentStep.render()}
      </div>

      {/* Navigation */}
      <div className="pt-10 mt-auto flex justify-between items-center animate-fade-in-up delay-100 border-t border-white/5">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className={cn(
            "px-6 py-3 text-sm font-bold text-zinc-500 hover:text-white transition-colors",
            step === 0 ? "invisible" : "visible"
          )}
        >
          Back
        </button>

        <button
          onClick={handleNext}
          className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-black bg-white rounded-xl transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10 flex items-center gap-2">
            {step === steps.length - 1 ? "Analyze Data" : "Next Step"}
            {step === steps.length - 1 ? <Zap className="w-5 h-5 fill-black" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </span>
        </button>
      </div>
    </div>
  );
}

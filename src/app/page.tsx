"use client";

import { useState, useEffect } from "react";
import Survey from "@/components/Survey";
import Dashboard from "@/components/Dashboard";
import { AnalysisResult, StudentData } from "@/lib/api";
import { Flame, Skull, GraduationCap, Zap } from "lucide-react";
import { getStudentData } from "@/app/actions";

type AppState = "landing" | "survey" | "results";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [data, setData] = useState<StudentData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [studentDataset, setStudentData] = useState<any[]>([]);

  useEffect(() => {
    getStudentData().then(setStudentData);
  }, []);

  const handleStart = () => {
    setAppState("survey");
  };

  const handleSurveyComplete = (
    completedData: StudentData,
    analysisResult: AnalysisResult
  ) => {
    setData(completedData);
    setResult(analysisResult);
    setAppState("results");
  };

  const handleReset = () => {
    setData(null);
    setResult(null);
    setAppState("landing");
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden relative selection:bg-orange-500/30">
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[128px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] pointer-events-none animate-pulse" />

      {/* Header */}
      <nav className="fixed top-0 left-0 w-full p-4 z-50 flex justify-between items-center backdrop-blur-sm bg-[#09090b]/80 border-b border-white/5">
        <div
          className="flex items-center gap-2 cursor-pointer transition-transform"
          onClick={handleReset}
        >
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
            <GraduationCap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-bold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Am I Cooked?
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 pt-24 relative z-10">
        
        {appState === "landing" && (
          <div className="max-w-3xl w-full text-center space-y-8">
            


            <h1 className="animate-fade-in-up delay-100 text-6xl md:text-8xl font-black tracking-tighter text-white leading-tight drop-shadow-2xl">
              AM I <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 animate-gradient-x">
                COOKED?
              </span>
            </h1>
            
            <p className="animate-fade-in-up delay-200 text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Find out if you're <span className="font-bold text-zinc-200">cooked</span> or <span className="font-bold text-zinc-200">locked in</span>. Our model, trained on real student data, analyzes your habits to calculate your cooked score.
            </p>

            <div className="pt-8 animate-fade-in-up delay-300">
              <button
                onClick={handleStart}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-white text-black rounded-xl hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10" />
                <span className="text-black group-hover:text-white transition-colors flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5" />
                  Start Analysis
                </span>
              </button>
            </div>
          </div>
        )}

        {appState === "survey" && (
          <div className="w-full max-w-2xl animate-scale-in">
            <Survey onComplete={handleSurveyComplete} />
          </div>
        )}

        {appState === "results" && result && data && (
          <div className="w-full max-w-5xl animate-scale-in">
            <Dashboard result={result} onReset={handleReset} studentData={studentDataset} userSurveyData={data} userAnalysisResult={result} />
          </div>
        )}
      </div>
    </main>
  );
}

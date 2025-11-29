"use client";

import { AnalysisResult, StudentData } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { RotateCcw, AlertTriangle, Share2, Award, Zap, TrendingUp, BrainCircuit } from "lucide-react";
import TrendVisualizer from "./TrendVisualizer";

interface DashboardProps {
  result: AnalysisResult;
  onReset: () => void;
  studentData: any[];
  userSurveyData: StudentData;
  userAnalysisResult: AnalysisResult; // NEW PROP
}

export default function Dashboard({ result, onReset, studentData, userSurveyData, userAnalysisResult }: DashboardProps) {
  
  const percentage = (result.cookedScore / 10) * 100;
  const strokeDasharray = 2 * Math.PI * 45; 
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  const getTheme = (score: number) => {
      if (score <= 3) return { color: "text-blue-400", stroke: "#60a5fa", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "CHILL" };
      if (score <= 7) return { color: "text-yellow-400", stroke: "#facc15", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "MID" };
      if (score <= 9) return { color: "text-orange-500", stroke: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "COOKED" };
      return { color: "text-red-600", stroke: "#dc2626", bg: "bg-red-500/10", border: "border-red-500/20", label: "DOOMED" };
  };

  const theme = getTheme(result.cookedScore);

  return (
    <div className="w-full space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 gap-4 animate-fade-in-up delay-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-xs font-mono uppercase">Model: Student-Por-v1</span>
             <span className="bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded text-xs font-mono uppercase">AI Analysis</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
            THE VERDICT
          </h2>
          <p className="text-zinc-400 mt-2 text-lg">
            Projected Grade: <span className="text-white font-bold">{Math.round((result.predictedG3 / 20) * 100)}%</span> <span className="text-zinc-600 text-sm">(Passing is 50%)</span>
          </p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-2.5 font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2">
             <Share2 className="w-4 h-4" /> SHARE STATS
           </button>
           <button 
            onClick={onReset}
            className="px-6 py-2.5 font-bold text-sm bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> RESTART
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: The Meter & Key Stats */}
        <div className="lg:col-span-5 space-y-6 animate-fade-in-up delay-100">
            
            {/* Meter */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[350px]">
               <div className={cn("absolute inset-0 opacity-20 blur-3xl pointer-events-none", theme.bg)} />
               
               <div className="relative w-64 h-64 mb-6">
                 <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
                   <circle cx="50" cy="50" r="45" fill="none" stroke="#18181b" strokeWidth="8" strokeLinecap="round" />
                   <circle
                     cx="50" cy="50" r="45"
                     fill="none"
                     stroke={theme.stroke}
                     strokeWidth="8"
                     strokeDasharray={strokeDasharray}
                     strokeDashoffset={strokeDashoffset}
                     strokeLinecap="round"
                     className="transition-all duration-1000 ease-out"
                   />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-8xl font-black tracking-tighter drop-shadow-md", theme.color)}>
                      {result.cookedScore}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-2">Cooked Score</span>
                 </div>
               </div>

               <div className={cn("px-6 py-2 rounded-full border text-sm font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse", theme.color, theme.border, theme.bg)}>
                 {result.cookedScore > 8 ? <AlertTriangle className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                 {result.riskLevel}
               </div>
            </div>

            {/* Probability */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex items-center justify-between">
                <div>
                  <h4 className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Failure Probability</h4>
                  <div className="text-3xl font-black text-white">{result.probabilityOfFailing}%</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                   <TrendingUp className={cn("w-6 h-6", result.probabilityOfFailing > 50 ? "text-red-500" : "text-green-500")} />
                </div>
            </div>
        </div>

        {/* Right Column: Charts & Insights */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in-up delay-200">
           
           {/* Radar Chart */}
           <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                   <BrainCircuit className="w-4 h-4 text-purple-400" /> Stat Comparison
                 </h3>
                 <div className="flex gap-4 text-xs font-mono">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> YOU</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-600" /> AVG PASSING</span>
                 </div>
              </div>
              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.radarData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="You"
                        dataKey="A"
                        stroke="#a855f7"
                        strokeWidth={2}
                        fill="#a855f7"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Avg Passing"
                        dataKey="B"
                        stroke="#52525b"
                        strokeWidth={2}
                        fill="#52525b"
                        fillOpacity={0.1}
                      />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Action Plan */}
           <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
              <h3 className="text-sm font-bold text-zinc-300 mb-6 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> Strategy Guide
              </h3>
              <ul className="space-y-4">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-4 items-start group">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-mono text-zinc-400 group-hover:bg-white group-hover:text-black transition-colors font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-zinc-300 leading-relaxed font-medium text-sm group-hover:text-white transition-colors">
                      {rec}
                    </p>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>

      {/* Factor Impacts - Bottom Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up delay-300">
          {result.factorImpacts.map((factor, idx) => (
              <div key={idx} className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl">
                 <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{factor.factor}</div>
                 <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{factor.value}</span>
                    <div className={cn("text-xs font-bold px-2 py-1 rounded", factor.impact === 'positive' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                        {factor.impact === 'positive' ? "+ BUFF" : "- NERF"}
                    </div>
                 </div>
              </div>
          ))}
      </div>

      <div className="pt-8 border-t border-white/10 animate-fade-in-up delay-400">
        <TrendVisualizer studentData={studentData} userSurveyData={userSurveyData} userAnalysisResult={result} />
      </div>

    </div>
  );
}
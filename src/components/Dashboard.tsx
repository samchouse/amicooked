"use client";

import { AnalysisResult } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { RotateCcw, AlertTriangle, Share2, Award, Zap } from "lucide-react";

interface DashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export default function Dashboard({ result, onReset }: DashboardProps) {
  
  const percentage = (result.cookedScore / 10) * 100;
  const strokeDasharray = 2 * Math.PI * 45; 
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  const getTheme = (score: number) => {
      // Low Score (Good) -> Green/Blue
      // High Score (Bad/Cooked) -> Red/Orange
      if (score <= 3) return { color: "text-blue-400", stroke: "#60a5fa", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "CHILL" };
      if (score <= 7) return { color: "text-yellow-400", stroke: "#facc15", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "MID" };
      if (score <= 9) return { color: "text-orange-500", stroke: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "COOKED" };
      return { color: "text-red-600", stroke: "#dc2626", bg: "bg-red-500/10", border: "border-red-500/20", label: "DOOMED" };
  };

  const theme = getTheme(result.cookedScore);

  return (
    <div className="w-full space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
            THE VERDICT <span className="text-xs bg-white text-black px-2 py-1 rounded font-mono font-bold">FINAL</span>
          </h2>
          <p className="text-zinc-400 mt-2 text-lg">
            Based on your current stats, you are: <span className={cn("font-bold", theme.color)}>{result.riskLevel}</span>
          </p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-2.5 font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2">
             <Share2 className="w-4 h-4" /> FLEX RESULT
           </button>
           <button 
            onClick={onReset}
            className="px-6 py-2.5 font-bold text-sm bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> RE-ROLL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: The Meter */}
        <div className="lg:col-span-5 bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
           <div className={cn("absolute inset-0 opacity-20 blur-3xl pointer-events-none", theme.bg)} />
           
           <div className="relative w-72 h-72 mb-6">
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

           <div className={cn("px-6 py-2 rounded-full border text-sm font-bold uppercase tracking-widest flex items-center gap-2", theme.color, theme.border, theme.bg)}>
             {result.cookedScore > 8 ? <AlertTriangle className="w-4 h-4" /> : <Award className="w-4 h-4" />}
             {theme.label}
           </div>
        </div>

        {/* Right: Stats & Advice */}
        <div className="lg:col-span-7 space-y-6">
           
           {/* Recommendations */}
           <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
              <h3 className="text-lg font-bold text-zinc-300 mb-6 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> Action Plan
              </h3>
              <ul className="space-y-4">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-4 items-start group">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-mono text-zinc-400 group-hover:bg-white group-hover:text-black transition-colors font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-zinc-300 leading-relaxed font-medium text-base group-hover:text-white transition-colors">
                      {rec}
                    </p>
                  </li>
                ))}
              </ul>
           </div>

           {/* Mini Chart */}
           <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
             <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={result.benchmarkComparison}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    barGap={4}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="category" 
                        type="category" 
                        width={100} 
                        tick={{fontSize: 10, fill: '#71717a', fontWeight: 'bold'}} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                      cursor={{fill: '#27272a', opacity: 0.4}}
                      contentStyle={{ 
                          backgroundColor: '#09090b', 
                          borderColor: '#27272a', 
                          color: '#fafafa',
                          fontSize: '12px',
                          fontWeight: 'bold'
                      }}
                    />
                    <Bar 
                        dataKey="userValue" 
                        fill="#fff" 
                        radius={[0, 2, 2, 0]} 
                        barSize={10} 
                    />
                    <Bar 
                        dataKey="averagePassing" 
                        fill="#3f3f46" 
                        radius={[0, 2, 2, 0]} 
                        barSize={10} 
                    />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           </div>

        </div>
      </div>
    </div>
  );
}

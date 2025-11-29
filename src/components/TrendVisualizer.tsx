"use client";

import { useState, useEffect, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { StudentData, AnalysisResult } from "@/lib/api";

interface TrendVisualizerProps {
  studentData: any[]; // Passed from server component or API
  userSurveyData: StudentData; // Current user's data from survey
  userAnalysisResult: AnalysisResult; // New prop for analysis results
}

// Variables that can be plotted
const VARIABLES = [
  // Numeric features from dataset
  { key: "age", label: "Age" },
  { key: "Medu", label: "Mother's Edu (0-4)" },
  { key: "Fedu", label: "Father's Edu (0-4)" },
  { key: "traveltime", label: "Travel Time (1-4)" },
  { key: "studytime", label: "Study Time (1-4)" },
  { key: "failures", label: "Past Failures" },
  { key: "famrel", label: "Family Relations (1-5)" },
  { key: "freetime", label: "Free Time (1-5)" },
  { key: "goout", label: "Going Out (1-5)" },
  { key: "Dalc", label: "Daily Alcohol (1-5)" },
  { key: "Walc", label: "Weekend Alcohol (1-5)" },
  { key: "health", label: "Health (1-5)" },
  { key: "absences", label: "Absences" },
  { key: "G1", label: "Grade 1 (0-20)" },
  { key: "G2", label: "Grade 2 (0-20)" },
  { key: "G3", label: "Final Grade (0-20)" }, 
  
  // Binary/Categorical, mapped to numeric for plotting
  { key: "sex", label: "Sex (F=0, M=1)" },
  { key: "address", label: "Address (U=0, R=1)" },
  { key: "famsize", label: "Family Size (LE3=0, GT3=1)" },
  { key: "Pstatus", label: "PStatus (A=0, T=1)" },
  { key: "schoolsup", label: "School Support (No=0, Yes=1)" },
  { key: "famsup", label: "Family Support (No=0, Yes=1)" },
  { key: "paid", label: "Paid Classes (No=0, Yes=1)" },
  { key: "activities", label: "Activities (No=0, Yes=1)" },
  { key: "nursery", label: "Nursery (No=0, Yes=1)" },
  { key: "higher", label: "Higher Edu (No=0, Yes=1)" },
  { key: "internet", label: "Internet (No=0, Yes=1)" },
  { key: "romantic", label: "Romantic (No=0, Yes=1)" },

  // Mjob, Fjob are nominal and complex for scatter plots, can add if needed.
  { key: "Mjob", label: "Mother's Job (Mapped)" },
  { key: "Fjob", label: "Father's Job (Mapped)" },
];

export default function TrendVisualizer({ studentData, userSurveyData, userAnalysisResult }: TrendVisualizerProps) {
  const [xVar, setXVar] = useState("studytime");
  const [yVar, setYVar] = useState("G3");
  const [showUser, setShowUser] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map user survey data to dataset keys
  const userPoint = useMemo(() => {
    const mappedUserPoint: { [key: string]: number | string } = {};

    const nominalToNumeric = (value: string | boolean | number, key: string) => {
      if (typeof value === 'boolean') return value ? 1 : 0;
      switch (key) {
        case 'sex': return value === 'M' ? 1 : 0; // F=0, M=1
        case 'address': return value === 'R' ? 1 : 0; // U=0, R=1
        case 'famsize': return value === 'GT3' ? 1 : 0; // LE3=0, GT3=1
        case 'Pstatus': return value === 'T' ? 1 : 0; // A=0, T=1
        case 'Mjob':
        case 'Fjob':
          const jobs = ["at_home", "health", "other", "services", "teacher"];
          return jobs.indexOf(value as string); 
        default: return value;
      }
    };

    // Iterate through survey data and map to numeric keys for plotting
    for (const varDef of VARIABLES) {
      const key = varDef.key;
      let value = (userSurveyData as any)[key]; 
      
      // Special handling for G3, G1, G2 
      if (key === 'G3') {
        mappedUserPoint[key] = userAnalysisResult.predictedG3; 
        continue;
      }
      
      // For G1 and G2, we now have them in the survey data, so we can use them directly
      // if they were provided (non-zero). If 0, we might fallback to predictedG3 or keep as 0.
      // However, the userSurveyData.G1 is the raw input.
      if (key === 'G1') {
         mappedUserPoint[key] = userSurveyData.G1 > 0 ? userSurveyData.G1 : userAnalysisResult.predictedG3;
         continue;
      }
      if (key === 'G2') {
         mappedUserPoint[key] = userSurveyData.G2 > 0 ? userSurveyData.G2 : userAnalysisResult.predictedG3;
         continue;
      }
      
      mappedUserPoint[key] = nominalToNumeric(value, key);
    }

    return mappedUserPoint;
  }, [userSurveyData, userAnalysisResult]);

  const chartData = useMemo(() => studentData.map((s, i) => ({
    x: Number(s[xVar]),
    y: Number(s[yVar]),
    id: i
  })).filter(p => !isNaN(p.x) && !isNaN(p.y)), [studentData, xVar, yVar]);

  const userChartPoint = useMemo(() => ({
    x: Number((userPoint as any)[xVar]),
    y: Number((userPoint as any)[yVar]),
    isUser: true
  }), [userPoint, xVar, yVar]);

  const trendLineData = useMemo(() => {
    if (chartData.length < 2) return [];

    const cleanData = chartData.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

    if (cleanData.length < 2) return [];
    
    const n = cleanData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (const p of cleanData) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return [];

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...cleanData.map(p => p.x));
    const maxX = Math.max(...cleanData.map(p => p.x));
    
    return [
      { x: minX, y: slope * minX + intercept, isTrend: true },
      { x: maxX, y: slope * maxX + intercept, isTrend: true }
    ];
  }, [chartData]);

  if (!mounted) return <div className="h-[400px] w-full flex items-center justify-center"><Loader2 className="animate-spin text-zinc-600" /></div>;

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trend Visualizer
          </h3>
          <p className="text-zinc-400 text-sm">Explore correlations in the student dataset.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <div className="bg-zinc-800 p-1 rounded-lg flex gap-2 items-center px-3 border border-zinc-700">
             <span className="text-xs font-bold text-zinc-500 uppercase">X-Axis</span>
             <select 
               value={xVar} 
               onChange={(e) => setXVar(e.target.value)}
               className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
             >
               {VARIABLES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
             </select>
           </div>

           <div className="bg-zinc-800 p-1 rounded-lg flex gap-2 items-center px-3 border border-zinc-700">
             <span className="text-xs font-bold text-zinc-500 uppercase">Y-Axis</span>
             <select 
               value={yVar} 
               onChange={(e) => setYVar(e.target.value)}
               className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
             >
               {VARIABLES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
             </select>
           </div>

           <button
             onClick={() => setShowUser(!showUser)}
             className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${showUser ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
           >
             {showUser ? 'Hide My Data' : 'Show My Data'}
           </button>
        </div>
      </div>

      <div className="h-[400px] w-full bg-zinc-900/30 rounded-xl border border-white/5 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name={VARIABLES.find(v => v.key === xVar)?.label} 
              tick={{ fill: '#71717a', fontSize: 12 }}
              label={{ value: VARIABLES.find(v => v.key === xVar)?.label, position: 'bottom', offset: 0, fill: '#a1a1aa', fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name={VARIABLES.find(v => v.key === yVar)?.label} 
              tick={{ fill: '#71717a', fontSize: 12 }}
              label={{ value: VARIABLES.find(v => v.key === yVar)?.label, angle: -90, position: 'left', fill: '#a1a1aa', fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: '#a1a1aa', strokeWidth: 1 }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  if (data.isTrend) return null; // Don't tooltip the trend line points
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl">
                      <p className="text-white font-bold text-sm mb-1">{data.isUser ? "YOU" : "Student Record"}</p>
                      <p className="text-zinc-400 text-xs">
                        {VARIABLES.find(v => v.key === xVar)?.label}: <span className="text-white">{data.x}</span>
                      </p>
                      <p className="text-zinc-400 text-xs">
                        {VARIABLES.find(v => v.key === yVar)?.label}: <span className="text-white">{data.y}</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Students" data={chartData} fill="#e4e4e7" fillOpacity={0.2} stroke="none" />
            
            {/* Trend Line */}
            <Scatter 
                name="Trend" 
                data={trendLineData} 
                line={{ stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' }} 
                shape={() => <g />} 
                legendType="none"
            />

            {showUser && (
              <Scatter name="You" data={[userChartPoint]} fill="#a855f7" shape="star" />
            )}
            
            {showUser && (
               <ReferenceLine x={userChartPoint.x} stroke="#a855f7" strokeDasharray="3 3" opacity={0.5} />
            )}
            {showUser && (
               <ReferenceLine y={userChartPoint.y} stroke="#a855f7" strokeDasharray="3 3" opacity={0.5} />
            )}

          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
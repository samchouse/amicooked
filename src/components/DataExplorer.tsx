"use client";

import { useState, useMemo } from "react";
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ComposedChart, ReferenceLine, Legend, Line
} from "recharts";
import { 
  TrendingUp, BarChart2, PieChart, AlertTriangle, Info, 
  ArrowRight, BrainCircuit, Telescope, Sparkles
} from "lucide-react";
import { StudentData, AnalysisResult } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DataExplorerProps {
  studentData: any[]; 
  userSurveyData: StudentData;
  userAnalysisResult: AnalysisResult;
}

const VARIABLES = [
  { key: "G3", label: "Final Grade (Target)", type: "target" },
  { key: "age", label: "Age", type: "demographic" },
  { key: "Medu", label: "Mother's Edu", type: "demographic" },
  { key: "Fedu", label: "Father's Edu", type: "demographic" },
  { key: "traveltime", label: "Travel Time", type: "habit" },
  { key: "studytime", label: "Study Time", type: "habit" },
  { key: "failures", label: "Past Failures", type: "performance" },
  { key: "famrel", label: "Family Relationship", type: "social" },
  { key: "freetime", label: "Free Time", type: "habit" },
  { key: "goout", label: "Going Out", type: "social" },
  { key: "Dalc", label: "Workday Alcohol", type: "health" },
  { key: "Walc", label: "Weekend Alcohol", type: "health" },
  { key: "health", label: "Health Status", type: "health" },
  { key: "absences", label: "Absences", type: "performance" },
];

const TABS = [
  { id: 'correlations', label: 'Correlations', icon: BrainCircuit },
  { id: 'distribution', label: 'Distributions', icon: BarChart2 },
  { id: 'explorer', label: 'Explorer', icon: Telescope },
];

export default function DataExplorer({ studentData, userSurveyData, userAnalysisResult }: DataExplorerProps) {
  const [activeTab, setActiveTab] = useState<string>('correlations');
  const [xVar, setXVar] = useState("studytime");
  const [yVar, setYVar] = useState("G3");

  // 1. Prepare Data
  const cleanData = useMemo(() => {
    if (!studentData || studentData.length === 0) return [];
    return studentData.map(s => ({
      ...s,
      G3: Number(s.G3),
      G1: Number(s.G1),
      G2: Number(s.G2),
      absences: Number(s.absences),
      // Ensure all numeric fields are numbers
      age: Number(s.age),
      Medu: Number(s.Medu),
      Fedu: Number(s.Fedu),
      traveltime: Number(s.traveltime),
      studytime: Number(s.studytime),
      failures: Number(s.failures),
      famrel: Number(s.famrel),
      freetime: Number(s.freetime),
      goout: Number(s.goout),
      Dalc: Number(s.Dalc),
      Walc: Number(s.Walc),
      health: Number(s.health),
    })).filter(s => !isNaN(s.G3));
  }, [studentData]);

  // 2. Calculate Correlations
  const correlations = useMemo(() => {
    if (cleanData.length === 0) return [];
    
    const calculateCorr = (x: number[], y: number[]) => {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
      const sumX2 = x.reduce((a, b) => a + b * b, 0);
      const sumY2 = y.reduce((a, b) => a + b * b, 0);
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      return denominator === 0 ? 0 : numerator / denominator;
    };

    const target = cleanData.map(d => d.G3);
    const result = VARIABLES
      .filter(v => v.key !== 'G3')
      .map(v => {
        const values = cleanData.map(d => d[v.key]);
        return {
          key: v.key,
          label: v.label,
          value: calculateCorr(values, target),
          type: v.type
        };
      })
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return result;
  }, [cleanData]);

  // 3. Grade Distribution
  const distribution = useMemo(() => {
    const counts = new Array(21).fill(0);
    cleanData.forEach(d => {
      const g = Math.round(d.G3);
      if (g >= 0 && g <= 20) counts[g]++;
    });
    return counts.map((count, grade) => ({ grade, count }));
  }, [cleanData]);

  // 4. User vs Avg Logic
  const getUserValue = (key: string) => {
    if (key === 'G3') return userAnalysisResult.predictedG3;
    // @ts-ignore
    return userSurveyData[key] !== undefined ? Number(userSurveyData[key]) : 0;
  };

  const getInsightText = () => {
    const userG3 = userAnalysisResult.predictedG3;
    const avgG3 = cleanData.reduce((acc, curr) => acc + curr.G3, 0) / cleanData.length;
    const diff = userG3 - avgG3;
    
    if (diff > 3) return "You're projected to perform significantly above average. Keep doing what you're doing.";
    if (diff > 0) return "You're slightly above the average student. Small optimizations could push you higher.";
    if (diff > -3) return "You're slightly below average. Focus on the high-impact factors (Failures, Study Time) to improve.";
    return "You are currently projected well below average. Major changes in study habits and attendance are recommended.";
  };

  const getCorrelationInsight = () => {
    const topPos = correlations.filter(c => c.value > 0)[0];
    const topNeg = correlations.filter(c => c.value < 0)[0];
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-300">
          <span className="text-green-400 font-bold">{topPos?.label}</span> has the strongest positive effect on grades, while <span className="text-red-400 font-bold">{topNeg?.label}</span> is the biggest grade killer.
        </p>
      </div>
    );
  };

  if (cleanData.length === 0) {
    return (
      <div className="p-8 border border-white/10 rounded-2xl bg-zinc-900/50 text-center">
        <div className="animate-pulse text-zinc-500">Loading dataset...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-xs font-mono uppercase border border-orange-500/20 flex items-center gap-1">
               <Sparkles className="w-3 h-3" />
               Data Intelligence
             </span>
             <span className="text-zinc-500 text-xs font-mono">n={cleanData.length} students</span>
           </div>
           <h2 className="text-3xl font-black text-white tracking-tight">
             Trend Explorer
           </h2>
           <p className="text-zinc-400 mt-2 max-w-2xl">
             Dive deep into the underlying data that powers our prediction model. 
             Analyze correlations, compare your stats against the population, and discover what truly drives academic success.
           </p>
        </div>

        <div className="flex bg-zinc-900/80 p-1 rounded-lg border border-white/10 backdrop-blur-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all",
                activeTab === tab.id 
                  ? "bg-zinc-800 text-white shadow-lg ring-1 ring-white/10" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Visualization */}
        <div className="lg:col-span-8 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 min-h-[500px] flex flex-col shadow-xl">
          
          {activeTab === 'correlations' && (
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-purple-500" />
                  Feature Importance
                </h3>
                <p className="text-zinc-400 text-sm">
                  Pearson correlation coefficients showing which factors most strongly influence Final Grade (G3).
                </p>
              </div>
              
              <div className="flex-1 w-full min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={correlations} margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" domain={[-0.5, 0.5]} tick={{fill: '#71717a', fontSize: 10}} />
                    <YAxis 
                      type="category" 
                      dataKey="label" 
                      width={140} 
                      tick={{fill: '#e4e4e7', fontSize: 11, fontWeight: 600}} 
                    />
                    <Tooltip 
                      cursor={{fill: '#ffffff05'}}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [value.toFixed(3), "Correlation"]}
                    />
                    <Bar dataKey="value" barSize={18} radius={[0, 4, 4, 0]}>
                      {correlations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? "#4ade80" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-500" />
                  Grade Distribution
                </h3>
                <p className="text-zinc-400 text-sm">
                  How students perform across the board (0-20 scale).
                </p>
              </div>

              <div className="flex-1 w-full min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="grade" 
                      tick={{fill: '#71717a'}} 
                      label={{ value: 'Final Grade (G3)', position: 'insideBottom', offset: -5, fill: '#71717a' }} 
                    />
                    <YAxis tick={{fill: '#71717a'}} />
                    <Tooltip 
                      cursor={{fill: '#ffffff05'}}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#3f3f46" barSize={32} radius={[4, 4, 0, 0]}>
                      {distribution.map((entry) => (
                         <Cell 
                           key={entry.grade} 
                           fill={entry.grade === Math.round(userAnalysisResult.predictedG3) ? "#facc15" : "#3f3f46"} 
                           fillOpacity={entry.grade === Math.round(userAnalysisResult.predictedG3) ? 1 : 0.6}
                         />
                      ))}
                    </Bar>
                    <ReferenceLine 
                      x={userAnalysisResult.predictedG3} 
                      stroke="#facc15" 
                      strokeDasharray="3 3"
                      label={{ position: 'top', value: 'YOU', fill: '#facc15', fontSize: 12, fontWeight: 'bold' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'explorer' && (
             <div className="flex flex-col h-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                   <div>
                     <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <Telescope className="w-5 h-5 text-orange-500" />
                       Interactive Explorer
                     </h3>
                     <p className="text-zinc-400 text-sm">Find patterns by plotting any two variables.</p>
                   </div>
                   
                   <div className="flex items-center gap-2 bg-zinc-800/50 p-1.5 rounded-lg border border-white/5">
                     <select 
                       value={xVar} onChange={(e) => setXVar(e.target.value)} 
                       className="bg-zinc-900 text-xs font-bold text-white border border-zinc-700 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                     >
                       {VARIABLES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                     </select>
                     <span className="text-zinc-500 text-xs font-bold px-1">VS</span>
                     <select 
                       value={yVar} onChange={(e) => setYVar(e.target.value)} 
                       className="bg-zinc-900 text-xs font-bold text-white border border-zinc-700 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                     >
                       {VARIABLES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                     </select>
                   </div>
                </div>

                <div className="flex-1 w-full min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        type="number" 
                        dataKey={xVar} 
                        name={VARIABLES.find(v => v.key === xVar)?.label} 
                        tick={{fill: '#71717a'}} 
                        label={{ value: VARIABLES.find(v => v.key === xVar)?.label, position: 'insideBottom', offset: -10, fill: '#71717a', fontSize: 12 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey={yVar} 
                        name={VARIABLES.find(v => v.key === yVar)?.label} 
                        tick={{fill: '#71717a'}} 
                        label={{ value: VARIABLES.find(v => v.key === yVar)?.label, angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 12 }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             const d = payload[0].payload;
                             return (
                                <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-xs text-white shadow-xl">
                                   <div className="font-bold mb-1 text-zinc-400 uppercase tracking-wider">{d.isUser ? "YOUR STATS" : "STUDENT RECORD"}</div>
                                   <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                      <span className="text-zinc-500">{VARIABLES.find(v => v.key === xVar)?.label}:</span>
                                      <span className="font-mono">{d[xVar]}</span>
                                      <span className="text-zinc-500">{VARIABLES.find(v => v.key === yVar)?.label}:</span>
                                      <span className="font-mono">{d[yVar]}</span>
                                   </div>
                                </div>
                             )
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Students" data={cleanData} fill="#71717a" fillOpacity={0.4} shape="circle" />
                      <Scatter 
                        name="You" 
                        data={[{ [xVar]: getUserValue(xVar), [yVar]: getUserValue(yVar), isUser: true }]} 
                        fill="#f97316" 
                        shape="star" 
                        r={150} /* Size relative to viewbox, so 150 is big but effectively star size */
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
             </div>
           )}

        </div>

        {/* Side Panel: Insights & Story */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* AI Summary Card */}
           <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Info className="w-24 h-24 text-white" />
             </div>
             
             <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-orange-500" /> Analysis Report
             </h4>
             
             <p className="text-white leading-relaxed mb-4 text-sm">
               {getInsightText()}
             </p>
             
             <div className="pt-4 border-t border-white/5">
               {getCorrelationInsight()}
             </div>
           </div>

           {/* Comparison Stats */}
           <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
              <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4">
                Key Metrics Comparison
              </h4>
              
              <div className="space-y-5">
                 {[
                   { label: 'Study Time', key: 'studytime', max: 4 },
                   { label: 'Absences', key: 'absences', max: 20 },
                   { label: 'Failures', key: 'failures', max: 3 },
                 ].map((stat) => {
                   const userVal = getUserValue(stat.key);
                   const avgVal = cleanData.reduce((a, b) => a + b[stat.key], 0) / cleanData.length;
                   const pct = Math.min((userVal / stat.max) * 100, 100);
                   
                   return (
                     <div key={stat.key}>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-zinc-400">{stat.label}</span>
                          <div className="flex gap-3">
                             <span className="text-white font-bold">You: {userVal}</span>
                             <span className="text-zinc-600">Avg: {avgVal.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                           {/* Average Marker */}
                           <div 
                             className="absolute top-0 bottom-0 w-0.5 bg-zinc-500 z-10" 
                             style={{ left: `${Math.min((avgVal / stat.max) * 100, 100)}%` }} 
                           />
                           <div 
                             className={cn("h-full rounded-full transition-all duration-1000", 
                               stat.key === 'failures' || stat.key === 'absences' ? (userVal > avgVal ? "bg-red-500" : "bg-green-500") : (userVal > avgVal ? "bg-green-500" : "bg-yellow-500")
                             )}
                             style={{ width: `${pct}%` }} 
                           />
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

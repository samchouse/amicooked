"use client";

import { useState, useEffect, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { Loader2, TrendingUp, Filter } from "lucide-react";

interface Student {
  [key: string]: string | number;
}

interface TrendVisualizerProps {
  studentData: any[]; // Passed from server component or API
  userResult: any; // Current user's data
}

const VARIABLES = [
  { key: "studytime", label: "Study Time (1-4)" },
  { key: "absences", label: "Absences" },
  { key: "G3", label: "Final Grade (0-20)" },
  { key: "health", label: "Health (1-5)" },
  { key: "goout", label: "Going Out (1-5)" },
  { key: "Dalc", label: "Daily Alcohol (1-5)" },
  { key: "Walc", label: "Weekend Alcohol (1-5)" },
  { key: "failures", label: "Past Failures" },
  { key: "freetime", label: "Free Time (1-5)" },
  { key: "age", label: "Age" },
];

export default function TrendVisualizer({ studentData, userResult }: TrendVisualizerProps) {
  const [xVar, setXVar] = useState("studytime");
  const [yVar, setYVar] = useState("G3");
  const [showUser, setShowUser] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare data for chart
  const userPoint = useMemo(() => ({
    studytime: userResult.studyTime,
    absences: userResult.absences,
    G3: userResult.predictedG3,
    health: userResult.health,
    goout: userResult.goOut,
    Dalc: Math.max(1, Math.floor(userResult.alcohol / 2)),
    Walc: Math.max(1, Math.ceil(userResult.alcohol / 2)),
    failures: userResult.failures,
    freetime: userResult.freeTime,
    age: 17
  }), [userResult]);

  const chartData = useMemo(() => studentData.map((s, i) => ({
    x: Number(s[xVar]),
    y: Number(s[yVar]),
    id: i
  })), [studentData, xVar, yVar]);

  const userChartPoint = useMemo(() => ({
    x: Number((userPoint as any)[xVar]),
    y: Number((userPoint as any)[yVar]),
    isUser: true
  }), [userPoint, xVar, yVar]);

  const trendLineData = useMemo(() => {
    if (chartData.length === 0) return [];

    const n = chartData.length;
    const sumX = chartData.reduce((acc, p) => acc + p.x, 0);
    const sumY = chartData.reduce((acc, p) => acc + p.y, 0);
    const sumXY = chartData.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = chartData.reduce((acc, p) => acc + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...chartData.map(p => p.x));
    const maxX = Math.max(...chartData.map(p => p.x));

    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
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
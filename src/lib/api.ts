export interface StudentData {
  hoursStudied: number;
  attendance: number;
  sleepHours: number;
  parentalInvolvement: "Low" | "Medium" | "High";
  accessToResources: "Low" | "Medium" | "High";
  extracurricularActivities: boolean;
  motivationLevel: "Low" | "Medium" | "High";
  internetAccess: boolean;
  familyIncome: "Low" | "Medium" | "High";
}

export interface AnalysisResult {
  cookedScore: number; // 1 (Great) to 10 (Cooked)
  riskLevel: "Academic Weapon" | "Mid" | "Cooked" | "Super Cooked";
  recommendations: string[];
  benchmarkComparison: {
    category: string;
    userValue: number;
    averagePassing: number;
    max: number;
  }[];
}

// TODO: Replace with API call
export async function analyzeStudentPerformance(data: StudentData): Promise<AnalysisResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let rawScore = 50; // Start in the middle

  // 1. Hours Studied
  rawScore -= (data.hoursStudied - 2) * 3; 

  // 2. Attendance
  if (data.attendance < 60) rawScore += 15;
  else if (data.attendance < 80) rawScore += 5;
  else if (data.attendance > 90) rawScore -= 10;

  // 3. Sleep Hours
  if (data.sleepHours < 5) rawScore += 10;
  else if (data.sleepHours > 8) rawScore -= 5;

  // 4. Categorical Factors
  if (data.motivationLevel === "Low") rawScore += 10;
  if (data.motivationLevel === "High") rawScore -= 10;

  if (data.accessToResources === "Low") rawScore += 5;
  if (data.accessToResources === "High") rawScore -= 5;

  if (data.parentalInvolvement === "Low") rawScore += 5;
  
  if (!data.internetAccess) rawScore += 5;

  // Clamp and map
  rawScore = Math.max(10, Math.min(100, rawScore));
  const cookedScore = parseFloat((rawScore / 10).toFixed(1));

  let riskLevel: AnalysisResult["riskLevel"] = "Academic Weapon";
  if (cookedScore > 3) riskLevel = "Mid";
  if (cookedScore > 7) riskLevel = "Cooked";
  if (cookedScore > 9) riskLevel = "Super Cooked";

  const recommendations = [];
  if (data.sleepHours < 6) recommendations.push("Sleepmaxxing Needed: You're running on 1HP. 6h+ is the meta for brain gains.");
  if (data.hoursStudied < 5) recommendations.push("Stop Doomscrolling: Your screen time > study time. Lock in for 2h/day to clutch the semester.");
  if (data.attendance < 85) recommendations.push("Negative Aura: Skipping class is giving NPC energy. Show up to diff the curve.");
  if (data.motivationLevel === "Low") recommendations.push("Find Your Grindset: You're drifting. Main character energy required immediately.");
  if (data.accessToResources === "Low" && data.internetAccess) recommendations.push("Use Your Buffs: You have internet. Abuse free resources like Khan Academy. No excuses.");

  if (recommendations.length === 0) recommendations.push("W Stat Line: Keep maintaining this aura. You are absolutely frying the competition.");

  return {
    cookedScore,
    riskLevel,
    recommendations,
    benchmarkComparison: [
      {
        category: "Grind (Hrs/Wk)",
        userValue: data.hoursStudied,
        averagePassing: 15,
        max: 30
      },
      {
        category: "Presence (%)",
        userValue: data.attendance,
        averagePassing: 85,
        max: 100
      },
      {
        category: "Rest (Hrs)",
        userValue: data.sleepHours,
        averagePassing: 7,
        max: 12
      }
    ]
  };
}
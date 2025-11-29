export interface StudentData {
  studyTime: number; // 1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h
  failures: number; // 0-4
  absences: number; // 0-93
  goOut: number; // 1-5
  freeTime: number; // 1-5
  alcohol: number; // 1-5 (Workday + Weekend combined proxy)
  health: number; // 1-5
  internet: boolean;
  romantic: boolean;
  higherEdu: boolean;
  motivationLevel: "Low" | "Medium" | "High";
}

export interface AnalysisResult {
  cookedScore: number; // 1-10
  predictedG3: number; // 0-20
  riskLevel: "Academic Weapon" | "Mid" | "Cooked" | "Super Cooked";
  probabilityOfFailing: number; // 0-100%
  recommendations: string[];
  radarData: {
    subject: string;
    A: number; // User
    B: number; // Average Passing Student
    fullMark: number;
  }[];
  factorImpacts: {
    factor: string;
    impact: "positive" | "negative" | "neutral";
    value: string;
  }[];
}

// Mock stats from student-por.csv (approximate means for passing students)
const PASSING_AVG = {
  studyTime: 2.5,
  failures: 0.1,
  absences: 3.5,
  goOut: 3.0,
  freeTime: 3.2,
  alcohol: 1.5,
  health: 3.8,
};

export async function analyzeStudentPerformance(data: StudentData): Promise<AnalysisResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // --- MOCK PREDICTION ALGORITHM ---
  // Base G3 score (average is ~11.9 in dataset)
  let score = 11.5;

  // 1. Failures (Strongest negative correlation)
  // Each failure drops grade significantly
  score -= data.failures * 1.5;

  // 2. Higher Education (Strong positive)
  if (data.higherEdu) score += 1.5;
  else score -= 1.5;

  // 3. Study Time (Positive)
  // 1: -1, 2: 0, 3: +1, 4: +2
  score += (data.studyTime - 2) * 0.8;

  // 4. Alcohol (Negative)
  // High alcohol consumption correlates with lower grades
  score -= (data.alcohol - 1) * 0.4;

  // 5. Absences (Negative, non-linear)
  if (data.absences > 10) score -= 1.5;
  else if (data.absences > 5) score -= 0.5;

  // 6. Romantic (Slightly negative often, distraction)
  if (data.romantic) score -= 0.3;

  // 7. Go Out (Moderate is good, Too high is bad)
  if (data.goOut > 4) score -= 0.5;

  // Clamp G3 (0-20)
  score = Math.max(0, Math.min(20, score));
  const predictedG3 = Math.round(score);

  // Calculate Cooked Score (1-10)
  // G3: 20 -> 1
  // G3: 0 -> 10
  // Inverse mapping
  let cookedScore = Math.max(1, Math.min(10, Math.round(11 - (score / 2))));
  // Adjust for extreme failures
  if (data.failures >= 3) cookedScore = Math.max(cookedScore, 9);

  let riskLevel: AnalysisResult["riskLevel"] = "Academic Weapon";
  let probFail = 5;

  if (predictedG3 < 10) {
     riskLevel = predictedG3 < 7 ? "Super Cooked" : "Cooked";
     probFail = 80 + (10 - predictedG3) * 4;
  } else if (predictedG3 < 14) {
     riskLevel = "Mid";
     probFail = 30 - (predictedG3 - 10) * 5;
  } else {
     riskLevel = "Academic Weapon";
     probFail = 5;
  }
  probFail = Math.min(99, Math.max(1, Math.round(probFail)));


  // Generate Recommendations (Brainrot style)
  const recommendations = [];
  if (data.failures > 0) recommendations.push(`Academic Comeback Needed: You have ${data.failures} past L's. You need to lock in exponentially harder.`);
  if (data.studyTime < 2) recommendations.push("Focus Flow 404: <2h study/week? Even NPCs study more. Pump those numbers.");
  if (data.motivationLevel === "Low") recommendations.push("Find Your Focus: You're drifting. Main character energy required immediately.");

  if (recommendations.length === 0) recommendations.push("W Stat Line: Keep maintaining this aura. You are absolutely frying the competition.");

  return {
    cookedScore,
    predictedG3,
    riskLevel,
    probabilityOfFailing: probFail,
    recommendations,
    radarData: [
      { subject: 'Focus Flow', A: data.studyTime * 25, B: PASSING_AVG.studyTime * 25, fullMark: 100 },
      { subject: 'Social', A: data.goOut * 20, B: PASSING_AVG.goOut * 20, fullMark: 100 }, // Scale 1-5 to 100
      { subject: 'HP', A: data.health * 20, B: PASSING_AVG.health * 20, fullMark: 100 }, // Scale 1-5 to 100
      { subject: 'Freedom', A: data.freeTime * 20, B: PASSING_AVG.freeTime * 20, fullMark: 100 },
      { subject: 'Attendance', A: Math.max(0, 100 - (data.absences * 2)), B: Math.max(0, 100 - (PASSING_AVG.absences * 2)), fullMark: 100 },
    ],
    factorImpacts: [
      { factor: "Study Habits", impact: data.studyTime > 2 ? "positive" : "negative", value: data.studyTime > 2 ? "High" : "Low" },
      { factor: "Past Failures", impact: data.failures === 0 ? "positive" : "negative", value: data.failures.toString() },
      { factor: "Attendance", impact: data.absences < 4 ? "positive" : "negative", value: `${data.absences} missed` },
      { factor: "Motivation", impact: data.motivationLevel !== "Low" ? "positive" : "negative", value: data.motivationLevel },
    ]
  };
}

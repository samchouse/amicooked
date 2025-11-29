export interface StudentData {
  // From dataset feature_names
  sex: "F" | "M";
  age: number; // 15-22
  address: "U" | "R";
  famsize: "LE3" | "GT3";
  Pstatus: "T" | "A";
  Medu: number; // 0-4
  Fedu: number; // 0-4
  Mjob: "teacher" | "health" | "services" | "at_home" | "other";
  Fjob: "teacher" | "health" | "services" | "at_home" | "other";
  traveltime: number; // 1-4
  studytime: number; // 1-4
  failures: number; // 0-4
  schoolsup: boolean; // yes/no
  famsup: boolean; // yes/no
  paid: boolean; // yes/no
  activities: boolean; // yes/no
  nursery: boolean; // yes/no
  higher: boolean; // yes/no
  internet: boolean; // yes/no
  romantic: boolean; // yes/no
  famrel: number; // 1-5
  freetime: number; // 1-5
  goout: number; // 1-5
  Dalc: number; // 1-5
  Walc: number; // 1-5
  health: number; // 1-5
  absences: number; // 0-93
  G1: number; // 0-20
  G2: number; // 0-20
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
  studytime: 2.5,
  failures: 0.1,
  absences: 3.5,
  goout: 3.0,
  freetime: 3.2,
  Dalc: 1.2,
  Walc: 2.0,
  health: 3.8,
  traveltime: 1.5,
  famrel: 4.0,
  Medu: 3.0,
  Fedu: 2.8,
  age: 17,
  G1: 12,
  G2: 12,
};

export async function analyzeStudentPerformance(data: StudentData): Promise<AnalysisResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // --- MOCK PREDICTION ALGORITHM ---
  // Base G3 score (average is ~11.9 in dataset)
  let score = 11.5;

  // Use G1 and G2 if available and non-zero for a "mid-term" check
  if (data.G1 > 0 || data.G2 > 0) {
      const currentAvg = (data.G1 + data.G2) / (data.G1 > 0 && data.G2 > 0 ? 2 : 1);
      score = currentAvg; // Start from current performance
  }

  // 1. Failures (Strongest negative correlation)
  score -= data.failures * 1.8;

  // 2. Higher Education (Strong positive)
  if (data.higher) score += 1.5;
  else score -= 1.5;

  // 3. Study Time (Positive)
  score += (data.studytime - 2) * 1.0;

  // 4. Alcohol (Negative) - More impact from weekend
  score -= (data.Dalc - 1) * 0.3;
  score -= (data.Walc - 1) * 0.5;

  // 5. Absences (Negative, non-linear)
  if (data.absences > 10) score -= 2.0;
  else if (data.absences > 5) score -= 1.0;
  else if (data.absences > 0) score -= 0.2;

  // 6. Romantic (Slightly negative often, distraction)
  if (data.romantic) score -= 0.5;

  // 7. Go Out (Moderate is good, Too high is bad)
  if (data.goout > 4) score -= 0.8;
  else if (data.goout < 2) score += 0.2; // Some social life is good

  // 8. Family Relationships (Positive)
  score += (data.famrel - 3) * 0.3;

  // 9. Parental Education (Positive)
  score += (data.Medu - 2) * 0.2;
  score += (data.Fedu - 2) * 0.2;

  // 10. School Support, Family Support, Paid classes, Activities, Nursery (mostly positive)
  if (data.schoolsup) score -= 0.5; // Schoolsup might indicate struggle
  if (data.famsup) score += 0.5;
  if (data.paid) score += 0.2;
  if (data.activities) score += 0.3;
  if (data.nursery) score += 0.1;

  // 11. Internet Access (Positive)
  if (data.internet) score += 0.5;

  // 12. Travel Time (Negative)
  score -= (data.traveltime - 1) * 0.3;

  // 13. Freetime (Balance is key)
  if (data.freetime > 4) score -= 0.2;
  else if (data.freetime < 2) score -= 0.2;

  // 14. Age (Older students sometimes struggle more - but also more mature)
  if (data.age > 18) score -= 0.3;

  // Clamp G3 (0-20)
  score = Math.max(0, Math.min(20, score));
  const predictedG3 = Math.round(score);

  // Calculate Cooked Score (1-10) - Inverse mapping
  let cookedScore = Math.max(1, Math.min(10, Math.round(11 - (score / 2))));
  if (data.failures >= 3) cookedScore = Math.max(cookedScore, 9); // Heavy penalty for failures

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

  // Generate Recommendations
  const recommendations = [];
  if (data.failures > 0) recommendations.push(`Academic Comeback Needed: You have ${data.failures} past L's. You need to lock in exponentially harder.`);
  if (data.studytime < 2) recommendations.push("Focus Flow 404: <2h study/week? Even NPCs study more. Pump those numbers.");
  if (data.Dalc > 2 || data.Walc > 3) recommendations.push(`Party Nerf: ${data.Dalc} (Workday) / ${data.Walc} (Weekend) alcohol is debuffing your INT. Sober up for the W.`);
  if (data.absences > 5) recommendations.push("Ghost Protocol: Skipping class isn't a strat. Show up or drop out.");
  if (!data.higher) recommendations.push("Aim Higher: No plans for uni? Bro, at least maximize your current stats.");
  if (data.romantic && predictedG3 < 12) recommendations.push("Simp Tax: Relationship might be nerfing your focus. Balance the romance with the books.");
  if (data.Medu < 2 && data.Fedu < 2) recommendations.push("Parental Buffs: Family education level is low. Seek mentors or external resources for guidance.");
  if (data.traveltime > 2) recommendations.push("Travel Lag: Long commute drains energy. Optimize study setup or consider closer options if possible.");
  if (data.freetime > 4 && data.studytime < 3) recommendations.push("Skill Issue: Too much free time, not enough study time. Balance the scales.");
  if (!data.internet) recommendations.push("Offline Mode: No internet access is a major debuff. Find a reliable connection for learning resources.");
  
  if (recommendations.length === 0) recommendations.push("Giga-Chad Status: Stats look clean. Keep mogging the curriculum.");

  return {
    cookedScore,
    predictedG3,
    riskLevel,
    probabilityOfFailing: probFail,
    recommendations,
    radarData: [
      { subject: 'Focus Flow', A: data.studytime * 25, B: PASSING_AVG.studytime * 25, fullMark: 100 },
      { subject: 'Social Life', A: (data.goout + data.Dalc + data.Walc) * (100 / 15), B: (PASSING_AVG.goout + PASSING_AVG.Dalc + PASSING_AVG.Walc) * (100 / 15), fullMark: 100 }, 
      { subject: 'Health', A: data.health * 20, B: PASSING_AVG.health * 20, fullMark: 100 },
      { subject: 'Family Rel.', A: data.famrel * 20, B: PASSING_AVG.famrel * 20, fullMark: 100 },
      { subject: 'Parental Edu', A: ((data.Medu + data.Fedu) / 2) * 25, B: ((PASSING_AVG.Medu + PASSING_AVG.Fedu) / 2) * 25, fullMark: 100 },
      { subject: 'Attendance', A: Math.max(0, 100 - (data.absences * 2)), B: Math.max(0, 100 - (PASSING_AVG.absences * 2)), fullMark: 100 },
    ],
    factorImpacts: [
      { factor: "Study Habits", impact: data.studytime > 2 ? "positive" : "negative", value: data.studytime > 2 ? "High" : "Low" },
      { factor: "Past Failures", impact: data.failures === 0 ? "positive" : "negative", value: data.failures.toString() },
      { factor: "Absences", impact: data.absences < 4 ? "positive" : "negative", value: `${data.absences} missed` },
      { factor: "Parental Support", impact: data.famsup ? "positive" : "negative", value: data.famsup ? "Yes" : "No" },
      { factor: "Internet Access", impact: data.internet ? "positive" : "negative", value: data.internet ? "Yes" : "No" },
      { factor: "Current Grades", impact: data.G1 > 10 || data.G2 > 10 ? "positive" : "neutral", value: `G1:${data.G1} G2:${data.G2}` },
    ]
  };
}

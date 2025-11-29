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
  traveltime: number; // Raw minutes
  studytime: number; // Raw hours
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
  studytime: 4, // ~4 hours/week
  failures: 0.1,
  absences: 3.5,
  goout: 3.0,
  freetime: 3.2,
  Dalc: 1.2,
  Walc: 2.0,
  health: 3.8,
  traveltime: 25, // ~25 minutes
  famrel: 4.0,
  Medu: 3.0,
  Fedu: 2.8,
  age: 17,
  G1: 12,
  G2: 12,
};

export async function analyzeStudentPerformance(data: StudentData): Promise<AnalysisResult> {
  // Map frontend data to backend features
  const features = {
    studytime: data.studytime,
    failures: data.failures,
    absences: data.absences,
    goout: data.goout,
    freetime: data.freetime,
    Dalc: data.Dalc,
    Walc: data.Walc,
    health: data.health,
    traveltime: data.traveltime,
    internet: data.internet ? "yes" : "no",
    romantic: data.romantic ? "yes" : "no",
    higher: data.higher ? "yes" : "no",
    schoolsup: data.schoolsup ? "yes" : "no",
    famsup: data.famsup ? "yes" : "no",
    paid: data.paid ? "yes" : "no",
    activities: data.activities ? "yes" : "no",
    nursery: data.nursery ? "yes" : "no",
    sex: data.sex,
    age: data.age,
    address: data.address,
    famsize: data.famsize,
    Pstatus: data.Pstatus,
    Medu: data.Medu,
    Fedu: data.Fedu,
    Mjob: data.Mjob,
    Fjob: data.Fjob,
    famrel: data.famrel,
    G1: data.G1,
    G2: data.G2,
  };

  const response = await fetch("/api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(features),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const result = await response.json();
  const cookedScore = result.score;
  const apiMessage = result.message;

  // Reverse calculate G3 from Cooked Score for UI consistency
  // cookedScore = 11 - G3/2  => G3 = (11 - cookedScore) * 2
  const predictedG3 = Math.max(0, Math.min(20, (11 - cookedScore) * 2));

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

  // Generate Recommendations (Brainrot style + API message)
  const recommendations = [];
  if (apiMessage) recommendations.push(`AI Verdict: ${apiMessage}`);
  
  if (data.failures > 0) recommendations.push(`Academic Comeback Needed: You have ${data.failures} past L's. You need to lock in exponentially harder.`);
  if (data.studytime < 3) recommendations.push("Focus Flow 404: <3h study/week? Even NPCs study more. Pump those numbers.");
  if (data.Dalc > 2 || data.Walc > 3) recommendations.push(`Party Nerf: ${data.Dalc} (Workday) / ${data.Walc} (Weekend) alcohol is debuffing your INT. Sober up for the W.`);
  if (data.absences > 5) recommendations.push("Ghost Protocol: Skipping class isn't a strat. Show up or drop out.");
  if (!data.higher) recommendations.push("Aim Higher: No plans for uni? Bro, at least maximize your current stats.");
  if (data.romantic && predictedG3 < 12) recommendations.push("Simp Tax: Relationship might be nerfing your focus. Balance the romance with the books.");
  if (data.Medu < 2 && data.Fedu < 2) recommendations.push("Parental Buffs: Family education level is low. Seek mentors or external resources for guidance.");
  if (data.traveltime > 60) recommendations.push("Travel Lag: >1h commute drains energy. Optimize study setup or consider closer options if possible.");
  if (data.freetime > 4 && data.studytime < 5) recommendations.push("Skill Issue: Too much free time, not enough study time. Balance the scales.");
  if (!data.internet) recommendations.push("Offline Mode: No internet access is a major debuff. Find a reliable connection for learning resources.");
  
  if (recommendations.length === 0) recommendations.push("Giga-Chad Status: Stats look clean. Keep mogging the curriculum.");

  return {
    cookedScore,
    predictedG3,
    riskLevel,
    probabilityOfFailing: probFail,
    recommendations,
    radarData: [
      { subject: 'Focus Flow', A: Math.min(100, data.studytime * 5), B: Math.min(100, PASSING_AVG.studytime * 5), fullMark: 100 }, // 20h = 100%
      { subject: 'Social Life', A: (data.goout + data.Dalc + data.Walc) * (100 / 15), B: (PASSING_AVG.goout + PASSING_AVG.Dalc + PASSING_AVG.Walc) * (100 / 15), fullMark: 100 }, 
      { subject: 'Health', A: data.health * 20, B: PASSING_AVG.health * 20, fullMark: 100 },
      { subject: 'Family Rel.', A: data.famrel * 20, B: PASSING_AVG.famrel * 20, fullMark: 100 },
      { subject: 'Parental Edu', A: ((data.Medu + data.Fedu) / 2) * 25, B: ((PASSING_AVG.Medu + PASSING_AVG.Fedu) / 2) * 25, fullMark: 100 },
      { subject: 'Attendance', A: Math.max(0, 100 - (data.absences * 2)), B: Math.max(0, 100 - (PASSING_AVG.absences * 2)), fullMark: 100 },
    ],
    factorImpacts: [
      { factor: "Study Habits", impact: data.studytime > 5 ? "positive" : "negative", value: data.studytime > 5 ? "High" : "Low" },
      { factor: "Past Failures", impact: data.failures === 0 ? "positive" : "negative", value: data.failures.toString() },
      { factor: "Absences", impact: data.absences < 4 ? "positive" : "negative", value: `${data.absences} missed` },
      { factor: "Parental Support", impact: data.famsup ? "positive" : "negative", value: data.famsup ? "Yes" : "No" },
      { factor: "Internet Access", impact: data.internet ? "positive" : "negative", value: data.internet ? "Yes" : "No" },
      { factor: "Current Grades", impact: data.G1 > 10 || data.G2 > 10 ? "positive" : "neutral", value: `G1:${data.G1} G2:${data.G2}` },
    ]
  };
}
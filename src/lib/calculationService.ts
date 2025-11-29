/**
 * Student Performance Calculation Service
 *
 * This module contains the mock algorithm for calculating academic risk scores.
 * The algorithm is based on the Student Performance Factors dataset structure.
 */

import { SurveyData, CalculationResult, FactorAnalysis, ComparisonData } from './types';

// Optimal values based on dataset analysis for passing students
const OPTIMAL_VALUES = {
  hoursStudied: 20,        // hours per week
  attendance: 85,          // percentage
  sleepHours: 7.5,         // hours per night
  previousScores: 75,      // percentage
  tutoringSessions: 2,     // per month
  physicalActivity: 4,     // hours per week
};

// Weight factors for each variable (sum to 1)
const WEIGHTS = {
  hoursStudied: 0.15,
  attendance: 0.15,
  parentalInvolvement: 0.05,
  accessToResources: 0.05,
  extracurricularActivities: 0.03,
  sleepHours: 0.08,
  previousScores: 0.12,
  motivationLevel: 0.10,
  internetAccess: 0.02,
  tutoringSessions: 0.05,
  familyIncome: 0.02,
  teacherQuality: 0.05,
  schoolType: 0.02,
  peerInfluence: 0.05,
  physicalActivity: 0.03,
  learningDisabilities: 0.03,
};

/**
 * Converts categorical values to numeric scores (0-1 scale)
 */
function categoricalToScore(value: 'Low' | 'Medium' | 'High'): number {
  switch (value) {
    case 'Low': return 0.33;
    case 'Medium': return 0.66;
    case 'High': return 1.0;
  }
}

function peerInfluenceToScore(value: 'Positive' | 'Neutral' | 'Negative'): number {
  switch (value) {
    case 'Positive': return 1.0;
    case 'Neutral': return 0.5;
    case 'Negative': return 0.0;
  }
}

function educationLevelToScore(value: 'High School' | 'College' | 'Postgraduate'): number {
  switch (value) {
    case 'High School': return 0.33;
    case 'College': return 0.66;
    case 'Postgraduate': return 1.0;
  }
}

function distanceToScore(value: 'Near' | 'Moderate' | 'Far'): number {
  switch (value) {
    case 'Near': return 1.0;
    case 'Moderate': return 0.66;
    case 'Far': return 0.33;
  }
}

/**
 * Normalizes a numeric value based on optimal range
 */
function normalizeValue(value: number, optimal: number, max: number): number {
  const diff = Math.abs(value - optimal);
  const maxDiff = Math.max(optimal, max - optimal);
  return Math.max(0, 1 - (diff / maxDiff));
}

/**
 * Main calculation function - MOCK IMPLEMENTATION
 *
 * // TODO: Replace with API call
 * // Future implementation should call:
 * // POST /api/calculate-score
 * // Body: { surveyData: SurveyData }
 * // Response: { result: CalculationResult }
 */
export async function calculateCookedScore(data: SurveyData): Promise<CalculationResult> {
  // TODO: Replace with API call
  // const response = await fetch('/api/calculate-score', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ surveyData: data }),
  // });
  // return response.json();

  // Simulate network delay for realistic UX
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Calculate individual factor scores (0-1 scale, 1 = optimal)
  const factorScores = {
    hoursStudied: normalizeValue(data.hoursStudied, OPTIMAL_VALUES.hoursStudied, 40),
    attendance: normalizeValue(data.attendance, OPTIMAL_VALUES.attendance, 100),
    parentalInvolvement: categoricalToScore(data.parentalInvolvement),
    accessToResources: categoricalToScore(data.accessToResources),
    extracurricularActivities: data.extracurricularActivities ? 0.8 : 0.4,
    sleepHours: normalizeValue(data.sleepHours, OPTIMAL_VALUES.sleepHours, 12),
    previousScores: data.previousScores / 100,
    motivationLevel: categoricalToScore(data.motivationLevel),
    internetAccess: data.internetAccess ? 1.0 : 0.3,
    tutoringSessions: normalizeValue(data.tutoringSessions, OPTIMAL_VALUES.tutoringSessions, 8),
    familyIncome: categoricalToScore(data.familyIncome),
    teacherQuality: categoricalToScore(data.teacherQuality),
    schoolType: data.schoolType === 'Private' ? 0.7 : 0.5, // Slight advantage, but not huge
    peerInfluence: peerInfluenceToScore(data.peerInfluence),
    physicalActivity: normalizeValue(data.physicalActivity, OPTIMAL_VALUES.physicalActivity, 10),
    learningDisabilities: data.learningDisabilities ? 0.4 : 0.8,
  };

  // Calculate weighted composite score (0-1 scale)
  let compositeScore = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    compositeScore += factorScores[key as keyof typeof factorScores] * weight;
  }

  // Convert to cooked score (1-10, inverted so 10 = bad)
  const cookedScore = Math.round((1 - compositeScore) * 9 + 1);

  // Determine risk level
  const riskLevel = getRiskLevel(cookedScore);

  // Build factor analysis
  const factors = buildFactorAnalysis(data, factorScores);

  // Generate recommendations
  const recommendations = generateRecommendations(data, factorScores);

  // Build comparison data
  const comparisonData = buildComparisonData(data);

  return {
    cookedScore: Math.min(10, Math.max(1, cookedScore)),
    riskLevel,
    factors,
    recommendations,
    comparisonData,
  };
}

function getRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score <= 3) return 'Low';
  if (score <= 5) return 'Medium';
  if (score <= 7) return 'High';
  return 'Critical';
}

function buildFactorAnalysis(data: SurveyData, scores: Record<string, number>): FactorAnalysis[] {
  const factors: FactorAnalysis[] = [
    {
      name: 'Study Hours',
      userValue: (data.hoursStudied / OPTIMAL_VALUES.hoursStudied) * 100,
      optimalValue: 100,
      impact: scores.hoursStudied >= 0.7 ? 'positive' : scores.hoursStudied >= 0.4 ? 'neutral' : 'negative',
      weight: WEIGHTS.hoursStudied,
    },
    {
      name: 'Attendance',
      userValue: data.attendance,
      optimalValue: OPTIMAL_VALUES.attendance,
      impact: data.attendance >= 80 ? 'positive' : data.attendance >= 60 ? 'neutral' : 'negative',
      weight: WEIGHTS.attendance,
    },
    {
      name: 'Sleep Quality',
      userValue: (data.sleepHours / 8) * 100,
      optimalValue: 100,
      impact: scores.sleepHours >= 0.7 ? 'positive' : scores.sleepHours >= 0.4 ? 'neutral' : 'negative',
      weight: WEIGHTS.sleepHours,
    },
    {
      name: 'Motivation',
      userValue: categoricalToScore(data.motivationLevel) * 100,
      optimalValue: 100,
      impact: data.motivationLevel === 'High' ? 'positive' : data.motivationLevel === 'Medium' ? 'neutral' : 'negative',
      weight: WEIGHTS.motivationLevel,
    },
    {
      name: 'Previous Performance',
      userValue: data.previousScores,
      optimalValue: OPTIMAL_VALUES.previousScores,
      impact: data.previousScores >= 70 ? 'positive' : data.previousScores >= 50 ? 'neutral' : 'negative',
      weight: WEIGHTS.previousScores,
    },
    {
      name: 'Support System',
      userValue: (categoricalToScore(data.parentalInvolvement) + peerInfluenceToScore(data.peerInfluence)) * 50,
      optimalValue: 100,
      impact: scores.parentalInvolvement >= 0.7 && scores.peerInfluence >= 0.7 ? 'positive' : 'neutral',
      weight: WEIGHTS.parentalInvolvement + WEIGHTS.peerInfluence,
    },
  ];

  return factors;
}

function generateRecommendations(data: SurveyData, scores: Record<string, number>): string[] {
  const recommendations: string[] = [];

  if (scores.hoursStudied < 0.5) {
    recommendations.push('Increase your weekly study hours to at least 15-20 hours for better results.');
  }
  if (scores.attendance < 0.7) {
    recommendations.push('Aim for at least 80% class attendance - it strongly correlates with success.');
  }
  if (scores.sleepHours < 0.6) {
    recommendations.push('Prioritize 7-8 hours of sleep - it improves memory retention and focus.');
  }
  if (scores.motivationLevel < 0.5) {
    recommendations.push('Set clear, achievable goals and reward yourself for milestones.');
  }
  if (scores.peerInfluence < 0.5) {
    recommendations.push('Consider joining study groups with motivated peers.');
  }
  if (!data.tutoringSessions && scores.previousScores < 0.6) {
    recommendations.push('Consider tutoring sessions to address knowledge gaps.');
  }
  if (scores.physicalActivity < 0.4) {
    recommendations.push('Add regular physical activity - it boosts cognitive performance.');
  }
  if (!data.extracurricularActivities) {
    recommendations.push('Extracurricular activities can improve time management and motivation.');
  }

  // Always include at least one positive suggestion
  if (recommendations.length === 0) {
    recommendations.push('Keep up the great work! Maintain your current habits for continued success.');
  }

  return recommendations.slice(0, 5); // Limit to top 5
}

function buildComparisonData(data: SurveyData): ComparisonData {
  // Average values for students with passing grades (based on dataset patterns)
  const avgPassing = {
    studyHours: 75,    // 75% of optimal
    attendance: 85,
    sleep: 90,         // 90% of optimal (7+ hours)
    motivation: 80,
    resources: 75,
    support: 70,
  };

  return {
    categories: ['Study Hours', 'Attendance', 'Sleep', 'Motivation', 'Resources', 'Support'],
    userScores: [
      Math.round((data.hoursStudied / OPTIMAL_VALUES.hoursStudied) * 100),
      Math.round(data.attendance),
      Math.round((data.sleepHours / 8) * 100),
      Math.round(categoricalToScore(data.motivationLevel) * 100),
      Math.round(categoricalToScore(data.accessToResources) * 100),
      Math.round((categoricalToScore(data.parentalInvolvement) + peerInfluenceToScore(data.peerInfluence)) * 50),
    ],
    avgPassingScores: [
      avgPassing.studyHours,
      avgPassing.attendance,
      avgPassing.sleep,
      avgPassing.motivation,
      avgPassing.resources,
      avgPassing.support,
    ],
  };
}

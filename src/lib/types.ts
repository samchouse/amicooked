// Types based on the Kaggle Student Performance Factors dataset
// by lainguyn123

export interface SurveyData {
  hoursStudied: number;           // Hours_Studied
  attendance: number;             // Attendance (percentage)
  parentalInvolvement: 'Low' | 'Medium' | 'High';  // Parental_Involvement
  accessToResources: 'Low' | 'Medium' | 'High';    // Access_to_Resources
  extracurricularActivities: boolean;              // Extracurricular_Activities
  sleepHours: number;             // Sleep_Hours
  previousScores: number;         // Previous_Scores (0-100)
  motivationLevel: 'Low' | 'Medium' | 'High';      // Motivation_Level
  internetAccess: boolean;        // Internet_Access
  tutoringSessions: number;       // Tutoring_Sessions (per month)
  familyIncome: 'Low' | 'Medium' | 'High';         // Family_Income
  teacherQuality: 'Low' | 'Medium' | 'High';       // Teacher_Quality
  schoolType: 'Public' | 'Private';                // School_Type
  peerInfluence: 'Positive' | 'Neutral' | 'Negative'; // Peer_Influence
  physicalActivity: number;       // Physical_Activity (hours per week)
  learningDisabilities: boolean;  // Learning_Disabilities
  parentalEducationLevel: 'High School' | 'College' | 'Postgraduate'; // Parental_Education_Level
  distanceFromHome: 'Near' | 'Moderate' | 'Far';   // Distance_from_Home
  gender: 'Male' | 'Female';      // Gender
}

export interface CalculationResult {
  cookedScore: number;            // 1-10 scale (1 = doing great, 10 = cooked)
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: FactorAnalysis[];
  recommendations: string[];
  comparisonData: ComparisonData;
}

export interface FactorAnalysis {
  name: string;
  userValue: number;
  optimalValue: number;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

export interface ComparisonData {
  categories: string[];
  userScores: number[];
  avgPassingScores: number[];
}

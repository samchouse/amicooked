/**
 * Survey Configuration
 *
 * Maps dataset columns to user-friendly survey questions
 * organized into logical steps for better UX.
 */

import { SurveyData } from './types';

export interface QuestionConfig {
  id: keyof SurveyData;
  label: string;
  question: string;
  description?: string;
  type: 'slider' | 'select' | 'toggle';
  options?: { value: string | number | boolean; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface StepConfig {
  title: string;
  description: string;
  icon: string;
  questions: QuestionConfig[];
}

export const surveySteps: StepConfig[] = [
  {
    title: 'Study Habits',
    description: 'Tell us about your learning routine',
    icon: '📚',
    questions: [
      {
        id: 'hoursStudied',
        label: 'Weekly Study Hours',
        question: 'How many hours do you study per week?',
        description: 'Include time spent on homework, assignments, and self-study',
        type: 'slider',
        min: 0,
        max: 40,
        step: 1,
        unit: 'hours',
      },
      {
        id: 'attendance',
        label: 'Class Attendance',
        question: 'What is your average class attendance?',
        description: 'Percentage of classes you typically attend',
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        unit: '%',
      },
      {
        id: 'tutoringSessions',
        label: 'Tutoring Sessions',
        question: 'How many tutoring sessions do you attend monthly?',
        type: 'slider',
        min: 0,
        max: 8,
        step: 1,
        unit: 'sessions',
      },
    ],
  },
  {
    title: 'Academic Background',
    description: 'Your previous performance and resources',
    icon: '🎓',
    questions: [
      {
        id: 'previousScores',
        label: 'Previous Grades',
        question: 'What was your average score in previous exams?',
        description: 'Your typical grade percentage',
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        unit: '%',
      },
      {
        id: 'accessToResources',
        label: 'Learning Resources',
        question: 'How would you rate your access to learning resources?',
        description: 'Books, study materials, educational tools',
        type: 'select',
        options: [
          { value: 'Low', label: 'Limited - Basic textbooks only' },
          { value: 'Medium', label: 'Moderate - Some additional resources' },
          { value: 'High', label: 'Excellent - All resources available' },
        ],
      },
      {
        id: 'internetAccess',
        label: 'Internet Access',
        question: 'Do you have reliable internet access for studying?',
        type: 'toggle',
      },
    ],
  },
  {
    title: 'School Environment',
    description: 'Your educational setting',
    icon: '🏫',
    questions: [
      {
        id: 'schoolType',
        label: 'School Type',
        question: 'What type of school do you attend?',
        type: 'select',
        options: [
          { value: 'Public', label: 'Public School' },
          { value: 'Private', label: 'Private School' },
        ],
      },
      {
        id: 'teacherQuality',
        label: 'Teacher Quality',
        question: 'How would you rate your teachers overall?',
        type: 'select',
        options: [
          { value: 'Low', label: 'Below average - Often unavailable' },
          { value: 'Medium', label: 'Average - Generally helpful' },
          { value: 'High', label: 'Excellent - Very supportive' },
        ],
      },
      {
        id: 'distanceFromHome',
        label: 'Distance from School',
        question: 'How far do you travel to school?',
        type: 'select',
        options: [
          { value: 'Near', label: 'Near - Less than 15 minutes' },
          { value: 'Moderate', label: 'Moderate - 15-45 minutes' },
          { value: 'Far', label: 'Far - More than 45 minutes' },
        ],
      },
    ],
  },
  {
    title: 'Lifestyle & Wellness',
    description: 'Your daily habits and health',
    icon: '🌟',
    questions: [
      {
        id: 'sleepHours',
        label: 'Sleep Hours',
        question: 'How many hours do you sleep per night?',
        description: 'Average hours of sleep on school nights',
        type: 'slider',
        min: 3,
        max: 12,
        step: 0.5,
        unit: 'hours',
      },
      {
        id: 'physicalActivity',
        label: 'Physical Activity',
        question: 'How many hours of physical activity do you get weekly?',
        description: 'Sports, exercise, or active hobbies',
        type: 'slider',
        min: 0,
        max: 15,
        step: 1,
        unit: 'hours',
      },
      {
        id: 'extracurricularActivities',
        label: 'Extracurricular Activities',
        question: 'Do you participate in extracurricular activities?',
        description: 'Clubs, sports teams, arts, etc.',
        type: 'toggle',
      },
    ],
  },
  {
    title: 'Motivation & Mindset',
    description: 'Your drive and learning challenges',
    icon: '💪',
    questions: [
      {
        id: 'motivationLevel',
        label: 'Motivation Level',
        question: 'How motivated are you to succeed academically?',
        type: 'select',
        options: [
          { value: 'Low', label: 'Low - Struggling to stay engaged' },
          { value: 'Medium', label: 'Medium - Reasonably motivated' },
          { value: 'High', label: 'High - Very driven and focused' },
        ],
      },
      {
        id: 'learningDisabilities',
        label: 'Learning Challenges',
        question: 'Do you have any diagnosed learning disabilities?',
        description: 'Such as dyslexia, ADHD, etc.',
        type: 'toggle',
      },
    ],
  },
  {
    title: 'Support System',
    description: 'Your family and social environment',
    icon: '👨‍👩‍👧‍👦',
    questions: [
      {
        id: 'parentalInvolvement',
        label: 'Parental Involvement',
        question: 'How involved are your parents in your education?',
        type: 'select',
        options: [
          { value: 'Low', label: 'Low - Minimal involvement' },
          { value: 'Medium', label: 'Medium - Occasional support' },
          { value: 'High', label: 'High - Very engaged and supportive' },
        ],
      },
      {
        id: 'parentalEducationLevel',
        label: 'Parental Education',
        question: "What is your parents' highest education level?",
        type: 'select',
        options: [
          { value: 'High School', label: 'High School' },
          { value: 'College', label: 'College/University' },
          { value: 'Postgraduate', label: 'Postgraduate (Masters/PhD)' },
        ],
      },
      {
        id: 'peerInfluence',
        label: 'Peer Influence',
        question: 'How would you describe your friends\' influence on your studies?',
        type: 'select',
        options: [
          { value: 'Negative', label: 'Negative - Distract from studies' },
          { value: 'Neutral', label: 'Neutral - No significant impact' },
          { value: 'Positive', label: 'Positive - Encourage studying' },
        ],
      },
      {
        id: 'familyIncome',
        label: 'Family Income',
        question: 'What is your family\'s income level?',
        description: 'This helps contextualize access to resources',
        type: 'select',
        options: [
          { value: 'Low', label: 'Below average' },
          { value: 'Medium', label: 'Average' },
          { value: 'High', label: 'Above average' },
        ],
      },
    ],
  },
  {
    title: 'About You',
    description: 'Basic demographic information',
    icon: '👤',
    questions: [
      {
        id: 'gender',
        label: 'Gender',
        question: 'What is your gender?',
        type: 'select',
        options: [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
        ],
      },
    ],
  },
];

// Default values for the survey
export const defaultSurveyData: SurveyData = {
  hoursStudied: 10,
  attendance: 75,
  parentalInvolvement: 'Medium',
  accessToResources: 'Medium',
  extracurricularActivities: false,
  sleepHours: 7,
  previousScores: 60,
  motivationLevel: 'Medium',
  internetAccess: true,
  tutoringSessions: 0,
  familyIncome: 'Medium',
  teacherQuality: 'Medium',
  schoolType: 'Public',
  peerInfluence: 'Neutral',
  physicalActivity: 2,
  learningDisabilities: false,
  parentalEducationLevel: 'College',
  distanceFromHome: 'Moderate',
  gender: 'Male',
};

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  instruction: string;
}

export interface WorkoutDay {
  day: string;
  exercises: Exercise[];
}

export interface WorkoutStats {
  level: string;
  goal: string;
  age?: number | string;
  gender?: string;
  equipment?: string;
  includeWarmup?: boolean;
  cardioPref?: string;
}

export interface SavedWorkoutDoc {
  id: string;
  title: string;
  plan: WorkoutDay[];
  stats: WorkoutStats;
  savedAt?: any;
}

export interface MealItem {
  type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietPlan {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goal: string;
  meals?: MealItem[];
}

export interface DietStats {
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  activity?: string;
  goal?: string;
  dietType?: 'veg' | 'nonveg';
}

export interface SavedDietDoc {
  id: string;
  title: string;
  plan: DietPlan;
  stats: DietStats;
  savedAt?: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

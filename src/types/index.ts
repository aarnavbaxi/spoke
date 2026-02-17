export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at?: string;
  current_streak: number;
  longest_streak: number;
  last_practice_date?: string;
  total_sessions: number;
}

export interface Session {
  id: string;
  user_id: string;
  transcript: string;
  duration: number;
  audio_url?: string;
  created_at: string;
  filler_words_count: number;
  speaking_pace: number;
  vocab_diversity: number;
  ai_feedback?: string;
  session_mode: 'freeform' | 'interview' | 'custom';
  prompt_used?: string;
  advanced_metrics?: AdvancedMetrics;
}

export interface AdvancedMetrics {
  sentence_complexity: {
    avg_sentence_length: number;
    complexity_score: number;
  };
  pause_analysis: {
    total_pauses: number;
    avg_pause_duration: number;
    awkward_pauses: number;
  };
  vocab_sophistication: number;
  confidence_score: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  badge_name: string;
  badge_description: string;
  unlocked_at: string;
}

export type BadgeType =
  | 'first_session'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'sessions_10'
  | 'sessions_50'
  | 'sessions_100'
  | 'filler_free'
  | 'speed_demon'
  | 'vocab_master';

export interface SessionResult {
  session: Session;
  newBadges: Achievement[];
}

export type SessionMode = 'freeform' | 'interview' | 'custom';

export const INTERVIEW_PROMPTS = [
  'Tell me about yourself.',
  'Describe a time you showed leadership.',
  "What's your greatest weakness?",
  'Why do you want this role?',
  'Where do you see yourself in 5 years?',
  'Tell me about a challenge you overcame.',
  'What are your greatest strengths?',
  'Describe a time you worked in a team.',
];

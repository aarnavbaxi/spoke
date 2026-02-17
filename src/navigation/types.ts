import { Session } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Recording: {
    mode: 'freeform' | 'interview' | 'custom';
    prompt?: string;
    durationSeconds: number;
  };
  Results: {
    session: Session;
    newBadges: Array<{
      badge_type: string;
      badge_name: string;
      badge_description: string;
    }>;
  };
  Paywall: {
    feature: string;
  };
};

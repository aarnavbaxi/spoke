export const Colors = {
  background: '#0D0D1A',
  surface: '#1A1A2E',
  surfaceLight: '#252545',
  primary: '#6C63FF',
  primaryLight: '#8B84FF',
  primaryDark: '#4A42CC',
  accent: '#FF6B35',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  text: '#FFFFFF',
  textSecondary: '#9999BB',
  textMuted: '#55556B',
  border: '#2A2A4A',
  streak: '#FF6B35',
  card: '#1E1E35',
};

export const BadgeConfig: Record<
  string,
  { emoji: string; color: string; gradient: [string, string] }
> = {
  first_session: { emoji: '🎯', color: '#4CAF50', gradient: ['#2E7D32', '#4CAF50'] },
  streak_3: { emoji: '🔥', color: '#FF6B35', gradient: ['#E64A19', '#FF6B35'] },
  streak_7: { emoji: '⚡', color: '#FFC107', gradient: ['#F57F17', '#FFC107'] },
  streak_30: { emoji: '🏆', color: '#FFD700', gradient: ['#F9A825', '#FFD700'] },
  streak_100: { emoji: '💎', color: '#00BCD4', gradient: ['#00838F', '#00BCD4'] },
  sessions_10: { emoji: '📊', color: '#9C27B0', gradient: ['#6A1B9A', '#9C27B0'] },
  sessions_50: { emoji: '🎖️', color: '#FF5722', gradient: ['#BF360C', '#FF5722'] },
  sessions_100: { emoji: '🦁', color: '#F44336', gradient: ['#B71C1C', '#F44336'] },
  filler_free: { emoji: '🤐', color: '#2196F3', gradient: ['#0D47A1', '#2196F3'] },
  speed_demon: { emoji: '💨', color: '#FFEB3B', gradient: ['#F57F17', '#FFEB3B'] },
  vocab_master: { emoji: '📚', color: '#00E676', gradient: ['#1B5E20', '#00E676'] },
};

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../lib/supabase';
import { Achievement, Session } from '../types';
import { Colors, BadgeConfig } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';

const SESSION_DURATIONS = [
  { label: '3 min', seconds: 180, free: true },
  { label: '5 min', seconds: 300, free: false },
  { label: '10 min', seconds: 600, free: false },
  { label: '15 min', seconds: 900, free: false },
];

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();
  const { isPremium } = usePremium();
  const [recentSession, setRecentSession] = useState<Session | null>(null);
  const [recentBadges, setRecentBadges] = useState<Achievement[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(180);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [sessionRes, badgeRes] = await Promise.all([
      supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
        .limit(3),
    ]);
    if (sessionRes.data) setRecentSession(sessionRes.data as Session);
    if (badgeRes.data) setRecentBadges(badgeRes.data as Achievement[]);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    refreshUser();
    fetchData();
  }

  function startSession(mode: 'freeform' | 'interview' | 'custom') {
    const durationToUse = isPremium ? selectedDuration : 180;
    navigation.navigate('Recording', {
      mode,
      durationSeconds: durationToUse,
    });
  }

  function handleInterviewMode() {
    if (!isPremium) {
      navigation.navigate('Paywall', { feature: 'Interview Mode' });
      return;
    }
    startSession('interview');
  }

  const streak = user?.current_streak ?? 0;
  const totalSessions = user?.total_sessions ?? 0;
  const badgeCount = recentBadges.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
            <Text style={styles.email}>{user?.email?.split('@')[0]}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{streak}</Text>
          </View>
        </View>

        {/* Streak Card */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakCardLeft}>
            <Text style={styles.streakDays}>{streak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
            {streak === 0 && (
              <Text style={styles.streakSub}>Practice today to start your streak!</Text>
            )}
            {streak > 0 && (
              <Text style={styles.streakSub}>
                Keep it up! Best: {user?.longest_streak ?? streak} days
              </Text>
            )}
          </View>
          <Text style={styles.streakEmoji}>{streak === 0 ? '🎯' : streak >= 7 ? '🏆' : '🔥'}</Text>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.longest_streak ?? 0}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{badgeCount}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Session Duration (Premium) */}
        {isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Length</Text>
            <View style={styles.durationRow}>
              {SESSION_DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.seconds}
                  style={[
                    styles.durationChip,
                    selectedDuration === d.seconds && styles.durationChipSelected,
                  ]}
                  onPress={() => setSelectedDuration(d.seconds)}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      selectedDuration === d.seconds && styles.durationChipTextSelected,
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Start Session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start a Session</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => startSession('freeform')}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="mic" size={22} color="#fff" />
              <Text style={styles.primaryButtonText}>Freeform Practice</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleInterviewMode}>
            <Ionicons name="briefcase-outline" size={20} color={isPremium ? Colors.text : Colors.textMuted} />
            <Text style={[styles.secondaryButtonText, !isPremium && styles.lockedText]}>
              Interview Mode
            </Text>
            {!isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Session */}
        {recentSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Session</Text>
            <View style={styles.recentCard}>
              <View style={styles.recentMetrics}>
                <MetricMini label="Filler Words" value={String(recentSession.filler_words_count)} />
                <MetricMini label="WPM" value={String(recentSession.speaking_pace)} />
                <MetricMini
                  label="Vocab"
                  value={`${Math.round(recentSession.vocab_diversity * 100)}%`}
                />
              </View>
              <Text style={styles.recentDate}>
                {new Date(recentSession.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricMini}>
      <Text style={styles.metricMiniValue}>{value}</Text>
      <Text style={styles.metricMiniLabel}>{label}</Text>
    </View>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { color: Colors.textSecondary, fontSize: 14 },
  email: { color: Colors.text, fontSize: 20, fontWeight: '700', marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  streakFire: { fontSize: 16 },
  streakCount: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  streakCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakCardLeft: {},
  streakDays: { fontSize: 48, fontWeight: '800', color: '#fff', lineHeight: 52 },
  streakLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  streakSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  streakEmoji: { fontSize: 56 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationChipText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  durationChipTextSelected: { color: '#fff', fontWeight: '700' },
  primaryButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: { color: Colors.text, fontSize: 17, fontWeight: '600', flex: 1 },
  lockedText: { color: Colors.textMuted },
  premiumBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  recentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentMetrics: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  recentDate: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  metricMini: { alignItems: 'center' },
  metricMiniValue: { fontSize: 22, fontWeight: '700', color: Colors.text },
  metricMiniLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});

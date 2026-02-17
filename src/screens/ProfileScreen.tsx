import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
import { Achievement } from '../types';
import { Colors, BadgeConfig } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';

import { BadgeType } from '../types';

const ALL_BADGES: { type: BadgeType; name: string; desc: string }[] = [
  { type: 'first_session', name: 'First Step', desc: 'Complete your first session' },
  { type: 'streak_3', name: 'Getting Started', desc: '3-day streak' },
  { type: 'streak_7', name: 'One Week Strong', desc: '7-day streak' },
  { type: 'streak_30', name: 'Monthly Master', desc: '30-day streak' },
  { type: 'streak_100', name: 'Century Club', desc: '100-day streak' },
  { type: 'sessions_10', name: 'Ten Sessions', desc: 'Complete 10 sessions' },
  { type: 'sessions_50', name: 'Half Century', desc: 'Complete 50 sessions' },
  { type: 'sessions_100', name: 'Centurion', desc: 'Complete 100 sessions' },
  { type: 'filler_free', name: 'Filler-Free', desc: 'Session with 0 filler words' },
  { type: 'speed_demon', name: 'Speed Demon', desc: '180+ WPM speaking pace' },
  { type: 'vocab_master', name: 'Vocab Master', desc: '0.9+ vocab diversity score' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut, refreshUser } = useAuth();
  const { isPremium } = usePremium();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id);
    if (data) setAchievements(data as Achievement[]);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  function onRefresh() {
    setRefreshing(true);
    refreshUser();
    fetchAchievements();
  }

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  const earnedTypes = new Set(achievements.map((a) => a.badge_type));
  const earnedCount = earnedTypes.size;

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
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Card */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userCard}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.email?.split('@')[0]}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.memberSince}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.memberSinceText}>
                Member since{' '}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subLeft}>
              <View
                style={[
                  styles.subBadge,
                  { backgroundColor: isPremium ? Colors.success : Colors.surface },
                ]}
              >
                <Text style={styles.subBadgeText}>{isPremium ? 'PRO' : 'FREE'}</Text>
              </View>
              <View>
                <Text style={styles.subTitle}>{isPremium ? 'Spoke Pro' : 'Free Plan'}</Text>
                <Text style={styles.subSubtitle}>
                  {isPremium ? 'All features unlocked' : 'Basic features'}
                </Text>
              </View>
            </View>
            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Paywall', { feature: 'Spoke Pro' })}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isPremium && (
            <View style={styles.premiumFeatures}>
              {['Flexible session length', 'Interview mode', 'AI-generated prompts', 'Advanced metrics'].map(
                (feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Ionicons name="lock-closed-outline" size={14} color={Colors.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                )
              )}
              <TouchableOpacity
                style={styles.upgradeFullButton}
                onPress={() => navigation.navigate('Paywall', { feature: 'Spoke Pro' })}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.upgradeFullGradient}
                >
                  <Text style={styles.upgradeFullText}>Unlock Pro — $3.99/mo</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Sessions" value={String(user?.total_sessions ?? 0)} icon="mic-outline" />
            <StatCard label="Current Streak" value={`${user?.current_streak ?? 0} 🔥`} icon="flame-outline" />
            <StatCard label="Best Streak" value={String(user?.longest_streak ?? 0)} icon="trophy-outline" />
            <StatCard label="Badges Earned" value={`${earnedCount}/${ALL_BADGES.length}`} icon="ribbon-outline" />
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Badges ({earnedCount}/{ALL_BADGES.length})
          </Text>
          <View style={styles.badgeGrid}>
            {ALL_BADGES.map((badge) => {
              const earned = earnedTypes.has(badge.type);
              const config = BadgeConfig[badge.type] ?? {
                emoji: '🏅',
                gradient: [Colors.primary, Colors.primaryDark] as [string, string],
                color: Colors.primary,
              };
              return (
                <View key={badge.type} style={[styles.badgeItem, !earned && styles.badgeLocked]}>
                  {earned ? (
                    <LinearGradient colors={config.gradient} style={styles.badgeCircle}>
                      <Text style={styles.badgeEmoji}>{config.emoji}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.badgeCircle, styles.badgeCircleLocked]}>
                      <Text style={styles.badgeEmoji}>{config.emoji}</Text>
                    </View>
                  )}
                  <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
                    {badge.name}
                  </Text>
                  <Text style={styles.badgeDesc} numberOfLines={2}>
                    {badge.desc}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsRow} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={[styles.settingsRowText, { color: Colors.error }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  userCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  memberSince: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  memberSinceText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  subscriptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
  },
  subBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  subTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  subSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  upgradeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  upgradeButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  premiumFeatures: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { color: Colors.textSecondary, fontSize: 14 },
  upgradeFullButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  upgradeFullGradient: { padding: 14, alignItems: 'center' },
  upgradeFullText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeItem: { width: '30%', alignItems: 'center', padding: 8 },
  badgeLocked: { opacity: 0.4 },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeCircleLocked: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  badgeEmoji: { fontSize: 24 },
  badgeName: { color: Colors.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  badgeNameLocked: { color: Colors.textMuted },
  badgeDesc: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingsRowText: { flex: 1, fontSize: 16, fontWeight: '500' },
});

const statStyles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: { fontSize: 22, fontWeight: '800', color: Colors.text },
  label: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});

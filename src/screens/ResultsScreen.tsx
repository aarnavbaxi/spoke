import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPaceLabel } from '../lib/metrics';
import { Colors, BadgeConfig } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

export default function ResultsScreen({ navigation, route }: Props) {
  const { session, newBadges } = route.params;
  const { refreshUser } = useAuth();
  const [showBadgeModal, setShowBadgeModal] = React.useState(newBadges.length > 0);
  const [currentBadgeIndex, setCurrentBadgeIndex] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    refreshUser();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const paceInfo = getPaceLabel(session.speaking_pace);
  const vocabPercent = Math.round(session.vocab_diversity * 100);

  function nextBadge() {
    if (currentBadgeIndex < newBadges.length - 1) {
      setCurrentBadgeIndex((i) => i + 1);
    } else {
      setShowBadgeModal(false);
    }
  }

  const currentBadge = newBadges[currentBadgeIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Badge Modal */}
      <Modal visible={showBadgeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {currentBadge && (() => {
              const config = BadgeConfig[currentBadge.badge_type] ?? {
                emoji: '🏅',
                gradient: [Colors.primary, Colors.primaryDark] as [string, string],
              };
              return (
                <>
                  <LinearGradient
                    colors={config.gradient}
                    style={styles.modalBadgeCircle}
                  >
                    <Text style={styles.modalBadgeEmoji}>{config.emoji}</Text>
                  </LinearGradient>
                  <Text style={styles.modalBadgeTitle}>Badge Unlocked!</Text>
                  <Text style={styles.modalBadgeName}>{currentBadge.badge_name}</Text>
                  <Text style={styles.modalBadgeDesc}>{currentBadge.badge_description}</Text>
                  <TouchableOpacity style={styles.modalButton} onPress={nextBadge}>
                    <Text style={styles.modalButtonText}>
                      {currentBadgeIndex < newBadges.length - 1 ? 'Next Badge' : 'View Results'}
                    </Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
              <Ionicons name="close" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Session Results</Text>
            <View style={{ width: 28 }} />
          </View>
          <Text style={styles.sessionDate}>
            {new Date(session.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.sessionDuration}>
            {Math.floor(session.duration / 60)}:{String(session.duration % 60).padStart(2, '0')}{' '}
            minutes •{' '}
            {session.session_mode.charAt(0).toUpperCase() + session.session_mode.slice(1)}
          </Text>
        </Animated.View>

        {/* Metrics Cards */}
        <Animated.View
          style={[
            styles.metricsGrid,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <MetricCard
            title="Filler Words"
            value={String(session.filler_words_count)}
            subtitle={session.filler_words_count === 0 ? 'Perfect!' : 'detected'}
            color={
              session.filler_words_count === 0
                ? Colors.success
                : session.filler_words_count > 10
                ? Colors.error
                : Colors.warning
            }
            icon="chatbubble-ellipses-outline"
          />
          <MetricCard
            title="Speaking Pace"
            value={String(session.speaking_pace)}
            subtitle={paceInfo.label + ' WPM'}
            color={paceInfo.color}
            icon="speedometer-outline"
          />
          <MetricCard
            title="Vocab Diversity"
            value={`${vocabPercent}%`}
            subtitle={vocabPercent >= 70 ? 'Excellent' : vocabPercent >= 50 ? 'Good' : 'Needs work'}
            color={vocabPercent >= 70 ? Colors.success : vocabPercent >= 50 ? Colors.warning : Colors.error}
            icon="library-outline"
          />
        </Animated.View>

        {/* New Badges */}
        {newBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges Earned</Text>
            <View style={styles.badgesRow}>
              {newBadges.map((badge) => {
                const config = BadgeConfig[badge.badge_type] ?? { emoji: '🏅', gradient: [Colors.primary, Colors.primaryDark] as [string, string] };
                return (
                  <LinearGradient
                    key={badge.badge_type}
                    colors={config.gradient}
                    style={styles.badgeChip}
                  >
                    <Text style={styles.badgeChipEmoji}>{config.emoji}</Text>
                    <Text style={styles.badgeChipName}>{badge.badge_name}</Text>
                  </LinearGradient>
                );
              })}
            </View>
          </View>
        )}

        {/* AI Feedback */}
        {session.ai_feedback && (
          <View style={styles.section}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>AI Feedback</Text>
            </View>
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackText}>{session.ai_feedback}</Text>
            </View>
          </View>
        )}

        {/* Transcript */}
        {session.transcript && !session.transcript.startsWith('[Add your') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transcript</Text>
            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptText}>{session.transcript}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.actionGradient}>
              <Ionicons name="home-outline" size={20} color="#fff" />
              <Text style={styles.primaryActionText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() =>
              navigation.replace('Recording', {
                mode: session.session_mode,
                prompt: session.prompt_used ?? undefined,
                durationSeconds: session.duration,
              })
            }
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.text} />
            <Text style={styles.secondaryActionText}>Practice Again</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={[metricStyles.card, { borderTopColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={metricStyles.value}>{value}</Text>
      <Text style={metricStyles.title}>{title}</Text>
      <Text style={[metricStyles.subtitle, { color }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sessionDate: { fontSize: 22, fontWeight: '700', color: Colors.text },
  sessionDuration: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  feedbackCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedbackText: { color: Colors.text, fontSize: 15, lineHeight: 24 },
  transcriptCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  transcriptText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeChipEmoji: { fontSize: 16 },
  badgeChipName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  actions: { marginHorizontal: 20, marginTop: 24, gap: 12 },
  primaryAction: { borderRadius: 16, overflow: 'hidden' },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  primaryActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryAction: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBadgeCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBadgeEmoji: { fontSize: 44 },
  modalBadgeTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalBadgeName: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalBadgeDesc: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: { fontSize: 28, fontWeight: '800', color: Colors.text, marginTop: 4 },
  title: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  subtitle: { fontSize: 12, fontWeight: '600' },
});

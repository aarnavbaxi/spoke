import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Session } from '../types';
import { Colors } from '../theme/colors';
import { getPaceLabel } from '../lib/metrics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 140;
const PADDING = { top: 16, bottom: 24, left: 32, right: 16 };

type MetricKey = 'speaking_pace' | 'filler_words_count' | 'vocab_diversity';

export default function ProgressScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('speaking_pace');

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(30);

    if (data) setSessions(data as Session[]);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function onRefresh() {
    setRefreshing(true);
    fetchSessions();
  }

  const metrics: { key: MetricKey; label: string; color: string; format: (v: number) => string }[] =
    [
      {
        key: 'speaking_pace',
        label: 'Pace (WPM)',
        color: Colors.primary,
        format: (v) => `${Math.round(v)} wpm`,
      },
      {
        key: 'filler_words_count',
        label: 'Filler Words',
        color: Colors.accent,
        format: (v) => `${Math.round(v)}`,
      },
      {
        key: 'vocab_diversity',
        label: 'Vocab Diversity',
        color: Colors.success,
        format: (v) => `${Math.round(v * 100)}%`,
      },
    ];

  const activeMetricConfig = metrics.find((m) => m.key === activeMetric)!;
  const chartData = sessions.map((s) => s[activeMetric] as number);

  // Compute averages
  const avgPace =
    sessions.length > 0
      ? Math.round(sessions.reduce((a, b) => a + b.speaking_pace, 0) / sessions.length)
      : 0;
  const avgFiller =
    sessions.length > 0
      ? Math.round(sessions.reduce((a, b) => a + b.filler_words_count, 0) / sessions.length)
      : 0;
  const avgVocab =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((a, b) => a + b.vocab_diversity, 0) / sessions.length) * 100
        )
      : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} tracked
          </Text>
        </View>

        {/* Average Metrics */}
        <View style={styles.avgRow}>
          <AvgCard label="Avg Pace" value={avgPace > 0 ? `${avgPace}` : '—'} unit="WPM" color={Colors.primary} />
          <AvgCard label="Avg Fillers" value={avgFiller > 0 ? `${avgFiller}` : '—'} unit="per session" color={Colors.accent} />
          <AvgCard label="Avg Vocab" value={avgVocab > 0 ? `${avgVocab}%` : '—'} unit="diversity" color={Colors.success} />
        </View>

        {/* Chart */}
        {sessions.length >= 2 ? (
          <View style={styles.chartSection}>
            {/* Metric Selector */}
            <View style={styles.metricTabs}>
              {metrics.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.metricTab,
                    activeMetric === m.key && { borderBottomColor: m.color, borderBottomWidth: 2 },
                  ]}
                  onPress={() => setActiveMetric(m.key)}
                >
                  <Text
                    style={[
                      styles.metricTabText,
                      activeMetric === m.key && { color: m.color, fontWeight: '700' },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                color={activeMetricConfig.color}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                format={activeMetricConfig.format}
              />
            </View>
          </View>
        ) : (
          sessions.length < 2 && (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>
                Complete {2 - sessions.length} more session{sessions.length === 0 ? 's' : ''} to
                see your progress chart
              </Text>
            </View>
          )
        )}

        {/* Session History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session History</Text>
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🎙️</Text>
              <Text style={styles.emptyStateText}>No sessions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start your first session to track your progress
              </Text>
            </View>
          ) : (
            [...sessions]
              .reverse()
              .map((session) => <SessionRow key={session.id} session={session} />)
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LineChart({
  data,
  color,
  width,
  height,
  format,
}: {
  data: number[];
  color: string;
  width: number;
  height: number;
  format: (v: number) => string;
}) {
  if (data.length < 2) return null;

  const innerWidth = width - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((val, i) => ({
    x: PADDING.left + (i / (data.length - 1)) * innerWidth,
    y: PADDING.top + ((maxVal - val) / range) * innerHeight,
    val,
  }));

  // Build SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <Svg width={width} height={height}>
      {/* Y-axis labels */}
      <SvgText x={0} y={PADDING.top} fill={Colors.textMuted} fontSize={10} textAnchor="start">
        {format(maxVal)}
      </SvgText>
      <SvgText
        x={0}
        y={PADDING.top + innerHeight}
        fill={Colors.textMuted}
        fontSize={10}
        textAnchor="start"
      >
        {format(minVal)}
      </SvgText>

      {/* Grid line */}
      <Line
        x1={PADDING.left}
        y1={PADDING.top + innerHeight / 2}
        x2={PADDING.left + innerWidth}
        y2={PADDING.top + innerHeight / 2}
        stroke={Colors.border}
        strokeDasharray="4,4"
        strokeWidth={1}
      />

      {/* Line */}
      <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={4} fill={color} />
          <Circle cx={p.x} cy={p.y} r={6} fill={color} opacity={0.2} />
        </G>
      ))}

      {/* First and last labels */}
      {[0, points.length - 1].map((idx) => (
        <SvgText
          key={idx}
          x={points[idx].x}
          y={height - 2}
          fill={Colors.textSecondary}
          fontSize={10}
          textAnchor="middle"
        >
          #{idx === 0 ? 1 : data.length}
        </SvgText>
      ))}
    </Svg>
  );
}

function AvgCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={avgStyles.card}>
      <Text style={[avgStyles.value, { color }]}>{value}</Text>
      <Text style={avgStyles.label}>{label}</Text>
      <Text style={avgStyles.unit}>{unit}</Text>
    </View>
  );
}

function SessionRow({ session }: { session: Session }) {
  const paceInfo = getPaceLabel(session.speaking_pace);
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.left}>
        <Text style={rowStyles.date}>
          {new Date(session.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={rowStyles.mode}>{session.session_mode}</Text>
      </View>
      <View style={rowStyles.right}>
        <View style={rowStyles.metric}>
          <Text style={rowStyles.metricValue}>{session.speaking_pace}</Text>
          <Text style={[rowStyles.metricLabel, { color: paceInfo.color }]}>wpm</Text>
        </View>
        <View style={rowStyles.metric}>
          <Text style={rowStyles.metricValue}>{session.filler_words_count}</Text>
          <Text style={rowStyles.metricLabel}>fillers</Text>
        </View>
        <View style={rowStyles.metric}>
          <Text style={rowStyles.metricValue}>{Math.round(session.vocab_diversity * 100)}%</Text>
          <Text style={rowStyles.metricLabel}>vocab</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  avgRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 12 },
  chartSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricTabs: { flexDirection: 'row', gap: 0, marginBottom: 16 },
  metricTab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metricTabText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  chartContainer: { overflow: 'hidden' },
  emptyChart: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyChartText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyStateEmoji: { fontSize: 40, marginBottom: 12 },
  emptyStateText: { color: Colors.text, fontSize: 18, fontWeight: '600' },
  emptyStateSubtext: { color: Colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
});

const avgStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: { fontSize: 22, fontWeight: '800' },
  label: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  unit: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  left: { flex: 1 },
  date: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  mode: { color: Colors.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  right: { flexDirection: 'row', gap: 16 },
  metric: { alignItems: 'center' },
  metricValue: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  metricLabel: { color: Colors.textSecondary, fontSize: 10, marginTop: 1 },
});

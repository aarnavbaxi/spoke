import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../lib/supabase';
import { transcribeAndAnalyze, generateSpeakingPrompt } from '../lib/ai';
import { countFillerWords, calculateSpeakingPace, calculateVocabDiversity } from '../lib/metrics';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import { INTERVIEW_PROMPTS } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Recording'>;
  route: RouteProp<RootStackParamList, 'Recording'>;
};

type RecordingState = 'idle' | 'countdown' | 'recording' | 'processing';

export default function RecordingScreen({ navigation, route }: Props) {
  const { mode, durationSeconds } = route.params;
  const { user } = useAuth();
  const { isPremium } = usePremium();

  const [state, setState] = useState<RecordingState>('idle');
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [prompt, setPrompt] = useState(route.params.prompt ?? '');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Analyzing your speech...');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Load interview prompt or generate prompt
  useEffect(() => {
    if (mode === 'interview' && !prompt) {
      const randomPrompt = INTERVIEW_PROMPTS[Math.floor(Math.random() * INTERVIEW_PROMPTS.length)];
      setPrompt(randomPrompt);
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  function clearTimers() {
    if (timerRef.current) clearInterval(timerRef.current);
    pulseLoop.current?.stop();
  }

  function startPulse() {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }

  async function handleGeneratePrompt() {
    setLoadingPrompt(true);
    try {
      const generated = await generateSpeakingPrompt();
      setPrompt(generated);
    } catch {
      Alert.alert('Error', 'Could not generate a prompt. Please try again.');
    } finally {
      setLoadingPrompt(false);
    }
  }

  async function startCountdown() {
    setState('countdown');
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        beginRecording();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }

  async function beginRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please allow microphone access in Settings to use Spoke.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      setState('recording');
      startPulse();

      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setElapsed(seconds);
        setTimeLeft(durationSeconds - seconds);

        if (seconds >= durationSeconds) {
          clearInterval(timerRef.current!);
          stopRecording(true);
        }
      }, 1000);
    } catch (error) {
      Alert.alert('Recording error', 'Could not start recording. Please try again.');
      navigation.goBack();
    }
  }

  async function stopRecording(autoStopped = false) {
    clearTimers();
    const recording = recordingRef.current;
    if (!recording) return;

    const actualElapsed = elapsed > 0 ? elapsed : 1;

    if (actualElapsed < 5 && !autoStopped) {
      Alert.alert('Too short', 'Please record for at least 5 seconds.', [
        { text: 'Continue recording', style: 'cancel', onPress: () => resumeAfterShort() },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    setState('processing');

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (!uri) throw new Error('No audio file found');

      setProcessingStatus('Transcribing with AI...');
      const { transcript, feedback } = await transcribeAndAnalyze(
        uri,
        actualElapsed,
        mode,
        prompt
      );

      setProcessingStatus('Calculating metrics...');
      const fillerCount = countFillerWords(transcript);
      const pace = calculateSpeakingPace(transcript, actualElapsed);
      const vocabDiversity = calculateVocabDiversity(transcript);

      setProcessingStatus('Saving session...');
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user!.id,
          transcript,
          duration: actualElapsed,
          filler_words_count: fillerCount,
          speaking_pace: pace,
          vocab_diversity: vocabDiversity,
          ai_feedback: feedback,
          session_mode: mode,
          prompt_used: prompt || null,
        })
        .select()
        .single();

      if (error) throw error;

      setProcessingStatus('Checking for new badges...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: newBadgesData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user!.id)
        .order('unlocked_at', { ascending: false })
        .limit(5);

      // Find badges earned in last 10 seconds
      const justEarned = (newBadgesData ?? []).filter((b) => {
        const earnedAt = new Date(b.unlocked_at).getTime();
        return Date.now() - earnedAt < 10000;
      });

      navigation.replace('Results', {
        session: sessionData,
        newBadges: justEarned,
      });
    } catch (error: any) {
      setState('recording');
      Alert.alert('Processing failed', error.message ?? 'Could not process your recording.');
    }
  }

  function resumeAfterShort() {
    setState('recording');
    startPulse();
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        setTimeLeft(durationSeconds - next);
        if (next >= durationSeconds) {
          clearInterval(timerRef.current!);
          stopRecording(true);
        }
        return next;
      });
    }, 1000);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = elapsed / durationSeconds;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (state === 'recording') {
              Alert.alert('Stop session?', 'Your recording will be lost.', [
                { text: 'Keep recording', style: 'cancel' },
                { text: 'Stop', style: 'destructive', onPress: () => navigation.goBack() },
              ]);
            } else if (state !== 'processing') {
              navigation.goBack();
            }
          }}
          disabled={state === 'processing'}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.modeLabel}>
          {mode === 'freeform' ? 'Freeform' : mode === 'interview' ? 'Interview' : 'Custom'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Prompt */}
      {prompt ? (
        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>Your prompt</Text>
          <Text style={styles.promptText}>{prompt}</Text>
        </View>
      ) : (
        isPremium && mode === 'freeform' && (
          <TouchableOpacity
            style={styles.generatePromptButton}
            onPress={handleGeneratePrompt}
            disabled={loadingPrompt || state !== 'idle'}
          >
            {loadingPrompt ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
            )}
            <Text style={styles.generatePromptText}>Generate a prompt</Text>
          </TouchableOpacity>
        )
      )}

      {/* Timer Circle */}
      <View style={styles.timerContainer}>
        {state === 'countdown' ? (
          <View style={styles.timerCircle}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Get ready...</Text>
          </View>
        ) : state === 'processing' ? (
          <View style={styles.timerCircle}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingText}>{processingStatus}</Text>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.timerCircle,
              state === 'recording' && {
                transform: [{ scale: pulseAnim }],
                borderColor: Colors.accent,
                borderWidth: 3,
              },
            ]}
          >
            <Text style={styles.timerText}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
            <Text style={styles.timerSub}>
              {state === 'recording' ? 'Recording...' : 'Ready'}
            </Text>
            {state === 'recording' && (
              <View style={styles.recordingDot} />
            )}
          </Animated.View>
        )}
      </View>

      {/* Progress Bar */}
      {state === 'recording' && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {state === 'idle' && (
          <TouchableOpacity style={styles.startButton} onPress={startCountdown}>
            <Ionicons name="mic" size={32} color="#fff" />
            <Text style={styles.startButtonText}>Start Recording</Text>
          </TouchableOpacity>
        )}

        {state === 'recording' && (
          <TouchableOpacity style={styles.stopButton} onPress={() => stopRecording(false)}>
            <View style={styles.stopIcon} />
            <Text style={styles.stopButtonText}>Stop & Analyze</Text>
          </TouchableOpacity>
        )}

        {state === 'processing' && (
          <View style={styles.processingHint}>
            <Text style={styles.processingHintText}>Please wait while we analyze your session</Text>
          </View>
        )}
      </View>

      {/* Tips */}
      {state === 'idle' && (
        <View style={styles.tips}>
          <Text style={styles.tipText}>Speak clearly and at a natural pace</Text>
          <Text style={styles.tipText}>Find a quiet environment for best results</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modeLabel: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  promptCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  promptLabel: { color: Colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  promptText: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  generatePromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  generatePromptText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 4,
  },
  timerText: { fontSize: 52, fontWeight: '800', color: Colors.text, fontVariant: ['tabular-nums'] },
  timerSub: { fontSize: 14, color: Colors.textSecondary },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginTop: 4,
  },
  countdownNumber: { fontSize: 80, fontWeight: '800', color: Colors.primary },
  countdownLabel: { fontSize: 16, color: Colors.textSecondary },
  processingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    marginHorizontal: 40,
    marginBottom: 16,
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  controls: { paddingHorizontal: 40, paddingBottom: 32, alignItems: 'center' },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  stopButton: {
    backgroundColor: Colors.error,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  stopButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  processingHint: { alignItems: 'center' },
  processingHintText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  tips: { paddingHorizontal: 24, paddingBottom: 24, gap: 6, alignItems: 'center' },
  tipText: { color: Colors.textMuted, fontSize: 13 },
});

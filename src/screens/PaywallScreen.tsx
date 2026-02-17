import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
  route: RouteProp<RootStackParamList, 'Paywall'>;
};

const PRO_FEATURES = [
  {
    icon: 'timer-outline' as const,
    title: 'Flexible Session Length',
    desc: 'Practice for 3, 5, 10, 15 min or custom',
  },
  {
    icon: 'briefcase-outline' as const,
    title: 'Interview Mode',
    desc: 'Real interview questions to prepare with',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'AI-Generated Prompts',
    desc: 'Never run out of things to practice',
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Advanced Metrics',
    desc: 'Sentence complexity, pause analysis, confidence score',
  },
];

export default function PaywallScreen({ navigation, route }: Props) {
  const { feature } = route.params;

  function handleSubscribe(plan: 'monthly' | 'annual') {
    // TODO: Wire up to RevenueCat
    // Purchases.purchasePackage(package)
    alert(`RevenueCat integration coming soon. Selected: ${plan}`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color={Colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.iconCircle}
        >
          <Text style={styles.iconEmoji}>🎯</Text>
        </LinearGradient>

        <Text style={styles.headline}>Unlock {feature}</Text>
        <Text style={styles.subheadline}>
          Upgrade to Spoke Pro and take your speaking to the next level
        </Text>

        <View style={styles.featureList}>
          {PRO_FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color={Colors.primary} />
              </View>
              <View style={styles.featureTextBlock}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricingSection}>
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => handleSubscribe('annual')}
          >
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.planGradient}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>BEST VALUE</Text>
              </View>
              <Text style={styles.planPrice}>$29.99</Text>
              <Text style={styles.planPeriod}>per year</Text>
              <Text style={styles.planSavings}>Save 37% · ~$2.50/month</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.planCardSecondary}
            onPress={() => handleSubscribe('monthly')}
          >
            <Text style={styles.planPriceSecondary}>$3.99</Text>
            <Text style={styles.planPeriodSecondary}>per month</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Cancel anytime. Billed through the App Store. By subscribing you agree to our Terms of
          Service.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  closeButton: { position: 'absolute', top: 56, right: 20, zIndex: 10 },
  content: { alignItems: 'center', padding: 24, paddingTop: 60 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconEmoji: { fontSize: 36 },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  featureList: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureTextBlock: { flex: 1 },
  featureTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  featureDesc: { color: Colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
  pricingSection: { width: '100%', gap: 12, marginBottom: 20 },
  planCard: { borderRadius: 18, overflow: 'hidden' },
  planGradient: { padding: 24, alignItems: 'center', position: 'relative' },
  planBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  planPrice: { fontSize: 40, fontWeight: '800', color: '#fff' },
  planPeriod: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  planSavings: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  planCardSecondary: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planPriceSecondary: { fontSize: 28, fontWeight: '800', color: Colors.text },
  planPeriodSecondary: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});

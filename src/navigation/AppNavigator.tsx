import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { PremiumProvider } from '../context/PremiumContext';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import RecordingScreen from '../screens/RecordingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PaywallScreen from '../screens/PaywallScreen';

import { Colors } from '../theme/colors';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Progress') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <MainTab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
      <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </MainTab.Navigator>
  );
}

function MainStackNavigator() {
  // showPaywall is a no-op here; screens navigate directly to 'Paywall'
  function showPaywall(_feature: string, _onUpgrade?: () => void) {}

  return (
    <PremiumProvider onShowPaywall={showPaywall}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen
          name="Recording"
          component={RecordingScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <RootStack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
        <RootStack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          initialParams={{ feature: '' }}
        />
      </RootStack.Navigator>
    </PremiumProvider>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <LinearGradient colors={['#0D0D1A', '#1A1A2E']} style={loadingStyles.container}>
      <Text style={loadingStyles.logo}>Spoke</Text>
      <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 24 }} />
    </LinearGradient>
  );
}

export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {session ? <MainStackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const loadingStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 48, fontWeight: '800', color: Colors.primary, letterSpacing: -1 },
});

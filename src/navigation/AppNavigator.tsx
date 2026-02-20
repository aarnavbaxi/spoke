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
import { View, Image, Animated, Easing, StyleSheet } from 'react-native';

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
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} options={{ gestureEnabled: false }} />
    </AuthStack.Navigator>
  )
}

function LoadingScreen() {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={loadingStyles.container}>
      <Image
        source={require('../../assets/word_logo.png')}
        style={loadingStyles.logo}
        resizeMode="contain"
      />
      <View style={loadingStyles.barTrack}>
        <Animated.View style={[loadingStyles.barFill, { width: barWidth }]} />
      </View>
    </View>
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
  container: {
    flex: 1,
    backgroundColor: '#86D3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 480,
    height: 260,
  },
  barTrack: {
    position: 'absolute',
    bottom: 60,
    width: '70%',
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#649DFE',
    borderRadius: 4,
  },
});

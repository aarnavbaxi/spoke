import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Asset } from 'expo-asset';
import {
  Fredoka_400Regular,
  Fredoka_600SemiBold,
} from '@expo-google-fonts/fredoka';
import {
  InclusiveSans_400Regular,
} from '@expo-google-fonts/inclusive-sans';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_600SemiBold,
    InclusiveSans_400Regular,
  });
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    Asset.loadAsync([
      require('./assets/spoke_parrot.png'),
      require('./assets/google_logo.png'),
      require('./assets/word_logo.png'),
    ]).then(() => setAssetsLoaded(true));
  }, []);

  if (!fontsLoaded || !assetsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

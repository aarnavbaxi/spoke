import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

export default function SignupScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Google sign-up failed', error.message ?? 'An error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSignup() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Terms & Conditions', 'Please agree to the Terms & Conditions to continue.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please verify your email to continue.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Sign up failed', error.message ?? 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Image
        source={require('../../../assets/spoke_parrot.png')}
        style={styles.parrot}
        resizeMode="contain"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome!</Text>

          {/* First + Last Name */}
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="First"
                placeholderTextColor="#AAAAAA"
                value={firstName}
                onChangeText={setFirstName}
                autoCorrect={false}
              />
            </View>
            <View style={styles.nameField}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Last"
                placeholderTextColor="#AAAAAA"
                value={lastName}
                onChangeText={setLastName}
                autoCorrect={false}
              />
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="you@example.com"
            placeholderTextColor="#AAAAAA"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="Must be at least 6 characters"
            placeholderTextColor="#AAAAAA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="••••••••"
            placeholderTextColor="#AAAAAA"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I have read the{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text>
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignup}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#555555" />
            ) : (
              <>
                <Image
                  source={require('../../../assets/google_logo.png')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
                <Text style={styles.googleText}>Sign up with Google</Text>
              </>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>

      {/* Sign In Link — outside KAV so it stays fixed at the bottom */}
      <TouchableOpacity
        style={styles.signinRow}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.7}
      >
        <Text style={styles.signinText}>
          Already have an account?{' '}
          <Text style={styles.signinAccent}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  parrot: {
    position: 'absolute',
    bottom: -45,
    left: -40,
    width: 120,
    height: 120,
    transform: [{ rotate: '40deg' }],
    zIndex: 10,
  },
  kav: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 40,
    lineHeight: 46,
    color: '#86D2FF',
    textAlign: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 60,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  nameField: {
    flex: 1,
  },
  label: {
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 14,
    color: '#555555',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 15,
    color: '#333333',
    backgroundColor: '#F9F9F9',
  },
  inputFull: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 15,
    color: '#333333',
    backgroundColor: '#F9F9F9',
    marginBottom: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#86D2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#86D2FF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 13,
    color: '#555555',
    flexShrink: 1,
  },
  termsLink: {
    color: '#86D2FF',
    fontWeight: '600',
  },
  button: {
    width: '100%',
    backgroundColor: '#86D2FF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 13,
    color: '#AAAAAA',
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    gap: 12,
    marginBottom: 16,
  },
  googleLogo: {
    width: 22,
    height: 22,
  },
  googleText: {
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 15,
    color: '#333333',
  },
  signinRow: {
    position: 'absolute',
    bottom: 52,
    alignSelf: 'center',
  },
  signinText: {
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 14,
    color: '#777777',
  },
  signinAccent: {
    fontFamily: 'InclusiveSans_400Regular',
    color: '#86D2FF',
    fontWeight: '600',
  },
});

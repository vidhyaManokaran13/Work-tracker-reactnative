import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from "react-native-svg";

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
      navigation.replace('AppDrawer');
    } catch (err) {
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        default:
          setError('Sign-in failed. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo with SVG gradient clock */}
      <View style={styles.logo}>
       <Svg width="40" height="40" viewBox="0 0 70 70" fill="none">
        <Rect width="70" height="70" rx="20" fill="url(#gradHistory)" />
        <Path
          d="M35 20a14 14 0 100 28 14 14 0 000-28zm1 7v6l4 3"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Defs>
          <LinearGradient id="gradHistory" x1="0" y1="0" x2="70" y2="70">
            <Stop stopColor="#2563eb" />
            <Stop offset="1" stopColor="#007BFF" />
          </LinearGradient>
        </Defs>
        </Svg>
      </View>

      {/* Title + Subtitle */}
      <View style={styles.logoContainer}>
        <Text style={styles.title}>Work Tracker</Text>
        <Text style={styles.subtitle}>Track your work hours efficiently</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In</Text>
        <Text style={styles.cardSubtitle}>Enter your credentials to access your account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ padding: 8 }}
          >
            <FontAwesomeIcon icon={faEye} size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Don’t have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.replace('SignUp')}>
            Sign up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: { marginBottom: 10 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4, textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, color: '#374151', marginBottom: 4, alignSelf: 'flex-start' },
  input: { width: '100%', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 12 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    width: '100%',
  },
  passwordInput: { flex: 1, paddingVertical: 10 },
  button: { width: '100%', backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerText: { marginTop: 16, fontSize: 14, textAlign: 'center', color: '#374151' },
  link: { color: '#2563eb', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 8, fontSize: 13, textAlign: 'center' },
});

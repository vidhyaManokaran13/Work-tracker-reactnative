import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faEye } from '@fortawesome/free-solid-svg-icons';
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from "react-native-svg";
export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await setDoc(doc(db, "users", user.uid), {
          fullName,
          email,
          createdAt: new Date(),
        });

      Alert.alert("Success ✅", "Your account was created successfully!", [
  { text: "OK", onPress: () => navigation.replace('AppDrawer') },
]);

      } catch (firestoreError) {
        console.log("Firestore error:", firestoreError);
        setError("Account created but failed to save details in Firestore.");
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
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

        <Text style={styles.title}>Work Tracker</Text>
        <Text style={styles.subtitle}>Create your account to get started</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Account</Text>
        <Text style={styles.cardSubtitle}>Fill in your details to create a new account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
        />

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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesomeIcon icon={faEye} size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.replace('SignIn')}>
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E7EEFA', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: {     flexDirection: "row",
    alignItems: "center",
 },
  logoText: { fontSize: 20, color: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 10, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3, alignItems: 'center' },
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
    marginBottom: 12 
  },
  passwordInput: { flex: 1, paddingVertical: 10 },
  button: { width: '100%', backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerText: { marginTop: 16, fontSize: 14, textAlign: 'center', color: '#374151' },
  link: { color: '#2563eb', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 8, fontSize: 13, textAlign: 'center' },
});

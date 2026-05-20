import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginStyles as styles } from '../styles/loginStyles';
import config from '../config';

export default function LoginScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }

    if (!validateEmail(loginEmail)) {
      Alert.alert('שגיאה', 'כתובת המייל אינה תקינה');
      return;
    }

    try {
      const response = await fetch(`${config.SERVER_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        // שמור Token ו-Manager ID
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('managerId', data.manager.id.toString());
        
        Alert.alert('הצלחה', `שלום ${data.manager.firstName}`);
        router.replace('/(tabs)/schedule');
      } else {
        Alert.alert('שגיאה', data.message);
      }
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להתחבר לשרת');
      console.log(error);
    }
  };

  // =========================
  // REGISTER
  // =========================
  const handleRegister = async () => {
    if (!firstName || !lastName || !phone || !registerEmail || !registerPassword || !confirmPassword) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }

    if (!validateEmail(registerEmail)) {
      Alert.alert('שגיאה', 'כתובת המייל אינה תקינה');
      return;
    }

    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      Alert.alert('שגיאה', 'מספר הטלפון חייב להכיל בדיוק 10 ספרות');
      return;
    }

    if (registerPassword !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות לא תואמות');
      return;
    }

    if (registerPassword.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    try {
      const response = await fetch(`${config.SERVER_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('הצלחה', 'נרשמת בהצלחה!');
        setActiveTab('login');
        // ריסט שדות
        setFirstName('');
        setLastName('');
        setPhone('');
        setRegisterEmail('');
        setRegisterPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('שגיאה', data.message);
      }
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להתחבר לשרת');
      console.log(error);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>לידר LEADER</Text>
          <Text style={styles.subtitle}>ניהול שעות עובדות</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'login' && styles.activeTab]}
            onPress={() => setActiveTab('login')}
          >
            <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
              התחברות
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'register' && styles.activeTab]}
            onPress={() => setActiveTab('register')}
          >
            <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
              הרשמה
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.formContainer}>
          {activeTab === 'login' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="אימייל"
                placeholderTextColor="#999"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="סיסמה"
                  placeholderTextColor="#999"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry={!showLoginPassword}
                  textAlign="right"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowLoginPassword(!showLoginPassword)}
                >
                  <Text style={styles.eyeText}>{showLoginPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>התחבר</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>שכחת סיסמה?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="שם פרטי"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                textAlign="right"
              />

              <TextInput
                style={styles.input}
                placeholder="שם משפחה"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                textAlign="right"
              />

              <TextInput
                style={styles.input}
                placeholder="טלפון (10 ספרות)"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                textAlign="right"
              />

              <TextInput
                style={styles.input}
                placeholder="אימייל"
                placeholderTextColor="#999"
                value={registerEmail}
                onChangeText={setRegisterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="סיסמה (לפחות 6 תווים)"
                  placeholderTextColor="#999"
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                  secureTextEntry={!showRegisterPassword}
                  textAlign="right"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowRegisterPassword(!showRegisterPassword)}
                >
                  <Text style={styles.eyeText}>{showRegisterPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="אישור סיסמה"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  textAlign="right"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>הירשם</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
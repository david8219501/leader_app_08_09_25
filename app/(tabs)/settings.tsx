// app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsStyles as styles } from '../../styles/settingsStyles';
import config from '../../config';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // פרטי המנהלת
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // שינוי סיסמה
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${config.SERVER_URL}/manager/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhone(data.phone);
      setEmail(data.email);
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן לטעון פרטים');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות החובה');
      return;
    }

    if (phone && !/^0\d{9}$/.test(phone)) {
      Alert.alert('שגיאה', 'מספר טלפון לא תקין (10 ספרות)');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${config.SERVER_URL}/manager/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, phone, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      Alert.alert('הצלחה', 'הפרטים עודכנו בהצלחה');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'לא ניתן לעדכן פרטים');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות לא תואמות');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${config.SERVER_URL}/manager/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Alert.alert('הצלחה', 'הסיסמה שונתה בהצלחה');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'לא ניתן לשנות סיסמה');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('יציאה', 'האם את בטוחה שברצונך להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('managerId');
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ marginTop: 10 }}>טוען...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>הגדרות</Text>
        <Text style={styles.subtitle}>ניהול חשבון ופרטים אישיים</Text>
      </View>

      {/* פרטים אישיים */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={24} color="#1E3A8A" />
          <Text style={styles.sectionTitle}>פרטים אישיים</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="שם פרטי *"
          placeholderTextColor="#999"
          value={firstName}
          onChangeText={setFirstName}
          textAlign="right"
        />

        <TextInput
          style={styles.input}
          placeholder="שם משפחה *"
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
          placeholder="אימייל *"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.6 }]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>שמור שינויים</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* אבטחה */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed-outline" size={24} color="#1E3A8A" />
          <Text style={styles.sectionTitle}>אבטחה</Text>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setShowPasswordModal(true)}
        >
          <Ionicons name="key-outline" size={20} color="#3B82F6" />
          <Text style={styles.linkButtonText}>שנה סיסמה</Text>
          <Ionicons name="chevron-back" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* אודות */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={24} color="#1E3A8A" />
          <Text style={styles.sectionTitle}>אודות</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>גרסה</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>מפתח</Text>
          <Text style={styles.infoValue}>david vertaymer ☺️</Text>
        </View>
      </View>

      {/* יציאה */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        <Text style={styles.logoutButtonText}>התנתק</Text>
      </TouchableOpacity>

      {/* Modal לשינוי סיסמה */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>שינוי סיסמה</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                disabled={saving}
              >
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="סיסמה נוכחית"
              placeholderTextColor="#999"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              textAlign="right"
            />

            <TextInput
              style={styles.input}
              placeholder="סיסמה חדשה (לפחות 6 תווים)"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              textAlign="right"
            />

            <TextInput
              style={styles.input}
              placeholder="אישור סיסמה חדשה"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textAlign="right"
            />

            <TouchableOpacity
              style={[styles.button, saving && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>שמור סיסמה חדשה</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
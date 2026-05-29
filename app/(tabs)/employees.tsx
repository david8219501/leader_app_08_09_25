import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { employeesStyles as styles } from '../../styles/employeesStyles';
import config from '../../config';

const { width, height } = Dimensions.get('window');

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  managerId: string;
}

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [manager, setManager] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [token, setToken] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadTokenAndEmployees();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshEmployees();
    }, [])
  );

  const loadTokenAndEmployees = async () => {
    try {
      setLoading(true);
      const savedToken = await AsyncStorage.getItem('token');
      if (!savedToken) {
        Alert.alert('שגיאה', 'לא נמצא token. אנא התחבר מחדש');
        return;
      }
      setToken(savedToken);
      const managerResponse = await fetch(`${config.SERVER_URL}/manager/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
      });
      if (managerResponse.ok) {
        const managerData = await managerResponse.json();
        setManager(managerData);
      }
      await refreshEmployees();
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן לטעון את רשימת העובדות');
    } finally {
      setLoading(false);
    }
  };

  const refreshEmployees = async () => {
    const savedToken = await AsyncStorage.getItem('token');
    if (!savedToken) return;
    try {
      const managerResponse = await fetch(`${config.SERVER_URL}/manager/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
      });
      if (managerResponse.ok) {
        const managerData = await managerResponse.json();
        setManager(managerData);
      }
      const response = await fetch(`${config.SERVER_URL}/employees`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        const mappedEmployees = data.map((emp: any) => ({
          id: emp.id.toString(),
          firstName: emp.first_name,
          lastName: emp.last_name,
          phone: emp.phone || '',
          managerId: emp.manager_id.toString(),
        }));
        setEmployees(mappedEmployees);
      }
    } catch (error) {
      console.error('Error refreshing employees:', error);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditingEmployee(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setModalVisible(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFirstName(employee.firstName);
    setLastName(employee.lastName);
    setPhone(employee.phone);
    setModalVisible(true);
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const limited = digits.substring(0, 10);
    if (limited.length > 3) {
      return `${limited.substring(0, 3)}-${limited.substring(3)}`;
    }
    return limited;
  };

  const validateForm = () => {
    if (!firstName || !lastName) {
      Alert.alert('שגיאה', 'אנא מלא את השם');
      return false;
    }
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        Alert.alert('שגיאה', 'מספר טלפון חייב להכיל 10 ספרות');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSyncing(true);
      const cleanPhone = phone.replace(/\D/g, '');
      if (editingEmployee) {
        const response = await fetch(`${config.SERVER_URL}/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), phone: cleanPhone || null }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to update employee');
        }
        await refreshEmployees();
        Alert.alert('הצלחה', 'העובדת עודכנה בהצלחה');
      } else {
        const response = await fetch(`${config.SERVER_URL}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), phone: cleanPhone || null }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to add employee');
        }
        await refreshEmployees();
        Alert.alert('הצלחה', 'העובדת נוספה בהצלחה');
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'לא ניתן לשמור את העובדת');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('מחיקת עובדת', 'האם את בטוחה שברצונך למחוק עובדת זו?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            setSyncing(true);
            const response = await fetch(`${config.SERVER_URL}/employees/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to delete employee');
            await refreshEmployees();
            Alert.alert('הצלחה', 'העובדת נמחקה בהצלחה');
          } catch (error) {
            Alert.alert('שגיאה', 'לא ניתן למחוק את העובדת');
          } finally {
            setSyncing(false);
          }
        },
      },
    ]);
  };
  const renderEmployee = ({ item }: { item: Employee }) => (
    <View style={styles.employeeCard}>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
          <Ionicons name="pencil" size={width * 0.06} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={width * 0.06} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.firstName} {item.lastName}</Text>
        {item.phone && <Text style={styles.employeePhone}>{item.phone}</Text>}
      </View>
    </View>
  );
  
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: height * 0.015, fontSize: width * 0.04 }}>טוען נתונים...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ניהול עובדות</Text>
        <Text style={styles.subtitle}>{filteredEmployees.length} עובדות</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש עובדת..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
        <Ionicons name="search" size={width * 0.05} color="#64748B" style={styles.searchIcon} />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>הוסף עובדת חדשה</Text>
        <Ionicons name="add-circle" size={width * 0.06} color="#FFF" />
      </TouchableOpacity>

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id}
        renderItem={renderEmployee}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          manager ? (
            <View style={[styles.employeeCard, { backgroundColor: '#E0E7FF', borderLeftWidth: 4, borderLeftColor: '#6366F1' }]}>
              <View style={styles.employeeInfo}>
                <Text style={[styles.employeeName, { color: '#4F46E5' }]}>
                  👑 {manager.firstName} {manager.lastName}
                </Text>
                {manager.phone && <Text style={styles.employeePhone}>{manager.phone}</Text>}
                <Text style={styles.employeePhone}>{manager.email}</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={width * 0.16} color="#CBD5E1" />
            <Text style={styles.emptyText}>אין עובדות</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'עריכת עובדת' : 'הוספת עובדת'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={syncing}>
                <Ionicons name="close" size={width * 0.07} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="שם פרטי"
              placeholderTextColor="#999"
              value={firstName}
              onChangeText={setFirstName}
              textAlign="right"
              editable={!syncing}
            />
            <TextInput
              style={styles.input}
              placeholder="שם משפחה"
              placeholderTextColor="#999"
              value={lastName}
              onChangeText={setLastName}
              textAlign="right"
              editable={!syncing}
            />
            <TextInput
              style={styles.input}
              placeholder="טלפון (10 ספרות) - אופציונלי"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              keyboardType="phone-pad"
              textAlign="right"
              maxLength={12}
              editable={!syncing}
            />

            <TouchableOpacity
              style={[styles.saveButton, syncing && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>שמור</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
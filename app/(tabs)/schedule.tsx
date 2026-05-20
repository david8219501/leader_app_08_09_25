// app/(tabs)/schedule.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { scheduleStyles as styles } from '../../styles/scheduleStyles';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateScheduleHTML } from '../../utils/scheduleTemplate';
import config from '../../config';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  isManager?: boolean;
}

interface DaySchedule {
  morning: string[];
  noon: string[];
  evening: string[];
}

interface WeekSchedule {
  [key: string]: DaySchedule;
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

export default function ScheduleScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isTableReady, setIsTableReady] = useState(false);

  const headerScrollRef = useRef<ScrollView>(null);
  const contentScrollRef = useRef<ScrollView>(null);
  
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
  const shifts = ['morning', 'noon', 'evening'];
  const shiftNames = { morning: 'בוקר', noon: 'צהריים', evening: 'ערב' };

  const [showNoonShift, setShowNoonShift] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [schedule, setSchedule] = useState<WeekSchedule>({
    ראשון: { morning: [], noon: [], evening: [] },
    שני: { morning: [], noon: [], evening: [] },
    שלישי: { morning: [], noon: [], evening: [] },
    רביעי: { morning: [], noon: [], evening: [] },
    חמישי: { morning: [], noon: [], evening: [] },
    שישי: { morning: [], noon: [], evening: [] },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedShift, setSelectedShift] = useState<keyof DaySchedule>('morning');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // גלילה אוטומטית לתחילת הטבלה (ימין)
  const scrollToStart = () => {
    if (!contentScrollRef.current || !headerScrollRef.current) return;
    
    // איפוס מיקום
    contentScrollRef.current.scrollTo({ x: 0, y: 0, animated: false });
    headerScrollRef.current.scrollTo({ x: 0, y: 0, animated: false });
    
    // גלילה לסוף (שב-RTL זה הצד הימני)
    setTimeout(() => {
      contentScrollRef.current?.scrollToEnd({ animated: false });
      headerScrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
  };

  // הפעלת גלילה כשהטבלה מוכנה
  useEffect(() => {
    if (isTableReady) {
      const timer = setTimeout(() => {
        scrollToStart();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isTableReady]);

  // טעינת עובדות ומנהלת
  useEffect(() => {
    const loadTokenAndEmployees = async () => {
      try {
        setLoading(true);
        const savedToken = await AsyncStorage.getItem('token');
        if (!savedToken) throw new Error('לא נמצא token');

        setToken(savedToken);

        const managerResp = await fetch(`${config.SERVER_URL}/manager/profile`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        
        let managerEmployee: Employee | null = null;
        if (managerResp.ok) {
          const managerData = await managerResp.json();
          managerEmployee = {
            id: `m_${managerData.id}`,
            firstName: managerData.firstName,
            lastName: managerData.lastName,
            isManager: true,
          };
        }

        const empResp = await fetch(`${config.SERVER_URL}/employees`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (!empResp.ok) throw new Error('לא ניתן לטעון עובדות');
        const empData = await empResp.json();
        const employeesList: Employee[] = empData.map((e: any) => ({
          id: `e_${e.id}`,
          firstName: e.first_name,
          lastName: e.last_name,
        }));

        if (managerEmployee) {
          setEmployees([managerEmployee, ...employeesList]);
        } else {
          setEmployees(employeesList);
        }
      } catch (err) {
        console.error(err);
        Alert.alert('שגיאה', 'לא ניתן לטעון רשימת עובדים');
      } finally {
        setLoading(false);
      }
    };

    loadTokenAndEmployees();
  }, []);

  // רענון עובדות בכניסה למסך
  useFocusEffect(
    React.useCallback(() => {
      const refreshEmployees = async () => {
        const savedToken = await AsyncStorage.getItem('token');
        if (!savedToken) return;

        try {
          const managerResp = await fetch(`${config.SERVER_URL}/manager/profile`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          
          let managerEmployee: Employee | null = null;
          if (managerResp.ok) {
            const managerData = await managerResp.json();
            managerEmployee = {
              id: `m_${managerData.id}`,
              firstName: managerData.firstName,
              lastName: managerData.lastName,
              isManager: true,
            };
          }

          const empResp = await fetch(`${config.SERVER_URL}/employees`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (empResp.ok) {
            const empData = await empResp.json();
            const employeesList: Employee[] = empData.map((e: any) => ({
              id: `e_${e.id}`,
              firstName: e.first_name,
              lastName: e.last_name,
            }));

            if (managerEmployee) {
              setEmployees([managerEmployee, ...employeesList]);
            } else {
              setEmployees(employeesList);
            }
          }

          loadShifts();
        } catch (error) {
          console.error('Error refreshing employees:', error);
        }
      };

      refreshEmployees();
    }, [])
  );

  // טעינת משמרות בהחלפת שבוע
  useEffect(() => {
    loadShifts();
  }, [currentWeekStart]);

  const loadShifts = async () => {
    try {
      setSyncing(true);
      if (!token) return;
      
      const weekStart = formatDateForServer(currentWeekStart);
      const response = await fetch(`${config.SERVER_URL}/shifts/${weekStart}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch shifts');
      const shiftsData = await response.json();

      const newSchedule: WeekSchedule = {};
      days.forEach((day) => {
        newSchedule[day] = { morning: [], noon: [], evening: [] };
      });

      shiftsData.forEach((shift: any) => {
        if (newSchedule[shift.day]) {
          newSchedule[shift.day][shift.shift_type as keyof DaySchedule].push(
            shift.employee_id
          );
        }
      });

      setSchedule(newSchedule);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setSyncing(false);
    }
  };

  const formatDateForServer = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 6; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }));
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const previousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
    setIsTableReady(false);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
    setIsTableReady(false);
  };

  const openSelector = (day: string, shift: keyof DaySchedule) => {
    setSelectedDay(day);
    setSelectedShift(shift);
    setSelectedEmployees(schedule[day][shift]);
    setModalVisible(true);
  };

  const toggleEmployee = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  const saveSelection = async () => {
    try {
      setSyncing(true);
      const weekStart = formatDateForServer(currentWeekStart);

      await fetch(`${config.SERVER_URL}/shifts/${weekStart}/${selectedDay}/${selectedShift}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      for (const employeeId of selectedEmployees) {
        const response = await fetch(`${config.SERVER_URL}/shifts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId,
            day: selectedDay,
            shiftType: selectedShift,
            weekStartDate: weekStart,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error saving shift:', errorData);
          throw new Error(errorData.message || 'Failed to save shift');
        }
      }

      setSchedule({
        ...schedule,
        [selectedDay]: {
          ...schedule[selectedDay],
          [selectedShift]: selectedEmployees,
        },
      });

      setModalVisible(false);
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן לשמור משמרות');
      console.error('Save error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const resetSchedule = () => {
    Alert.alert('איפוס טבלה', 'האם את בטוחה שברצונך למחוק את כל השעות?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'איפוס',
        style: 'destructive',
        onPress: async () => {
          try {
            setSyncing(true);
            const weekStart = formatDateForServer(currentWeekStart);

            await fetch(`${config.SERVER_URL}/shifts/${weekStart}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            });

            const emptySchedule: WeekSchedule = {};
            days.forEach((day) => {
              emptySchedule[day] = { morning: [], noon: [], evening: [] };
            });
            setSchedule(emptySchedule);

            Alert.alert('הצלחה', 'הטבלה אופסה');
          } catch (error) {
            Alert.alert('שגיאה', 'לא ניתן לאפס את הטבלה');
          } finally {
            setSyncing(false);
          }
        },
      },
    ]);
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : '';
  };

  const renderCellContent = (day: string, shift: keyof DaySchedule) => {
    const employeeIds = schedule[day][shift];
    if (employeeIds.length === 0) {
      return <Text style={styles.emptyCell}>לחץ להוסיף</Text>;
    }
    return employeeIds.map((id) => (
      <Text key={id} style={styles.employeeName}>
        {getEmployeeName(id)}
      </Text>
    ));
  };

  const shareSchedule = async () => {
    try {
      setIsGeneratingPDF(true);
      const html = generateScheduleHTML(
        schedule,
        weekDates,
        days,
        showNoonShift,
        employees
      );
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'שתף טבלת שעות',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('הצלחה', `הקובץ נשמר: ${uri}`);
      }
    } catch (error) {
      console.error('Error creating PDF:', error);
      Alert.alert('שגיאה', 'לא הצלחנו ליצור PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ marginTop: 10 }}>טוען נתונים...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>לידר LEADER</Text>
        <View style={styles.weekNav}>
          <TouchableOpacity 
            onPress={nextWeek} 
            style={styles.navButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={28} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.weekContainer}>
            <Text style={styles.weekText}>
              {weekDates[0]} - {weekDates[5]}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={previousWeek} 
            style={styles.navButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          ref={headerScrollRef}
          scrollEnabled={false}
          style={styles.fixedHeader}
        >
          <View style={styles.headerRow}>
            <View style={[styles.cell, styles.headerCell, styles.shiftLabelCell]}>
              <Text style={styles.headerText}>משמרת</Text>
            </View>
            {days.map((day, index) => (
              <View key={day} style={[styles.cell, styles.headerCell, styles.dayCell]}>
                <Text style={styles.headerText}>{day}</Text>
                <Text style={styles.dateText}>{weekDates[index]}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.scrollableWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            ref={contentScrollRef}
            style={styles.horizontalScroll}
            onLayout={() => {
              if (!isTableReady) {
                setIsTableReady(true);
              }
            }}
            onScroll={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              if (headerScrollRef.current) {
                headerScrollRef.current.scrollTo({ x: offsetX, animated: false });
              }
            }}
            scrollEventThrottle={16}
          >
            <View style={styles.tableContainer}>
              {shifts
                .filter((shift) => showNoonShift || shift !== 'noon')
                .map((shift) => (
                  <View key={shift} style={styles.tableRow}>
                    <View style={[styles.cell, styles.shiftCell, styles.shiftLabelCell]}>
                      <Text style={styles.shiftText}>{shiftNames[shift as keyof typeof shiftNames]}</Text>
                    </View>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={`${day}-${shift}`}
                        style={[styles.cell, styles.dataCell, styles.dayCell]}
                        onPress={() => openSelector(day, shift as keyof DaySchedule)}
                      >
                        {renderCellContent(day, shift as keyof DaySchedule)}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={resetSchedule}>
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>איפוס</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, showNoonShift ? styles.noonButtonActive : styles.noonButtonInactive]} 
          onPress={() => setShowNoonShift(!showNoonShift)}
        >
          <Ionicons 
            name={showNoonShift ? "checkmark-circle" : "close-circle"} 
            size={20} 
            color="#FFF" 
          />
          <Text style={styles.actionButtonText}>
            {showNoonShift ? 'צהריים: פעיל' : 'צהריים: כבוי'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.shareButton]} 
          onPress={shareSchedule}
          disabled={isGeneratingPDF}
        >
          <Ionicons name="share-social" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>
            {isGeneratingPDF ? 'מייצר...' : 'שתף'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay} - {shiftNames[selectedShift as keyof typeof shiftNames]}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={syncing}>
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={employees}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedEmployees.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.employeeItem,
                      isSelected && styles.employeeItemSelected,
                      item.isManager && { backgroundColor: '#E0E7FF' }
                    ]}
                    onPress={() => toggleEmployee(item.id)}
                  >
                    <Text style={[styles.employeeItemText, isSelected && styles.employeeItemTextSelected]}>
                      {item.isManager && '👑 '}
                      {item.firstName} {item.lastName}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity 
              style={[styles.saveButton, syncing && { opacity: 0.6 }]} 
              onPress={saveSelection}
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
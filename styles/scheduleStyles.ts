import { StyleSheet, Dimensions, I18nManager } from 'react-native';

const { width, height } = Dimensions.get('window');

const baseWidth = 360;
const scale = width / baseWidth;
const normalize = (size: number) => Math.round(size * scale);

// ✅ וידוא שה-RTL פעיל
I18nManager.allowRTL(true);

export const scheduleStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf5f6ff',
  },
  header: {
    padding: normalize(20),
    paddingTop: height * 0.08,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  title: {
    fontSize: normalize(32),
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: normalize(18),
    color: '#93C5FD',
    marginTop: normalize(5),
  },
  weekNav: {
    flexDirection: 'row-reverse', // ✅ תמיד RTL
    alignItems: 'center',
    marginTop: normalize(15),
    gap: normalize(15),
    justifyContent: 'center',
  },
  weekContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(25),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  navButton: {
    padding: normalize(10),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: normalize(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekText: {
    fontSize: normalize(16),
    color: '#FFF',
    fontWeight: '600',
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  toggleContainer: {
    flexDirection: 'row-reverse', // ✅ תמיד RTL
    alignItems: 'center',
    marginTop: normalize(15),
    gap: normalize(10),
  },
  toggleLabel: {
    fontSize: normalize(16),
    color: '#FFF',
    fontWeight: '600',
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  toggleButton: {
    width: normalize(50),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    padding: normalize(2),
  },
  toggleButtonActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  tableWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fixedHeader: {
    backgroundColor: 'transparent',
    marginHorizontal: normalize(20),
    marginTop: normalize(20),
    borderTopLeftRadius: normalize(12),
    borderTopRightRadius: normalize(12),
    maxHeight: normalize(90),
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row-reverse', // ✅ תמיד RTL
  },
  scrollableWrapper: {
    flex: 1,
    marginHorizontal: normalize(20),
    marginBottom: normalize(20),
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  horizontalScroll: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: normalize(12),
    borderBottomRightRadius: normalize(12),
    overflow: 'hidden',
    minWidth: width * 2,
  },
  tableRow: {
    flexDirection: 'row-reverse', // ✅ תמיד RTL
  },
  cell: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCell: {
    backgroundColor: '#1E3A8A',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(10),
  },
  headerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: normalize(14),
    textAlign: 'center',
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  dateText: {
    color: '#93C5FD',
    fontSize: normalize(12),
    marginTop: normalize(2),
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  shiftCell: {
    backgroundColor: '#3B82F6',
  },
  shiftText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: normalize(14),
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  shiftLabelCell: {
    width: normalize(80),
  },
  dayCell: {
    width: normalize(120),
    minHeight: normalize(90),
  },
  dataCell: {
    backgroundColor: '#FFF',
  },
  emptyCell: {
    color: '#CBD5E1',
    fontSize: normalize(12),
    textAlign: 'center',
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  employeeName: {
    fontSize: normalize(13),
    color: '#1E293B',
    textAlign: 'center',
    marginVertical: normalize(2),
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  actions: {
    flexDirection: 'row-reverse', // ✅ תמיד RTL
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(8),
    gap: normalize(8),
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row-reverse', // ✅ תמיד RTL
    alignItems: 'center',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(20),
    gap: normalize(6),
    backgroundColor: '#1E3A8A',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: normalize(13),
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  resetButton: {
    backgroundColor: '#EF4444',
  },
  noonButtonActive: {
    backgroundColor: '#10B981',
  },
  noonButtonInactive: {
    backgroundColor: '#94A3B8',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: normalize(20),
    padding: normalize(20),
  },
  modalHeader: {
    flexDirection: 'row-reverse', // ✅ תמיד RTL
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: '#1E293B',
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  employeeItem: {
    flexDirection: 'row-reverse', // ✅ תמיד RTL
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: normalize(12),
    marginBottom: normalize(8),
    backgroundColor: '#F8FAFC',
    borderRadius: normalize(10),
  },
  employeeItemSelected: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  employeeItemText: {
    fontSize: normalize(15),
    color: '#1E293B',
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  employeeItemTextSelected: {
    fontWeight: 'bold',
    color: '#166534',
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: normalize(10),
    padding: normalize(14),
    alignItems: 'center',
    marginTop: normalize(12),
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: normalize(16),
    fontWeight: 'bold',
    writingDirection: 'rtl', // ✅ כיוון כתיבה RTL
  },
});
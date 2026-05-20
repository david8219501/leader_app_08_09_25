import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const baseWidth = 360;
const scale = width / baseWidth;
const normalize = (size: number) => Math.round(size * scale);

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: normalize(20),
  },
  header: {
    alignItems: 'center',
    marginBottom: normalize(40),
  },
  logo: {
    width: normalize(200),
    height: normalize(100),
    marginBottom: normalize(10),
  },
  title: {
    fontSize: normalize(46),
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: normalize(5),
  },
  subtitle: {
    fontSize: normalize(16),
    color: '#64748B',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: normalize(12),
    padding: normalize(4),
    marginBottom: normalize(30),
  },
  tab: {
    flex: 1,
    paddingVertical: normalize(12),
    alignItems: 'center',
    borderRadius: normalize(8),
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#1E3A8A',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(16),
    padding: normalize(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: normalize(10),
    padding: normalize(15),
    fontSize: normalize(16),
    marginBottom: normalize(15),
    textAlign: 'right',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: normalize(10),
    marginBottom: normalize(15),
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    padding: normalize(15),
    paddingLeft: normalize(50),
    fontSize: normalize(16),
    textAlign: 'right',
  },
  eyeIcon: {
    position: 'absolute',
    left: normalize(15),
    padding: normalize(5),
  },
  eyeText: {
    fontSize: normalize(20),
  },
  button: {
    backgroundColor: '#1E3A8A',
    borderRadius: normalize(10),
    padding: normalize(16),
    alignItems: 'center',
    marginTop: normalize(10),
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: normalize(18),
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: normalize(15),
    alignItems: 'center',
  },
  linkText: {
    color: '#3B82F6',
    fontSize: normalize(14),
  },
});
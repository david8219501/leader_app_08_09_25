import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome Screen</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]} 
        onPress={() => router.push('/Profile')}
      >
        <Text style={styles.buttonText}>Go to Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Go to Tabs</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  welcomeText: {
    fontFamily: 'SpaceMono',
    fontSize: 28,
    marginBottom: 40,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});
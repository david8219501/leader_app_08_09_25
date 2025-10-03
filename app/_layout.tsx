// app/_layout.tsx
import React from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
// הסר את השורה הזו: import 'react-native-reanimated';

export default function RootLayout() {
  // טעינת פונטים מותאמים
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="Welcome" />
        <Stack.Screen name="Profile" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
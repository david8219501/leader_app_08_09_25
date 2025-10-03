// app/Profile.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontFamily: 'SpaceMono', fontSize: 24 }}>Profile Screen</Text>
      <Button title="Go Back" onPress={() => router.back()} />
    </View>
  );
}

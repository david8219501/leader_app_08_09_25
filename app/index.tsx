// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = false; // TODO: Firebase
    
    if (isLoggedIn) {
      router.replace('/(tabs)/schedule');
    } else {
      router.replace('/login');
    }
  }, []);

  return null;
}
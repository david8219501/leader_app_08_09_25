// app/_index.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login'); // מפנה אוטומטית למסך Welcome
  }, []);

  return null; // אין צורך להציג משהו
}

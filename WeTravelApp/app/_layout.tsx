import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNetwork } from '@/hooks/use-network';
import { initDB } from '@/hooks/use-offline-db';
import { PostsProvider } from '@/hooks/use-posts';
import { syncOfflineData } from '@/hooks/use-sync';
import { UserProvider } from '@/hooks/use-user';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isOnline } = useNetwork();

  // Initialize local DB and sync on startup
  useEffect(() => {
    const startup = async () => {
      await initDB();
      if (isOnline) {
        const result = await syncOfflineData();
        if (result.success) {
          console.log('✓ Offline data synced');
        } else {
          console.log('⚠️ Sync failed:', result.error);
        }
      }
    };
    startup();
  }, [isOnline]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = 'input:focus, textarea:focus { outline: none !important; box-shadow: none !important; }';
      document.head.appendChild(style);
    }
  }, []);

  return (
    <UserProvider>
    <PostsProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="create-post" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PostsProvider>
    </UserProvider>
  );
}
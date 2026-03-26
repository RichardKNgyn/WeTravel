import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const ACCENT = '#e07b54';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: isDark ? '#666' : '#aaa',
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderTopColor: isDark ? '#252525' : '#ede9e2',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: ACCENT,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/create-post');
          },
        }}
      />

      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
/**
 * EXAMPLE: Simple Trips Screen
 * 
 * Just loads from local DB - no API calls
 * Works offline and online the same way
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { useNetwork } from '../../hooks/use-network';
import { getTrips, type Trip } from '../../hooks/use-offline-db';

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useNetwork();

  // Load trips from local DB
  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTrips();
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Offline badge */}
      {!isOnline && (
        <View style={styles.badge}>
          <Ionicons name="wifi-off" size={16} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 6, fontWeight: '600' }}>
            Offline
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Your Trips</Text>
        <Pressable>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </Pressable>
      </View>

      {trips.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="map-outline" size={48} color={theme.colors.subtext} />
          <Text style={styles.emptyText}>No trips yet</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{item.location_name}</Text>
              <Text style={styles.cardSubtitle}>{item.address}</Text>
              {item.planned_date && (
                <Text style={styles.cardDate}>{item.planned_date}</Text>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.subtext,
    marginTop: 4,
  },
  cardDate: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 6,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginTop: 8,
  },
});

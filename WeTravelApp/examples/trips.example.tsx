import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import { useNetwork } from "../../hooks/use-network";
import type { Trip } from "../../hooks/use-offline-db";
import { getTrips } from "../../hooks/use-offline-db";
import { useSync } from "../../hooks/use-sync";

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useNetwork();
  const { status: syncStatus, isOnline: syncIsOnline } = useSync();

  // Load trips from local DB
  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const localTrips = await getTrips();
      setTrips(localTrips);
    } catch (err) {
      console.error("Failed to load trips:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Reload when sync completes
  useEffect(() => {
    if (syncStatus === 'success') {
      loadTrips();
    }
  }, [syncStatus, loadTrips]);

  // Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📱 Offline — showing cached trips</Text>
        </View>
      )}

      {/* Syncing indicator */}
      {syncStatus === 'syncing' && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.syncingText}>Syncing trips from backend...</Text>
        </View>
      )}

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Trips</Text>
          <Pressable style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading trips...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={48} color={theme.colors.subtext} />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubtext}>
              {isOnline
                ? "Create your first trip to get started"
                : "No cached trips — go online to sync"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable style={styles.tripCard}>
                <View style={styles.tripContent}>
                  <Text style={styles.tripName}>{item.location_name}</Text>
                  <Text style={styles.tripDate}>
                    {item.planned_date || "No date set"}
                  </Text>
                  <Text style={styles.tripAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.subtext}
                />
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  offlineBanner: {
    backgroundColor: "#FFC107",
    padding: 12,
    alignItems: "center",
  },
  offlineText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  syncingBanner: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  syncingText: {
    color: "#2196F3",
    marginLeft: 8,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.subtext,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: 8,
    textAlign: "center",
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: theme.spacing.md,
  },
  tripContent: {
    flex: 1,
  },
  tripName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  tripDate: {
    fontSize: 13,
    color: theme.colors.subtext,
    marginTop: 4,
  },
  tripAddress: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 4,
  },
});

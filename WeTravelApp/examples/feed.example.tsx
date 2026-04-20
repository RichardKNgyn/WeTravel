import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PostCard from "../../components/PostCard";
import { theme } from "../../constants/theme";
import { useNetwork } from "../../hooks/use-network";
import { usePosts } from "../../hooks/use-posts";
import { useSync } from "../../hooks/use-sync";

export default function Feed() {
  const [query, setQuery] = useState("");
  const { posts } = usePosts();
  const { isOnline } = useNetwork();
  const { status, error, lastSyncTime, isOnline: syncIsOnline } = useSync();
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  // Show sync status banner when syncing or error
  useEffect(() => {
    if (status === 'syncing' || status === 'error') {
      setShowSyncStatus(true);
      // Auto-hide success message after 2 seconds
      if (status === 'success') {
        const timer = setTimeout(() => setShowSyncStatus(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) =>
      p.author.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.location ?? "").toLowerCase().includes(q)
    );
  }, [query, posts]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Offline Banner */}
      {!isOnline && (
        <View style={{ backgroundColor: '#FFC107', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: '#000', fontWeight: '600' }}>
            You are offline — showing cached posts
          </Text>
        </View>
      )}

      {/* Sync Status Banners */}
      {showSyncStatus && (
        <>
          {status === 'syncing' && (
            <View style={[styles.syncBanner, { backgroundColor: '#2196F3' }]}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '500' }}>
                Syncing from backend...
              </Text>
            </View>
          )}
          {status === 'success' && lastSyncTime && (
            <View style={[styles.syncBanner, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '500' }}>
                Posts synced successfully
              </Text>
            </View>
          )}
          {status === 'error' && (
            <View style={[styles.syncBanner, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="alert-circle" size={16} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '500' }}>
                Sync failed: {error}
              </Text>
            </View>
          )}
        </>
      )}

      <View style={styles.container}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={theme.colors.subtext} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search destinations or friends"
            placeholderTextColor={theme.colors.subtext}
            style={styles.search}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg }}
          renderItem={({ item }) => <PostCard post={item} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: theme.colors.subtext }}>No posts found</Text>
            </View>
          }
        />
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: theme.spacing.md,
  },
  search: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.text,
  },
  syncBanner: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

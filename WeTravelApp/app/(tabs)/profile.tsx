import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { usePosts } from "../../hooks/use-posts";
import PostCard from "../../components/PostCard";

// Placeholder until real auth is connected
const CURRENT_USER = "You";
const ACCENT = "#e07b54";

export default function Profile() {
  const router = useRouter();
  const { posts } = usePosts();

  const myPosts = posts.filter((p) => p.author === CURRENT_USER);
  const totalLikes = myPosts.reduce((sum, p) => sum + p.likes, 0);
  const countries = new Set(
    myPosts.map((p) => p.location).filter(Boolean)
  ).size;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header row */}
            <View style={styles.headerRow}>
              <Text style={styles.screenTitle}>Profile</Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={styles.logoutBtn}
                hitSlop={10}
              >
                <Ionicons name="log-out-outline" size={22} color={theme.colors.subtext} />
              </TouchableOpacity>
            </View>

            {/* Avatar + name */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>Y</Text>
              </View>
              <Text style={styles.displayName}>My Profile</Text>
              <Text style={styles.handle}>@traveler</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{myPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalLikes}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{countries}</Text>
                <Text style={styles.statLabel}>Countries</Text>
              </View>
            </View>

            {/* Section label */}
            <Text style={styles.sectionLabel}>Your Posts</Text>
          </View>
        }
        renderItem={({ item }) => <PostCard post={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={56} color={theme.colors.border} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Share your first travel experience!
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push("/create-post")}
            >
              <Text style={styles.createBtnText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
  },
  logoutBtn: {
    padding: 4,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: "900",
    color: "#fff",
  },
  displayName: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
  },
  handle: {
    fontSize: 13,
    color: theme.colors.subtext,
    fontWeight: "600",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.subtext,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: "center",
  },
  createBtn: {
    marginTop: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

import React, { useMemo, useState } from "react";
import { View, TextInput, StyleSheet, FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import PostCard from "../../components/PostCard";
import { POSTS, Post } from "../../data/posts";
import { Ionicons } from "@expo/vector-icons";

export default function Feed() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POSTS;
    return POSTS.filter((p) => {
      return (
        p.user.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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

        <FlatList<Post>
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg }}
          renderItem={({ item }) => <PostCard post={item} />}
          ListEmptyComponent={
            <View style={{ paddingTop: 60, alignItems: "center" }}>
              <Text style={{ color: theme.colors.subtext, fontWeight: "700" }}>
                No matches 🫠
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  searchRow: {
    marginTop: theme.spacing.sm,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.muted,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  search: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "700",
  },
});

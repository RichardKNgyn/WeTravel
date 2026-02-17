import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "../constants/theme";
import type { Post } from "../data/posts";

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const likes = useMemo(() => post.likes + (liked ? 1 : 0), [post.likes, liked]);

  return (
    <View style={styles.card}>
      <Image source={{ uri: post.image }} style={styles.image} />

      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.userBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{post.user?.[0]?.toUpperCase() ?? "U"}</Text>
            </View>
            <View>
              <Text style={styles.user}>{post.user}</Text>
              {post.location ? <Text style={styles.location}>{post.location}</Text> : null}
            </View>
          </View>

          <Pressable onPress={() => {}} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.subtext} />
          </Pressable>
        </View>

        <Text style={styles.caption} numberOfLines={3}>
          {post.caption}
        </Text>

        <View style={[styles.row, { marginTop: 10 }]}>
          <View style={styles.actions}>
            <Pressable
              onPress={() => setLiked((v) => !v)}
              style={styles.actionBtn}
              hitSlop={10}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={20}
                color={liked ? theme.colors.danger : theme.colors.text}
              />
              <Text style={styles.actionText}>{likes}</Text>
            </Pressable>

            <Pressable onPress={() => router.push(`/post/${post.id}`)} style={styles.actionBtn} hitSlop={10}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text} />
              <Text style={styles.actionText}>Comment</Text>
            </Pressable>

            <Pressable onPress={() => {}} style={styles.actionBtn} hitSlop={10}>
              <Ionicons name="paper-plane-outline" size={20} color={theme.colors.text} />
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => {}} hitSlop={10}>
            <Ionicons name="bookmark-outline" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  image: {
    width: "100%",
    height: 240,
    backgroundColor: theme.colors.muted,
  },
  body: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  user: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  location: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 1,
  },
  caption: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 18,
    color: theme.colors.text,
    opacity: 0.9,
  },
  actions: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 12.5,
    color: theme.colors.subtext,
    fontWeight: "700",
  },
});

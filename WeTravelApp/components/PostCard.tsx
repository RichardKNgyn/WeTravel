import type { Post } from "@/hooks/use-posts";
import { usePosts } from "@/hooks/use-posts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useRef } from "react";
import { Image, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";

export default function PostCard({ post }: { post: Post }) {
  const { savedPosts, toggleLike, toggleSave } = usePosts();
  const saved = savedPosts.has(post.id);
  const likes = useMemo(() => post.likes, [post.likes]);

  const sharingRef = useRef(false);
  const handleShare = async () => {
    if (sharingRef.current) return;
    sharingRef.current = true;
    try {
      const message = `${post.title}${post.location ? ` · ${post.location}` : ""}\n${post.content ?? ""}`;
      if (Platform.OS === "web" && typeof navigator?.share === "function") {
        await navigator.share({ title: post.title, text: message });
      } else {
        await Share.share({ message });
      }
    } catch {
      // user cancelled or browser error — ignore
    } finally {
      sharingRef.current = false;
    }
  };

  return (
    <View style={styles.card}>
      {/* Image */}
      {post.images?.[0] ? (
        <Image source={{ uri: post.images[0] }} style={styles.image} />
      ) : null}

      <View style={styles.body}>
        {/* Header Row */}
        <View style={styles.row}>
          <View style={styles.userBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.author?.[0]?.toUpperCase() ?? "U"}
              </Text>
            </View>

            <View>
              <Text style={styles.user}>{post.author}</Text>
              {post.location ? (
                <Text style={styles.location}>{post.location}</Text>
              ) : null}
            </View>
          </View>

          <Pressable hitSlop={10}>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={theme.colors.subtext}
            />
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Description */}
        {post.description ? (
          <Text style={styles.caption} numberOfLines={3}>
            {post.description}
          </Text>
        ) : null}

        {/* Actions */}
        <View style={[styles.row, { marginTop: 10 }]}>
          <View style={styles.actions}>
            <Pressable
              onPress={() => toggleLike(post.id)}
              style={styles.actionBtn}
              hitSlop={10}
            >
              <Ionicons
                name={post.isLiked ? "heart" : "heart-outline"}
                size={20}
                color={post.isLiked ? theme.colors.error : theme.colors.text}
              />
              <Text style={styles.actionText}>{likes}</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push(`/post/${post.id}`)}
              style={styles.actionBtn}
              hitSlop={10}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={theme.colors.text}
              />
              <Text style={styles.actionText}>
                {post.comments.length}
              </Text>
            </Pressable>

            <Pressable style={styles.actionBtn} hitSlop={10} onPress={handleShare}>
              <Ionicons
                name="paper-plane-outline"
                size={20}
                color={theme.colors.text}
              />
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
          </View>

          <Pressable hitSlop={10} onPress={() => toggleSave(post.id)}>
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={saved ? theme.colors.primary : theme.colors.text}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
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
  title: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
  },
  caption: {
    marginTop: 4,
    fontSize: 13.5,
    lineHeight: 18,
    color: theme.colors.text,
    opacity: 0.85,
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
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { POSTS, type Comment } from "../../data/posts";
import { theme } from "../../constants/theme";

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = POSTS.find((p) => p.id === id);

  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post?.comments ?? []);
  const [input, setInput] = useState("");

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Post not found.</Text>
      </View>
    );
  }

  const likes = post.likes + (liked ? 1 : 0);

  function handleAddComment() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setComments((prev) => [
      ...prev,
      { id: String(Date.now()), user: "You", text: trimmed },
    ]);
    setInput("");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Image source={{ uri: post.image }} style={styles.image} />

        <View style={styles.body}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.user?.[0]?.toUpperCase() ?? "U"}
              </Text>
            </View>
            <View>
              <Text style={styles.user}>{post.user}</Text>
              {post.location ? (
                <Text style={styles.location}>{post.location}</Text>
              ) : null}
            </View>
          </View>

          <Text style={styles.caption}>{post.caption}</Text>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setLiked((v) => !v)}
              style={styles.actionBtn}
              hitSlop={10}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? theme.colors.danger : theme.colors.text}
              />
              <Text style={styles.actionText}>{likes}</Text>
            </Pressable>

            <View style={styles.actionBtn}>
              <Ionicons
                name="chatbubble-outline"
                size={22}
                color={theme.colors.text}
              />
              <Text style={styles.actionText}>{comments.length}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Comments</Text>

          {comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {c.user?.[0]?.toUpperCase() ?? "U"}
                  </Text>
                </View>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentUser}>{c.user}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Add a comment..."
          placeholderTextColor={theme.colors.subtext}
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={handleAddComment}
        />
        <Pressable onPress={handleAddComment} hitSlop={10}>
          <Ionicons name="send" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    color: theme.colors.subtext,
    fontSize: 16,
  },
  image: {
    width: "100%",
    height: 300,
    backgroundColor: theme.colors.muted,
  },
  body: {
    padding: theme.spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
  },
  user: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
  },
  location: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 1,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: theme.colors.subtext,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.subtext,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noComments: {
    fontSize: 13,
    color: theme.colors.subtext,
    fontStyle: "italic",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.text,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.xs,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: theme.input.height,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text,
  },
});

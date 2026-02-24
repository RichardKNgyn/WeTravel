import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "../../constants/theme";
import { usePosts, type Comment } from "../../hooks/use-posts";

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, addComment, addReply } = usePosts();
  const post = posts.find(
  p => p.id === (Array.isArray(id) ? id[0] : id)
);

if (!post) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Post not found</Text>
    </View>
  );
}
  const [liked, setLiked] = useState(false);
  const [input, setInput] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const likes = post.likes + (liked ? 1 : 0);

  function handleAddComment() {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (replyTarget) {
      addReply(post.id, replyTarget, trimmed);
      setExpanded((prev) => ({ ...prev, [replyTarget]: true }));
      setReplyTarget(null);
    } else {
      addComment(post.id, trimmed);
    }

    setInput("");
  }

  function renderComment(comment: Comment, level = 0) {
    return (
      <View key={comment.id} style={{ marginLeft: level * 20, marginBottom: 12 }}>
        <View style={styles.commentRow}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {comment.user?.[0]?.toUpperCase() ?? "U"}
            </Text>
          </View>

          <View style={styles.commentBubble}>
            <Text style={styles.commentUser}>{comment.user}</Text>
            <Text
              style={[
                styles.commentText,
                { fontSize: level > 0 ? 12 : 13 },
              ]}
            >
              {comment.text}
            </Text>

            <View style={{ flexDirection: "row", gap: 15, marginTop: 6 }}>
              <Pressable onPress={() => setReplyTarget(comment.id)}>
                <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
                  Reply
                </Text>
              </Pressable>

              {comment.replies?.length > 0 && (
                <Pressable
                  onPress={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [comment.id]: !prev[comment.id],
                    }))
                  }
                >
                  <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
                    {expanded[comment.id] ? "Hide replies" : "View replies"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {expanded[comment.id] &&
          comment.replies?.map((reply) =>
            renderComment(reply, level + 1)
          )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {post.images?.[0] ? (
          <Image source={{ uri: post.images[0] }} style={styles.image} />
        ) : null}

        <View style={styles.body}>
          <View style={styles.userRow}>
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

          <Text style={styles.title}>{post.title}</Text>

          {post.description ? (
            <Text style={styles.caption}>{post.description}</Text>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setLiked((v) => !v)}
              style={styles.actionBtn}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? theme.colors.error : theme.colors.text}
              />
              <Text style={styles.actionText}>{likes}</Text>
            </Pressable>

            <View style={styles.actionBtn}>
              <Ionicons
                name="chatbubble-outline"
                size={22}
                color={theme.colors.text}
              />
              <Text style={styles.actionText}>
                {post.comments.length}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Comments</Text>

          {post.comments.length === 0 ? (
            <Text style={styles.noComments}>
              No comments yet. Be the first!
            </Text>
          ) : (
            post.comments.map((c) => renderComment(c))
          )}
        </View>
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder={
            replyTarget ? "Write a reply..." : "Add a comment..."
          }
          placeholderTextColor={theme.colors.subtext}
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={handleAddComment}
        />
        <Pressable onPress={handleAddComment}>
          <Ionicons
            name="send"
            size={20}
            color={theme.colors.primary}
          />
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
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 6,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    opacity: 0.8,
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
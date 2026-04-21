import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { usePosts } from "../../hooks/use-posts";

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { posts, addComment, addReply, likedPosts, savedPosts, toggleLike, toggleSave } = usePosts();
  const post = posts.find((p) => p.id === id);

  const [liked, setLiked] = useState(likedPosts.has(id || ''));
  const [saved, setSaved] = useState(savedPosts.has(id || ''));
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Post not found.</Text>
      </View>
    );
  }

  const likes = post.likes + (liked ? 1 : 0);

  function handleToggleLike() {
    const newLiked = !liked;
    setLiked(newLiked);
    toggleLike(post!.id);
  }

  function handleToggleSave() {
    const newSaved = !saved;
    setSaved(newSaved);
    toggleSave(post!.id);
  }

  function handleAddComment() {
    const trimmed = input.trim();
    if (!trimmed) return;
    addComment(post!.id, { 
      id: String(Date.now()), 
      user: "You", 
      text: trimmed,
      createdAt: new Date().toISOString()
    });
    setInput("");
  }

  function handleAddReply(commentId: string) {
    const trimmed = replyInput.trim();
    if (!trimmed) return;
    addReply(post!.id, commentId, { 
      id: String(Date.now()), 
      user: "You", 
      text: trimmed,
      createdAt: new Date().toISOString()
    });
    setReplyInput("");
    setReplyingTo(null);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.backRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        {post.images[0] ? (
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
              onPress={handleToggleLike}
              style={styles.actionBtn}
              hitSlop={10}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? theme.colors.error : theme.colors.text}
              />
              <Text style={styles.actionText}>{likes}</Text>
            </Pressable>

            <View style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={22} color={theme.colors.text} />
              <Text style={styles.actionText}>{post.comments.length}</Text>
            </View>

            <Pressable
              onPress={handleToggleSave}
              style={styles.actionBtn}
              hitSlop={10}
            >
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={saved ? theme.colors.primary : theme.colors.text}
              />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Comments</Text>

          {post.comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          ) : (
            post.comments.map((c) => (
              <View key={c.id}>
                <View style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {c.user?.[0]?.toUpperCase() ?? "U"}
                    </Text>
                  </View>
                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentUser}>{c.user}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                    <Pressable 
                      onPress={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      style={styles.replyBtn}
                      hitSlop={5}
                    >
                      <Text style={styles.replyText}>Reply</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Reply input */}
                {replyingTo === c.id && (
                  <View style={styles.replyInputContainer}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder={`Reply to ${c.user}...`}
                      placeholderTextColor={theme.colors.subtext}
                      value={replyInput}
                      onChangeText={setReplyInput}
                      returnKeyType="send"
                      onSubmitEditing={() => handleAddReply(c.id)}
                    />
                    <Pressable onPress={() => handleAddReply(c.id)} hitSlop={10}>
                      <Ionicons name="send" size={16} color={theme.colors.primary} />
                    </Pressable>
                  </View>
                )}

                {/* Replies */}
                {c.replies && c.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {c.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyRow}>
                        <View style={styles.replyAvatar}>
                          <Text style={styles.replyAvatarText}>
                            {reply.user?.[0]?.toUpperCase() ?? "U"}
                          </Text>
                        </View>
                        <View style={styles.replyBubble}>
                          <Text style={styles.replyUser}>{reply.user}</Text>
                          <Text style={styles.replyText}>{reply.text}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
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
  backRow: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.muted,
    alignItems: "center",
    justifyContent: "center",
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
  commentContent: {
    flex: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.xs,
    marginBottom: 4,
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
  replyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  replyText: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontWeight: "600",
  },
  replyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 42,
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  repliesContainer: {
    marginLeft: 42,
    marginBottom: theme.spacing.sm,
  },
  replyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  replyAvatarText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.text,
  },
  replyBubble: {
    flex: 1,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.sm,
    padding: 6,
  },
  replyUser: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 1,
  },
  replyText: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 16,
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
    outlineWidth: 0,
    outline: 'none',
    boxShadow: 'none',
  } as any,
});

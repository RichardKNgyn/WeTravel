import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { usePosts } from '@/hooks/use-posts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useState } from 'react';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { posts, toggleLike, likedPosts } = usePosts();

  const theme = {
    bg: isDark ? '#0f0f0f' : '#fafaf8',
    card: isDark ? '#1a1a1a' : '#ffffff',
    text: isDark ? '#f0ede8' : '#1a1714',
    subtext: isDark ? '#777' : '#999',
    border: isDark ? '#252525' : '#ede9e2',
    accent: '#e07b54',
    shadow: isDark
      ? { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }
      : { shadowColor: '#8b6f5e', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
        <View>
          <Text style={[styles.appName, { color: theme.accent }]}>WeTravel</Text>
          <Text style={[styles.headerSub, { color: theme.subtext }]}>What's the world up to?</Text>
        </View>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: theme.accent }]}
          onPress={() => router.push('/create-post')}
          activeOpacity={0.85}>
          <Text style={styles.createBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}>
        {posts.map((post, idx) => {
          const liked = likedPosts.has(post.id);
          return (
            <View
              key={post.id}
              style={[styles.card, { backgroundColor: theme.card, ...theme.shadow }]}>
              {/* Cover image */}
              {post.images.length > 0 && (
                <View style={styles.coverContainer}>
                  <Image
                    source={{ uri: post.images[0] }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                  {post.images.length > 1 && (
                    <View style={styles.imageCount}>
                      <Text style={styles.imageCountText}>+{post.images.length - 1}</Text>
                    </View>
                  )}
                  {post.location ? (
                    <View style={styles.locationBadge}>
                      <Text style={styles.locationText}>📍 {post.location}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Content */}
              <View style={styles.cardContent}>
                <View style={styles.cardMeta}>
                  <View style={[styles.avatar, { backgroundColor: theme.accent + '33' }]}>
                    <Text style={[styles.avatarText, { color: theme.accent }]}>
                      {post.author[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.authorName, { color: theme.text }]}>{post.author}</Text>
                    <Text style={[styles.timeText, { color: theme.subtext }]}>
                      {timeAgo(post.createdAt)}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.postTitle, { color: theme.text }]}>{post.title}</Text>
                {post.description ? (
                  <Text style={[styles.postDesc, { color: theme.subtext }]} numberOfLines={3}>
                    {post.description}
                  </Text>
                ) : null}

                {/* Actions */}
                <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => toggleLike(post.id)}
                    activeOpacity={0.7}>
                    <Text style={[styles.actionIcon, liked && { transform: [{ scale: 1.2 }] }]}>
                      {liked ? '❤️' : '🤍'}
                    </Text>
                    <Text style={[styles.actionText, { color: liked ? theme.accent : theme.subtext }]}>
                      {post.likes + (liked ? 0 : 0)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={[styles.actionText, { color: theme.subtext }]}>Comment</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Text style={styles.actionIcon}>✈️</Text>
                    <Text style={[styles.actionText, { color: theme.subtext }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {posts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌍</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</Text>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              Be the first to share your adventure!
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.accent }]}
              onPress={() => router.push('/create-post')}>
              <Text style={styles.emptyBtnText}>Share Your Travel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'ui-rounded' : 'normal',
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  createBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  feed: {
    paddingHorizontal: 20,
    gap: 20,
    paddingTop: 8,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  coverContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageCount: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  locationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  locationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 16,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 14,
  },
  timeText: {
    fontSize: 12,
    marginTop: 1,
  },
  postTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  postDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 12,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
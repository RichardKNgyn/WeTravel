import React, { useState } from 'react';
import { FlatList, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { PostCard } from '@/components/PostCard';
import { mockPosts, Post } from '@/data/mock-data';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handlePostPress = (post: Post) => {
    // Navigate to post detail
    router.push(`/post/${post.id}`);
  };

  const handleCommentPress = (post: Post) => {
    // Navigate to post detail with comments open
    router.push(`/post/${post.id}?comments=true`);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Search Bar Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.secondary }]}>
          <MaterialIcons name="search" size={20} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search destinations or friends"
            placeholderTextColor={colors.icon}
            onFocus={() => router.push('/search')}
          />
        </View>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => handlePostPress(item)}
            onLike={() => handleLike(item.id)}
            onComment={() => handleCommentPress(item)}
          />
        )}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  feedContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
});
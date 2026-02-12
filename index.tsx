import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Sample travel posts data
const TRAVEL_POSTS = [
  {
    id: 1,
    username: 'wanderlust_sarah',
    location: 'Santorini, Greece',
    imageUrl: '🌅',
    likes: 1234,
    caption: 'Watching the sunset in Oia never gets old! The white-washed buildings and blue domes create the most magical backdrop.',
    timeAgo: '2h ago',
  },
  {
    id: 2,
    username: 'adventure_mike',
    location: 'Tokyo, Japan',
    imageUrl: '🏯',
    likes: 892,
    caption: 'Exploring the ancient temples of Asakusa. The blend of traditional and modern culture here is incredible!',
    timeAgo: '5h ago',
  },
  {
    id: 3,
    username: 'travel_emma',
    location: 'Bali, Indonesia',
    imageUrl: '🌴',
    likes: 2156,
    caption: 'Found paradise at Tegalalang Rice Terraces. The lush green landscapes are breathtaking!',
    timeAgo: '1d ago',
  },
  {
    id: 4,
    username: 'globe_trotter_james',
    location: 'Paris, France',
    imageUrl: '🗼',
    likes: 1567,
    caption: 'Eiffel Tower sparkling at night. Paris truly is the city of lights! ✨',
    timeAgo: '1d ago',
  },
];

function TravelPost({ post }: { post: typeof TRAVEL_POSTS[0] }) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemedView style={styles.postContainer}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {post.username[0].toUpperCase()}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={styles.username}>{post.username}</ThemedText>
            <ThemedText style={styles.location}>{post.location}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.moreIcon}>⋯</ThemedText>
      </View>

      {/* Image placeholder */}
      <View style={styles.imageContainer}>
        <ThemedText style={styles.imageEmoji}>{post.imageUrl}</ThemedText>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionIcon}>❤️</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionIcon}>💬</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionIcon}>📤</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <ThemedText style={styles.actionIcon}>🔖</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <ThemedText style={styles.likes}>{post.likes.toLocaleString()} likes</ThemedText>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <ThemedText>
          <ThemedText style={styles.username}>{post.username}</ThemedText>{' '}
          <ThemedText style={styles.caption}>{post.caption}</ThemedText>
        </ThemedText>
      </View>

      {/* Time */}
      <ThemedText style={styles.timeAgo}>{post.timeAgo}</ThemedText>
    </ThemedView>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>WeTravel</ThemedText>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <ThemedText style={styles.iconText}>➕</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <ThemedText style={styles.iconText}>🔔</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {TRAVEL_POSTS.map((post) => (
          <TravelPost key={post.id} post={post} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  iconText: {
    fontSize: 24,
  },
  feed: {
    flex: 1,
  },
  postContainer: {
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
  },
  location: {
    fontSize: 12,
    opacity: 0.6,
  },
  moreIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEmoji: {
    fontSize: 120,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  likes: {
    paddingHorizontal: 16,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeAgo: {
    paddingHorizontal: 16,
    fontSize: 12,
    opacity: 0.5,
  },
});
import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Colors } from './theme';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react-native';

// Sample data mapping to your SQL schema (users + posts)
const TRAVEL_POSTS = [
  { id: '1', username: 'wanderlust_sarah', location: 'Santorini, Greece', caption: 'Sunset in Oia...', likes: 1234 },
  { id: '2', username: 'adventure_mike', location: 'Tokyo, Japan', caption: 'Exploring Asakusa...', likes: 892 }
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {TRAVEL_POSTS.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.header}>
            <View style={styles.avatar} />
            <View>
              <View style={styles.username}>{post.username}</View>
              <View style={styles.location}>{post.location}</View>
            </View>
          </View>
          <View style={styles.mediaPlaceholder} />
          <View style={styles.actions}>
            <Heart color={Colors.light.text} size={24} />
            <MessageCircle color={Colors.light.text} size={24} />
            <Send color={Colors.light.text} size={24} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  postCard: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  header: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  avatar: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: Colors.light.primary, marginRight: 10 },
  username: { fontWeight: 'bold', color: Colors.light.text },
  location: { fontSize: 12, color: Colors.light.icon },
  mediaPlaceholder: { width: '100%', height: 300, backgroundColor: Colors.light.secondary },
  actions: { flexDirection: 'row', gap: 15, padding: 12 }
});
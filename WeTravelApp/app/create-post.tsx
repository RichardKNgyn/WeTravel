import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { usePosts } from '@/hooks/use-posts';

const MAX_IMAGES = 6;

export default function CreatePostScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { addPost } = usePosts();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  // Animation for the post button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const theme = {
    bg: isDark ? '#0f0f0f' : '#fafaf8',
    card: isDark ? '#1a1a1a' : '#ffffff',
    text: isDark ? '#f0ede8' : '#1a1714',
    subtext: isDark ? '#888' : '#888',
    border: isDark ? '#2a2a2a' : '#e8e4de',
    accent: '#e07b54',
    accentLight: isDark ? '#2d1a12' : '#fdf0ea',
    inputBg: isDark ? '#141414' : '#f5f2ee',
    placeholder: isDark ? '#555' : '#bbb',
  };

  const pickFromGallery = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Max images', `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
    }
  };

  const pickFromCamera = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Max images', `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please add a title for your post.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('No images', 'Please add at least one photo.');
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setIsPosting(true);

    // Simulate async post (replace with real API call)
    await new Promise((res) => setTimeout(res, 1200));

    addPost({
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      images,
      author: 'You',
      createdAt: new Date().toISOString(),
      likes: 0,
    });

    setIsPosting(false);
    router.back();
  };

  const canPost = title.trim().length > 0 && images.length > 0 && !isPosting;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: theme.subtext }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New Post</Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost}
            style={[
              styles.postBtn,
              {
                backgroundColor: canPost ? theme.accent : theme.border,
              },
            ]}>
            {isPosting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.postBtnText, { color: canPost ? '#fff' : theme.subtext }]}>
                Share
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Image Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>
            PHOTOS ({images.length}/{MAX_IMAGES})
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageRow}>
            {/* Add photo buttons */}
            <TouchableOpacity
              style={[styles.addImageBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
              onPress={pickFromGallery}>
              <Text style={styles.addImageIcon}>🖼️</Text>
              <Text style={[styles.addImageLabel, { color: theme.subtext }]}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addImageBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
              onPress={pickFromCamera}>
              <Text style={styles.addImageIcon}>📷</Text>
              <Text style={[styles.addImageLabel, { color: theme.subtext }]}>Camera</Text>
            </TouchableOpacity>

            {/* Image thumbnails */}
            {images.map((uri, index) => (
              <View key={uri + index} style={styles.thumbContainer}>
                <Image source={{ uri }} style={styles.thumb} />
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {images.length === 0 && (
            <View style={[styles.emptyImages, { backgroundColor: theme.accentLight, borderColor: theme.accent }]}>
              <Text style={styles.emptyImagesIcon}>🌍</Text>
              <Text style={[styles.emptyImagesText, { color: theme.accent }]}>
                Add photos of your travel experience
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>TITLE *</Text>
          <TextInput
            style={[styles.input, styles.titleInput, {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.border,
            }]}
            placeholder="Where did you go?"
            placeholderTextColor={theme.placeholder}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            returnKeyType="next"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>LOCATION</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.border,
            }]}
            placeholder="City, Country"
            placeholderTextColor={theme.placeholder}
            value={location}
            onChangeText={setLocation}
            maxLength={60}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.descInput, {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.border,
            }]}
            placeholder="Tell the story of your trip..."
            placeholderTextColor={theme.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: theme.placeholder }]}>
            {description.length}/500
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 70,
  },
  headerBtnText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'normal',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  postBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    width: 70,
    alignItems: 'center',
  },
  postBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageIcon: {
    fontSize: 22,
  },
  addImageLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  thumbContainer: {
    position: 'relative',
    width: 90,
    height: 90,
  },
  thumb: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#ddd',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coverBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyImages: {
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyImagesIcon: {
    fontSize: 32,
  },
  emptyImagesText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
  },
  descInput: {
    height: 130,
    paddingTop: 13,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 6,
  },
});
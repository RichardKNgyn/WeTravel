import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePosts } from "@/hooks/use-posts";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const MAX_IMAGES = 6;

export default function CreatePostScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const { addPost } = usePosts();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const theme = {
    bg: isDark ? "#0f0f0f" : "#fafaf8",
    text: isDark ? "#f0ede8" : "#1a1714",
    subtext: "#888",
    border: isDark ? "#2a2a2a" : "#e8e4de",
    accent: "#e07b54",
    inputBg: isDark ? "#141414" : "#f5f2ee",
    placeholder: isDark ? "#555" : "#bbb",
  };

  const pickFromGallery = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Max images", `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access.");
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

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please add a title.");
      return;
    }

    if (images.length === 0) {
      Alert.alert("No images", "Add at least one photo.");
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    setIsPosting(true);

    await new Promise((res) => setTimeout(res, 800));

    addPost({
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      images,
      author: "You",
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [], // IMPORTANT — keep this
    });

    setIsPosting(false);
    router.back();
  };

  const canPost =
    title.trim().length > 0 && images.length > 0 && !isPosting;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.subtext }}>Cancel</Text>
        </TouchableOpacity>

        <Text style={{ color: theme.text, fontWeight: "700" }}>
          New Post
        </Text>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            disabled={!canPost}
            onPress={handlePost}
            style={[
              styles.postBtn,
              {
                backgroundColor: canPost
                  ? theme.accent
                  : theme.border,
              },
            ]}
          >
            {isPosting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff" }}>Share</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView style={{ padding: 20 }}>
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 120 }]}
          multiline
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  postBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
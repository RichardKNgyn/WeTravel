import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePosts, type Post } from "../../hooks/use-posts";
import { theme } from "../../constants/theme";
import { LOCATION_COORDS } from "../../data/location-coords";

const GLOBE_ID = "wetravel-globe";

type LocationPoint = {
  name: string;
  lat: number;
  lng: number;
  weight: number;
  posts: Post[];
};

export default function Search() {
  const { posts } = usePosts();
  const [query, setQuery] = useState("");
  const [globeReady, setGlobeReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const globeRef = useRef<any>(null);
  const onMarkerClickRef = useRef<(loc: LocationPoint) => void>(() => {});

  onMarkerClickRef.current = (loc: LocationPoint) => {
    setSelectedLocation(loc);
  };

  useEffect(() => {
    Animated.spring(panelAnim, {
      toValue: selectedLocation ? 1 : 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [selectedLocation]);

  const locationData = useMemo<LocationPoint[]>(() => {
    const acc: Record<string, LocationPoint> = {};
    for (const post of posts) {
      if (!post.location) continue;
      const key = post.location.toLowerCase();
      const coords = LOCATION_COORDS[key];
      if (!coords) continue;
      if (!acc[key]) {
        acc[key] = { name: post.location, lat: coords[0], lng: coords[1], weight: 0, posts: [] };
      }
      acc[key].weight += post.likes + post.comments.length * 3;
      acc[key].posts.push(post);
    }
    return Object.values(acc);
  }, [posts]);

  const filteredData = useMemo<LocationPoint[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locationData;
    return locationData.filter((d) => d.name.toLowerCase().includes(q));
  }, [locationData, query]);

  // Load Globe.gl and initialize the 3D globe
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const loadScript = (id: string, src: string): Promise<void> =>
      new Promise((resolve) => {
        if (document.getElementById(id)) { resolve(); return; }
        const s = document.createElement("script");
        s.id = id;
        s.src = src;
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

    const init = async () => {
      await loadScript("globe-gl", "https://unpkg.com/globe.gl/dist/globe.gl.min.js");

      requestAnimationFrame(() => {
        const el = document.getElementById(GLOBE_ID);
        if (!el || globeRef.current) return;

        const Globe = (window as any).Globe;
        if (!Globe) return;

        const globe = Globe()(el);
        globe
          .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
          .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
          .backgroundImageUrl("https://unpkg.com/three-globe/example/img/night-sky.png")
          .showAtmosphere(true)
          .atmosphereColor("#4a90d9")
          .atmosphereAltitude(0.18);

        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.35;
        globe.controls().enableZoom = true;
        globe.controls().minDistance = 150;
        globe.controls().maxDistance = 800;

        globeRef.current = globe;
        setGlobeReady(true);
      });
    };

    init();

    return () => {
      if (globeRef.current) {
        globeRef.current = null;
        setGlobeReady(false);
      }
    };
  }, []);

  // Update globe points whenever filtered data changes
  useEffect(() => {
    if (!globeReady || Platform.OS !== "web") return;
    const globe = globeRef.current;
    if (!globe) return;

    const maxWeight = Math.max(...filteredData.map((d) => d.weight), 1);

    globe
      .pointsData(filteredData)
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude((d: LocationPoint) => 0.015 + (d.weight / maxWeight) * 0.055)
      .pointRadius((d: LocationPoint) => 0.35 + (d.weight / maxWeight) * 0.7)
      .pointColor(() => "#e07b54")
      .pointLabel((d: LocationPoint) =>
        `<div style="color:#fff;font-weight:700;font-size:13px;background:rgba(0,0,0,0.75);padding:5px 10px;border-radius:8px;border:1px solid rgba(224,123,84,0.5)">${d.name}</div>`
      )
      .onPointClick((d: any) => {
        onMarkerClickRef.current(d as LocationPoint);
        if (globeRef.current) {
          globeRef.current.controls().autoRotate = false;
          setTimeout(() => {
            if (globeRef.current) globeRef.current.controls().autoRotate = true;
          }, 5000);
        }
      });
  }, [filteredData, globeReady]);

  if (Platform.OS !== "web") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Globe view is available on web</Text>
        </View>
      </SafeAreaView>
    );
  }

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.globeWrapper}>
        {/* Globe canvas */}
        <View nativeID={GLOBE_ID} style={styles.globe} />

        {/* Search bar */}
        <View style={styles.searchBox}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.7)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search destinations..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Backdrop — tap outside panel to dismiss */}
        {selectedLocation && (
          <Pressable style={styles.backdrop} onPress={() => setSelectedLocation(null)} />
        )}

        {/* Slide-up location panel */}
        <Animated.View
          style={[styles.panel, { transform: [{ translateY: panelTranslateY }] }]}
          pointerEvents={selectedLocation ? "auto" : "none"}
        >
          {selectedLocation && (
            <>
              <View style={styles.panelHandle} />

              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>{selectedLocation.name}</Text>
                  <Text style={styles.panelSub}>
                    {selectedLocation.posts.length} post{selectedLocation.posts.length !== 1 ? "s" : ""} · {selectedLocation.weight} engagement
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedLocation(null)} hitSlop={12}>
                  <Ionicons name="close" size={22} color={theme.colors.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
                {[...selectedLocation.posts]
                  .sort((a, b) => b.likes - a.likes)
                  .map((post) => (
                    <View key={post.id} style={styles.postCard}>
                      {/* Post header */}
                      <View style={styles.postMeta}>
                        <View style={styles.postAvatar}>
                          <Text style={styles.postAvatarText}>
                            {(post.author || "?")[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.postAuthor}>{post.author}</Text>
                          <Text style={styles.postTitle}>{post.title}</Text>
                        </View>
                        <View style={styles.postStats}>
                          <Text style={styles.postStat}>❤️ {post.likes}</Text>
                          <Text style={styles.postStat}>💬 {post.comments.length}</Text>
                        </View>
                      </View>

                      {/* Post body */}
                      {post.description ? (
                        <Text style={styles.postContent}>{post.description}</Text>
                      ) : null}

                      {/* Comments */}
                      {post.comments.length > 0 && (
                        <View style={styles.commentsSection}>
                          {post.comments.map((c, i) => (
                            <View key={i} style={styles.commentRow}>
                              <Text style={styles.commentAuthor}>{c.user}</Text>
                              <Text style={styles.commentText}>{c.text}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                <View style={{ height: 24 }} />
              </ScrollView>
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#00001a" },
  globeWrapper: { flex: 1, position: "relative" } as any,
  globe: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as any,

  searchBox: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
  } as any,
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  } as any,
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    outlineWidth: 0,
    outline: "none",
  } as any,

  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1500,
  } as any,

  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
    overflow: "hidden",
  } as any,

  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  panelTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
  panelSub: { fontSize: 12, color: theme.colors.subtext, marginTop: 2 },

  panelScroll: { flex: 1 },

  postCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  postMeta: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary ?? "#e07b54",
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  postAuthor: { fontSize: 13, fontWeight: "700", color: theme.colors.text },
  postTitle: { fontSize: 12, color: theme.colors.subtext, marginTop: 1 },
  postStats: { alignItems: "flex-end", gap: 2 },
  postStat: { fontSize: 12, color: theme.colors.subtext },
  postContent: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 10,
  },

  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.07)",
    paddingTop: 8,
    gap: 6,
  },
  commentRow: { flexDirection: "row", gap: 6 },
  commentAuthor: { fontSize: 12, fontWeight: "700", color: theme.colors.text },
  commentText: { fontSize: 12, color: theme.colors.subtext, flex: 1 },

  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  fallbackText: { color: theme.colors.subtext, fontWeight: "700", fontSize: 16 },
});

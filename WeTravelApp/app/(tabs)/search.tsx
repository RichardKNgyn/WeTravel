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

const MAP_ID = "wetravel-heatmap";

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
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<any>(null);
  const heatRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  // Ref so Leaflet event handlers always see the latest callback
  const onMarkerClickRef = useRef<(loc: LocationPoint) => void>(() => {});

  // Keep the ref up-to-date
  onMarkerClickRef.current = (loc: LocationPoint) => {
    setSelectedLocation(loc);
  };

  // Animate panel in/out when selectedLocation changes
  useEffect(() => {
    Animated.spring(panelAnim, {
      toValue: selectedLocation ? 1 : 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [selectedLocation]);

  // Build location points from posts
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

  // Filter by search query
  const filteredData = useMemo<LocationPoint[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locationData;
    return locationData.filter((d) => d.name.toLowerCase().includes(q));
  }, [locationData, query]);

  // Load Leaflet and initialize map
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const injectCSS = () => {
      if (document.getElementById("leaflet-css")) return;
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    };

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
      injectCSS();
      await loadScript("leaflet-js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      await loadScript("leaflet-heat", "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js");

      const el = document.getElementById(MAP_ID);
      if (!el || mapRef.current) return;

      const L = (window as any).L;
      // Disable default zoom control so we can place it at bottom-left
      const map = L.map(el, { zoomControl: false }).setView([20, 10], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      // Place zoom controls at bottom-left, clear of the search bar
      L.control.zoom({ position: "bottomleft" }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        heatRef.current = null;
        markersRef.current = [];
        setMapReady(false);
      }
    };
  }, []);

  // Update heatmap + markers when data changes
  useEffect(() => {
    if (!mapReady || Platform.OS !== "web") return;
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (heatRef.current) map.removeLayer(heatRef.current);
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (filteredData.length === 0) return;

    const maxWeight = Math.max(...filteredData.map((d) => d.weight), 1);

    // Heatmap layer
    const heatData = filteredData.map((d) => [d.lat, d.lng, d.weight / maxWeight]);
    heatRef.current = L.heatLayer(heatData, {
      radius: 55,
      blur: 40,
      maxZoom: 8,
      gradient: { 0.3: "#ffff00", 0.6: "#ff8800", 1.0: "#ff0000" },
    }).addTo(map);

    // Markers — click opens the slide-up panel via the ref
    filteredData.forEach((d) => {
      const marker = L.circleMarker([d.lat, d.lng], {
        radius: 8,
        fillColor: "#e07b54",
        color: "#fff",
        weight: 2,
        fillOpacity: 0.95,
      })
        .addTo(map)
        .on("click", () => onMarkerClickRef.current(d));

      markersRef.current.push(marker);
    });
  }, [filteredData, mapReady]);

  if (Platform.OS !== "web") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Map view is available on web</Text>
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
      <View style={styles.mapWrapper}>
        {/* Map */}
        <View nativeID={MAP_ID} style={styles.map} />

        {/* Search bar */}
        <View style={styles.searchBox}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={theme.colors.subtext} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search destinations..."
              placeholderTextColor={theme.colors.subtext}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Popularity</Text>
          {[
            { color: "#ff0000", label: "Very Popular" },
            { color: "#ff8800", label: "Popular" },
            { color: "#ffff00", label: "Visited" },
          ].map(({ color, label }) => (
            <View key={label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{label}</Text>
            </View>
          ))}
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
              {/* Panel header */}
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
                      {post.content ? (
                        <Text style={styles.postContent}>{post.content}</Text>
                      ) : null}

                      {/* Comments */}
                      {post.comments.length > 0 && (
                        <View style={styles.commentsSection}>
                          {post.comments.map((c, i) => (
                            <View key={i} style={styles.commentRow}>
                              <Text style={styles.commentAuthor}>{c.author}</Text>
                              <Text style={styles.commentText}>{c.text}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
              </ScrollView>
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  mapWrapper: { flex: 1, position: "relative" } as any,
  map: { flex: 1 },

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
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "600",
    outlineWidth: 0,
    outline: "none",
  } as any,

  legend: {
    position: "absolute",
    bottom: 32,
    right: 16,
    zIndex: 1000,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    gap: 6,
  } as any,
  legendTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  legendLabel: { fontSize: 11, fontWeight: "600", color: theme.colors.subtext },

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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 16,
    overflow: "hidden",
  } as any,

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
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

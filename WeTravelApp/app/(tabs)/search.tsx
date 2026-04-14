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
import { CONTINENTS, COUNTRIES, type GeoLabel } from "../../data/geo-labels";

const GLOBE_ID = "wetravel-globe";

type SearchResult = {
  name: string;
  lat: number;
  lng: number;
  tier: "location" | "country" | "continent";
  postCount?: number;
};

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
  const [zoomDist, setZoomDist] = useState(500);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const globeRef = useRef<any>(null);
  const onMarkerClickRef = useRef<(loc: LocationPoint) => void>(() => {});

  onMarkerClickRef.current = (loc: LocationPoint) => {
    setSelectedLocation(loc);
  };

  // Case-insensitive lookup of any label name against post location data
  const findLocationByName = (name: string): LocationPoint | undefined =>
    locationData.find((d) => d.name.toLowerCase() === name.toLowerCase());

  // Animate the globe camera to a lat/lng position
  const flyToGlobe = (lat: number, lng: number, altitude = 2.0, duration = 1500) => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat, lng, altitude }, duration);
    setTimeout(() => {
      if (globeRef.current) globeRef.current.controls().autoRotate = true;
    }, duration + 300);
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

  // Search results span all three tiers: post locations → countries → continents
  const searchResults = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];

    locationData
      .filter((d) => d.name.toLowerCase().includes(q))
      .forEach((d) =>
        results.push({ name: d.name, lat: d.lat, lng: d.lng, tier: "location", postCount: d.posts.length })
      );

    COUNTRIES
      .filter((c) => c.name.toLowerCase().includes(q) && !results.find((r) => r.name.toLowerCase() === c.name.toLowerCase()))
      .slice(0, 6)
      .forEach((c) => results.push({ name: c.name, lat: c.lat, lng: c.lng, tier: "country" }));

    CONTINENTS
      .filter((c) => c.name.toLowerCase().includes(q) && !results.find((r) => r.name.toLowerCase() === c.name.toLowerCase()))
      .forEach((c) => results.push({ name: c.name, lat: c.lat, lng: c.lng, tier: "continent" }));

    return results.slice(0, 8);
  }, [query, locationData]);

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
        globe.controls().minDistance = 101;
        globe.controls().maxDistance = 800;

        // Update zoom distance whenever the camera moves
        globe.controls().addEventListener("change", () => {
          const cam = globe.camera();
          if (cam) setZoomDist(cam.position.length());
        });

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

  // Clear point markers — locations are shown via labels instead
  useEffect(() => {
    if (!globeReady || Platform.OS !== "web") return;
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointsData([]);
  }, [globeReady]);

  // Zoom thresholds for label tiers
  // > 320 → continents, 175–320 → countries, ≤ 175 → post locations
  const FAR = 320;
  const MID = 175;

  // Render labels based on current zoom distance (level-of-detail)
  useEffect(() => {
    if (!globeReady || Platform.OS !== "web") return;
    const globe = globeRef.current;
    if (!globe) return;

    let data: GeoLabel[];
    let dotRadius: number;
    let textSize: number;

    if (zoomDist > FAR) {
      // Far: continent names, large text
      data = CONTINENTS;
      dotRadius = 0.6;
      textSize = 1.4;
    } else if (zoomDist > MID) {
      // Mid: country names, medium text
      data = COUNTRIES;
      dotRadius = 0.4;
      textSize = 0.7;
    } else {
      // Close: post locations, sized by engagement weight
      const maxWeight = Math.max(...filteredData.map((d) => d.weight), 1);
      data = filteredData.map((d) => ({
        ...d,
        _dotRadius: 0.3 + (d.weight / maxWeight) * 0.3,
        _size: 0.5 + (d.weight / maxWeight) * 0.5,
      })) as any;
      dotRadius = 0.3;
      textSize = 0.5;
    }

    globe
      .labelsData(data)
      .labelLat("lat")
      .labelLng("lng")
      .labelText("name")
      .labelSize((d: any) => d._size ?? textSize)
      .labelColor(() => "#ffffff")
      .labelResolution(3)
      .labelDotRadius((d: any) => d._dotRadius ?? dotRadius)
      .labelDotOrientation(() => "right")
      .onLabelClick((d: any) => {
        // Match the clicked label against post locations — works at all zoom tiers
        const match = findLocationByName(d.name) ?? {
          name: d.name, lat: d.lat, lng: d.lng, weight: 0, posts: [],
        };
        onMarkerClickRef.current(match);
        if (globeRef.current) {
          globeRef.current.controls().autoRotate = false;
          setTimeout(() => {
            if (globeRef.current) globeRef.current.controls().autoRotate = true;
          }, 5000);
        }
      });
  }, [filteredData, globeReady, zoomDist]);

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

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <View style={styles.dropdown}>
            {searchResults.map((result) => (
              <Pressable key={`${result.tier}-${result.name}`} style={styles.dropdownRow}>
                <Text style={styles.dropdownIcon}>
                  {result.tier === "continent" ? "🌍" : result.tier === "country" ? "🏳️" : "📍"}
                </Text>
                <View style={styles.dropdownText}>
                  <Text style={styles.dropdownName}>{result.name}</Text>
                  <Text style={styles.dropdownSub}>{result.tier}</Text>
                </View>
                {result.postCount !== undefined && (
                  <View style={styles.dropdownBadge}>
                    <Text style={styles.dropdownBadgeText}>{result.postCount}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* Destinations legend strip — visible when no panel is open */}
        {!selectedLocation && locationData.length > 0 && (
          <View style={styles.legendStrip}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.legendContent}
            >
              {[...locationData]
                .sort((a, b) => b.posts.length - a.posts.length)
                .map((loc) => (
                  <Pressable
                    key={loc.name}
                    style={styles.legendChip}
                    onPress={() => {
                      flyToGlobe(loc.lat, loc.lng);
                      setTimeout(() => onMarkerClickRef.current(loc), 1500);
                    }}
                  >
                    <Text style={styles.legendChipName}>{loc.name}</Text>
                    <View style={styles.legendChipBadge}>
                      <Text style={styles.legendChipCount}>{loc.posts.length}</Text>
                    </View>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        )}

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
                {selectedLocation.posts.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>🌍</Text>
                    <Text style={styles.emptyStateTitle}>No posts yet</Text>
                    <Text style={styles.emptyStateMsg}>
                      Be the first to share a trip to {selectedLocation.name}!
                    </Text>
                  </View>
                )}
                {[...selectedLocation.posts]
                  .sort((a, b) => b.likes - a.likes)
                  .map((post) => (
                    <View key={post.id} style={styles.postCard}>
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

                      {post.description ? (
                        <Text style={styles.postContent}>{post.description}</Text>
                      ) : null}

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

  dropdown: {
    position: "absolute",
    top: 72,
    left: 16,
    right: 16,
    zIndex: 1100,
    backgroundColor: "rgba(10,10,30,0.92)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  } as any,
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  dropdownIcon: { fontSize: 16, width: 22, textAlign: "center" } as any,
  dropdownText: { flex: 1 },
  dropdownName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  dropdownSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
    marginTop: 1,
  } as any,
  dropdownBadge: {
    backgroundColor: "#e07b54",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dropdownBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  legendStrip: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    zIndex: 1000,
  } as any,
  legendContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    gap: 8,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  } as any,
  legendChipName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  legendChipBadge: {
    backgroundColor: "#e07b54",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  legendChipCount: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

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

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyStateIcon: { fontSize: 40 },
  emptyStateTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  emptyStateMsg: {
    fontSize: 13,
    color: theme.colors.subtext,
    textAlign: "center",
    lineHeight: 18,
  },

  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  fallbackText: { color: theme.colors.subtext, fontWeight: "700", fontSize: 16 },
});

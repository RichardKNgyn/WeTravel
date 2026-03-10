import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
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
  const mapRef = useRef<any>(null);
  const heatRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

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
      const map = L.map(el, { zoomControl: true }).setView([20, 10], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

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

    // Markers with popups
    filteredData.forEach((d) => {
      const topPost = [...d.posts].sort((a, b) => b.likes - a.likes)[0];
      const popup = `
        <div style="font-family:sans-serif;min-width:160px;max-width:220px">
          <div style="font-weight:900;font-size:14px;margin-bottom:6px">${d.name}</div>
          <div style="font-size:12px;color:#888;margin-bottom:6px">${d.posts.length} post${d.posts.length > 1 ? "s" : ""} · ${d.weight} engagement</div>
          <div style="font-weight:700;font-size:13px">${topPost.title}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">❤️ ${topPost.likes} · 💬 ${topPost.comments.length}</div>
        </div>`;

      const marker = L.circleMarker([d.lat, d.lng], {
        radius: 8,
        fillColor: "#e07b54",
        color: "#fff",
        weight: 2,
        fillOpacity: 0.95,
      }).addTo(map).bindPopup(popup);

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
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.subtext,
  },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  fallbackText: { color: theme.colors.subtext, fontWeight: "700", fontSize: 16 },
});

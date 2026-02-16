import React, { useState } from "react";
import { View, Text, StyleSheet,TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { MOCK_TRIP_DATA, TripDestination } from "../../data/mock-trips";

export default function Trips() {
  const [data, setData] = useState(MOCK_TRIP_DATA);

  const handleDelete = (id: string) => {
    const filtered = data.filter(item => item.id !== id);
    const updated = filtered.map((item, index) => ({ ...item, order_index: index }));
    setData(updated);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<TripDestination>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[styles.card, { backgroundColor: isActive ? theme.colors.muted : theme.colors.card }]}
        >
          <View style={styles.dragHandle}>
            <Ionicons name="menu-outline" size={24} color={theme.colors.subtext} />
          </View>
          
          <View style={styles.details}>
            <Text style={styles.locationName}>{item.location_name}</Text>
            <Text style={styles.time}>{item.planned_time} ({item.duration_hours}h)</Text>
          </View>

          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.container}>
          <Text style={styles.title}>My Trips</Text>
          <Text style={styles.sub}>Hold and drag to reorder your trip ✈️</Text>
          
          <DraggableFlatList
            data={data}
            onDragEnd={({ data }) => {
              const reordered = data.map((item, index) => ({ ...item, order_index: index }));
              setData(reordered);
            }}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1, padding: theme.spacing.lg },
  title: { fontSize: 22, fontWeight: "900", color: theme.colors.text },
  sub: { margin: 10, color: theme.colors.subtext, fontWeight: "700" },
  list: { paddingBottom: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dragHandle: { marginRight: 12 },
  details: { flex: 1 },
  locationName: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  time: { fontSize: 12, color: theme.colors.primary, fontWeight: "600" },
  deleteButton: { padding: 8 },
});

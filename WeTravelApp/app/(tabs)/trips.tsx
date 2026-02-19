import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { MOCK_TRIP_DATA, TripDestination } from "../../data/mock-trips";
import PrimaryButton from "../../components/PrimaryButton";
import { Picker } from "@react-native-picker/picker";

export default function Trips() {
  const [data, setData] = useState(MOCK_TRIP_DATA);
  const [editingItem, setEditingItem] = useState<TripDestination | null>(null);

  // States for time and duration pickers in the edit modal
  const [tHour, setTHour] = useState("12");
  const [tMin, setTMin] = useState("00");
  const [tPeriod, setTPeriod] = useState("AM");
  const [dHour, setDHour] = useState(0);
  const [dMin, setDMin] = useState(0);

  useEffect(() => {
    if (editingItem) {
      if (editingItem.planned_time) {
        const [time, period] = editingItem.planned_time.split(" ");
        const [h, m] = time.split(":");
        setTHour(h);
        setTMin(m);
        setTPeriod(period);
      }
      if (editingItem.duration_hours !== null && editingItem.duration_hours !== undefined) {
        setDHour(Math.floor(editingItem.duration_hours));
        setDMin((editingItem.duration_hours % 1) * 60);
      }
    }
  }, [editingItem]);  

  const handleDelete = (id: string) => {
    const filtered = data.filter(item => item.id !== id);
    const updated = filtered.map((item, index) => ({ ...item, order_index: index }));
    setData(updated);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    const updatedItem: TripDestination = {
      ...editingItem,
      planned_time: `${tHour}:${tMin} ${tPeriod}`,
      duration_hours: dHour + (dMin / 60),
    };

    const updatedData = data.map(item => item.id === updatedItem.id ? updatedItem : item);
    setData(updatedData);
    setEditingItem(null);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<TripDestination>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          onPress={() => setEditingItem(item)}
          disabled={isActive}
          style={[styles.card, { backgroundColor: isActive ? theme.colors.muted : theme.colors.card }]}
        >
          <View style={styles.dragHandle}>
            <Ionicons name="menu-outline" size={24} color={theme.colors.subtext} />
          </View>
          
          <View style={styles.details}>
            <Text style={styles.locationName}>{item.location_name}</Text>
            <Text style={styles.time}>
              {item.planned_time ? item.planned_time : "Time not set"} 
              {item.duration_hours ? ` (${item.duration_hours}h)` : ""}
            </Text>
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
          <Text style={styles.sub}>Hold and drag to reorder. Tap to edit ✈️</Text>
          
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

          <Modal visible={!!editingItem} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Schedule</Text>
                  <TouchableOpacity onPress={() => setEditingItem(null)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.label}>Planned Arrival</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={tHour}
                      style={styles.picker}
                      onValueChange={(val) => setTHour(val)}>
                      {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                        <Picker.Item key={h} label={h} value={h} />
                      ))}
                    </Picker>
                    <Picker
                      selectedValue={tMin}
                      style={styles.picker}
                      onValueChange={(val) => setTMin(val)}>
                      {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                        <Picker.Item key={m} label={m} value={m} />
                      ))}
                    </Picker>
                    <Picker
                      selectedValue={tPeriod}
                      style={styles.picker}
                      onValueChange={(val) => setTPeriod(val)}>
                      <Picker.Item label="AM" value="AM" />
                      <Picker.Item label="PM" value="PM" />
                    </Picker>
                  </View>

                  <Text style={styles.label}>Duration</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={dHour}
                      style={styles.picker}
                      onValueChange={(val) => setDHour(val)}>
                      {Array.from({ length: 25 }, (_, i) => i).map(h => (
                        <Picker.Item key={h} label={`${h}h`} value={h} />
                      ))}
                    </Picker>
                    <Picker
                      selectedValue={dMin}
                      style={styles.picker}
                      onValueChange={(val) => setDMin(val)}>
                      <Picker.Item label="00m" value={0} />
                      <Picker.Item label="30m" value={30} />
                    </Picker>
                  </View>

                  <Text style={styles.label}>Personal Notes</Text>
                  <TextInput 
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    multiline
                    value={editingItem?.note || ""}
                    onChangeText={(text) => setEditingItem(prev => prev ? {...prev, note: text} : null)}
                    placeholder="Things to do, see, or eat..."
                  />

                  <PrimaryButton title="Save Changes" onPress={handleUpdateItem} style={{ marginTop: 20, marginBottom: 40 }} />
                </ScrollView>
              </View>
            </View>
          </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.subtext,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
    height: 60,
  },
});

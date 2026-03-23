import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../../components/PrimaryButton";
import { theme } from "../../constants/theme";
import { MOCK_TRIP_DATA, TripDestination } from "../../data/mock-trips";
import { useNetwork } from '../../hooks/use-network';
import { initDB, getTrips, saveTrip, deleteTrip, saveAllTrips} from '../../hooks/use-offline-db';

export const NATIVE_MAPS_KEY = Platform.select({
  // Application Restricted keys for use in map tab (inlcude only Maps SDK for iOS/Android/Web)
  ios: process.env.EXPO_PUBLIC_IOS_MAPS_KEY,
  android: process.env.EXPO_PUBLIC_ANDROID_MAPS_KEY,
  default: process.env.EXPO_PUBLIC_WEB_MAPS_KEY, 
});

// API Restricted key for use in GooglePlacesAutocomplete (include Places API, Geocoding API, and Distance Matrix API)
export const TRIPS_KEY = process.env.EXPO_PUBLIC_TRIPS_KEY;

export default function Trips() {
  const { isOnline } = useNetwork();
  const [data, setData] = useState<TripDestination[]>([]);
  const [editingItem, setEditingItem] = useState<TripDestination | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<{ item: TripDestination; index: number } | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for time and duration pickers in the edit modal
  const [tHour, setTHour] = useState("12");
  const [tMin, setTMin] = useState("00");
  const [tPeriod, setTPeriod] = useState("AM");
  const [dHour, setDHour] = useState(0);
  const [dMin, setDMin] = useState(0);

  // Initialize DB and load trips from local storage on app start
  useEffect(() => {
    const setup = async () => {
      await initDB();
      const savedTrips = await getTrips();
      
      // If DB is empty, load mock data for the first time
      if (savedTrips.length === 0 && MOCK_TRIP_DATA.length > 0) {
        setData(MOCK_TRIP_DATA);
        await saveAllTrips(MOCK_TRIP_DATA as any);
      } else {
        setData(savedTrips as any);
      }
    };
    setup();
  }, []);

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

  const handleAddManualTrip = async (details: any) => {
    const newEntry: TripDestination = {
      id: Date.now().toString(),
      // Use the Place Name if it's a business, otherwise fallback to address
      location_name: details.name || details.formatted_address,
      address: details.formatted_address,
      location_place_id: details.place_id,
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      order_index: data.length,
      status: 'Pending',
      note: "",
      planned_time: null,
      duration_hours: null,
    };

    const updatedData = [...data, newEntry];
    setData(updatedData);
    await saveTrip(newEntry as any);
    setIsSearchVisible(false);
  };

  const handleDelete = async (id: string) => {
    const indexToDelete = data.findIndex(item => item.id === id);
    if (indexToDelete === -1) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    const itemToDelete = data[indexToDelete];
    setLastDeleted({ item: itemToDelete, index: indexToDelete });
    
    const newData = data.filter(item => item.id !== id);
    const updated = newData.map((item, index) => ({ ...item, order_index: index }));
    setData(updated);
    await deleteTrip(id);
    await saveAllTrips(updated as any);
    
    setShowUndo(true);
    undoTimerRef.current = setTimeout(() => {
      setShowUndo(false);
      setLastDeleted(null);
    }, 4000);
  };

  const handleUndo = async () => {
    if (!lastDeleted) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    const newData = [...data];
    newData.splice(lastDeleted.index, 0, lastDeleted.item);
    const restored = newData.map((item, index) => ({ ...item, order_index: index }));
    setData(restored);
    await saveAllTrips(restored as any);
    
    setShowUndo(false);
    setLastDeleted(null);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    const updatedItem: TripDestination = {
      ...editingItem,
      planned_time: `${tHour}:${tMin} ${tPeriod}`,
      duration_hours: dHour + (dMin / 60),
    };

    const updatedData = data.map(item => item.id === updatedItem.id ? updatedItem : item);
    setData(updatedData);
    await saveTrip(updatedItem as any);
    setEditingItem(null);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<TripDestination>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          onPress={() => setEditingItem(item)}
          disabled={isActive}
          style={[styles.card, { backgroundColor: isActive ? theme.colors.muted : theme.colors.white }]}
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
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderFooter = () => (
    <TouchableOpacity 
      style={styles.addCard} 
      onPress={() => setIsSearchVisible(true)}
      activeOpacity={0.7}
    >
      <Ionicons name="add" size={24} color={theme.colors.primary} style={{ marginRight: 8 }} />
      <Text style={styles.addText}>Add Destination</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.container}>
      {!isOnline && (
        <View style={{ backgroundColor: '#FFC107', padding: 10, alignItems: 'center' }}>
          <Text style={{ color: '#000', fontWeight: '600' }}>You are offline — showing saved trips</Text>
        </View>
      )}
          <Text style={styles.title}>My Trips</Text>
          <Text style={styles.sub}>Hold and drag to reorder. Tap to edit ✈️</Text>
          
          <DraggableFlatList
            data={data}
            onDragEnd={ async ({ data }) => {
              const reordered = data.map((item, index) => ({ ...item, order_index: index }));
              setData(reordered);
              await saveAllTrips(reordered as any);
            }}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.list}
          />

          {showUndo && (
            <View style={styles.undoContainer}>
              <Text style={styles.undoText}>Destination deleted</Text>
              <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
                <Text style={styles.undoButtonText}>UNDO</Text>
              </TouchableOpacity>
            </View>
          )}

          <Modal visible={isSearchVisible} animationType="fade">
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
              <View style={styles.searchHeader}>
                <TouchableOpacity onPress={() => setIsSearchVisible(false)}>
                  <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.searchTitle}>Add Destination</Text>
                <View style={{ width: 28 }} />
              </View>
              
              <GooglePlacesAutocomplete
                placeholder='Search for a place...'
                fetchDetails={true}
                onPress={(data, details = null) => {
                  if (details) handleAddManualTrip(details);
                }}
                debounce ={400}
                onFail={(error) => console.error("Google Places Error: ", error)}
                query={{
                  key: TRIPS_KEY,
                  language: 'en',
                }}
                styles={{
                  textInputContainer: styles.searchInputContainer,
                  textInput: styles.searchInput,
                }}
              />
            </SafeAreaView>
          </Modal>

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
                  <Text style={styles.label}>Destination Name</Text>
                  <TextInput 
                    style={styles.input}
                    value={editingItem?.location_name || ""}
                    onChangeText={(text) => setEditingItem(prev => prev ? {...prev, location_name: text} : null)}
                    placeholder="Enter destination name"
                  />
                  <Text style={styles.label}>Address</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: theme.colors.muted, color: theme.colors.subtext }]}
                    value={editingItem?.address || "No address provided"}
                    editable={false}
                    multiline
                  />
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
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: 70,
  },
  addText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
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
  undoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#323232',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  undoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  undoButton: {
    paddingHorizontal: 8,
  },
  undoButtonText: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 14,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  searchInputContainer: {
    backgroundColor: theme.colors.muted,
    marginHorizontal: 15,
    borderRadius: 10,
  },
  searchInput: {
    height: 45,
    color: theme.colors.text,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
});

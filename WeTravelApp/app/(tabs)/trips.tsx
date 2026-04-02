import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../../components/PrimaryButton";
import { theme } from "../../constants/theme";
import { MOCK_TRIP_DATA, TripDestination } from "../../data/mock-trips";
import { useNetwork } from '../../hooks/use-network';
import { initDB, getTrips, saveTrip, deleteTrip, saveAllTrips, saveFullItinerary, getItineraries, getSavedDestinations, deleteFullItinerary, Itinerary, clearActiveTrips} from '../../hooks/use-offline-db';

export const NATIVE_MAPS_KEY = Platform.select({
  // Application Restricted keys for use in map tab (include only Maps SDK for iOS/Android/Web)
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
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [itineraryName, setItineraryName] = useState("");
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
  const [confirmReplaceVisible, setConfirmReplaceVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [webQuery, setWebQuery] = useState("");
  const [webResults, setWebResults] = useState<any[]>([]);
  const swipeableRefs = useRef(new Map<string, any>()).current;
  const currentlyOpenId = useRef<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setData(MOCK_TRIP_DATA as any);
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

  const closeAnyOpenSwipeable = () => {
    if (currentlyOpenId.current) {
      const node = swipeableRefs.get(currentlyOpenId.current);
      if (node) node.close();
      currentlyOpenId.current = null;
    }
  };

  const handleAddManualTrip = async (details: any) => {
    const newEntry: TripDestination = {
      id: Date.now().toString(),
      // Use the Place Name if it's a business, otherwise fallback to address
      location_name: details.name || details.formatted_address,
      address: details.formatted_address,
      location_place_id: details.place_id,
      latitude: details.geometry?.location?.lat || 0,
      longitude: details.geometry?.location?.lng || 0,
      order_index: data.length,
      status: 'Pending',
      note: "",
      planned_time: null,
      duration_hours: null,
    };

    const updatedData = [...data, newEntry];
    setData(updatedData);
    setIsUnsaved(true);
    await saveTrip(newEntry as any);
    setIsSearchVisible(false);
  };

  const handleDelete = async (id: string) => {
    closeAnyOpenSwipeable();
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
    setIsUnsaved(true);
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
    setIsUnsaved(true);
    await saveTrip(updatedItem as any);
    setEditingItem(null);
  };

  const handleSaveInitiate = async () => {
    if (!itineraryName.trim()) return;

    const list = await getItineraries();
    setSavedItineraries(list);

    const existing = list.find(it => it.name.trim().toLowerCase() === itineraryName.trim().toLowerCase());
    
    if (existing) {
      setSaveModalVisible(false);
      setConfirmReplaceVisible(true);
    } else {
      await executeSave();
    }
  };

  const executeSave = async () => {
    if (data.length === 0) return;
    try {
      await saveFullItinerary(itineraryName.trim(), data as any);
      setIsUnsaved(false);
      setSaveModalVisible(false);
      setConfirmReplaceVisible(false);
      setItineraryName("");
      const list = await getItineraries();
      setSavedItineraries(list);
      setSuccessVisible(true);
    } catch (e: any) {
      alert("Save Failed: " + e.message);
    }
  };

  const handleReplace = async () => {
    const existing = savedItineraries.find(it => it.name.trim().toLowerCase() === itineraryName.trim().toLowerCase());
    if (existing) {
      await deleteFullItinerary(existing.id);
    }
    await executeSave();
  };

  const openLoadManager = async () => {
    if (isUnsaved && data.length > 0) {
      setConflictModalVisible(true);
    } else {
      const list = await getItineraries();
      setSavedItineraries(list);
      setLoadModalVisible(true);
    }
  };

  const performLoad = async (id: string) => {
    const loadedDestinations = await getSavedDestinations(id);
    await clearActiveTrips();
    await saveAllTrips(loadedDestinations as any);
    setData(loadedDestinations as any);
    setIsUnsaved(false);
    setLoadModalVisible(false);
  };

  const handleDeleteItinerary = (id: string) => {
    setDeletingId(id);
    setConfirmDeleteVisible(true);
  };

  const executeDelete = async () => {
    if (deletingId) {
      await deleteFullItinerary(deletingId);
      const list = await getItineraries();
      setSavedItineraries(list);
    }
    setConfirmDeleteVisible(false);
    setDeletingId(null);
  };

  const handleClearActiveTrip = async () => {
    setData([]);
    setIsUnsaved(false);
    await clearActiveTrips();
  };

  const renderRightActions = (prog: SharedValue<number>, drag: SharedValue<number>, swp: any, id: string) => (
    <TouchableOpacity style={styles.swipeDeleteAction} onPress={() => { swp.close(); handleDelete(id); }}>
      <Ionicons name="trash" size={28} color="#FFF" />
    </TouchableOpacity>
  );

  const renderWebActions = (item: TripDestination) => (
    <View style={{ flexDirection: 'row', gap: 15, paddingHorizontal: 10 }}>
      <TouchableOpacity onPress={() => setEditingItem(item)} style={{ padding: 5 }}>
        <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 5 }}>
        <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<TripDestination>) => {
    const isWeb = Platform.OS === 'web';

    const CardContent = (
      <ScaleDecorator>
        <TouchableOpacity
          onPressIn={() => { closeAnyOpenSwipeable(); if (isWeb) drag(); }}
          onLongPress={isWeb ? undefined : drag}
          onPress={() => { closeAnyOpenSwipeable(); if (!isWeb) setEditingItem(item); }}
          disabled={isActive}
          style={[
            styles.card, 
            { backgroundColor: isActive ? theme.colors.muted : theme.colors.white },
            isWeb && ({ cursor: isActive ? 'grabbing' : 'grab' } as any)
          ]}
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

          {isWeb ? renderWebActions(item) : null}
        </TouchableOpacity>
      </ScaleDecorator>
    );

    if (isWeb) {
      return <View style={{ marginBottom: theme.spacing.sm }}>{CardContent}</View>;
    }

    return (
      <View style={{ marginBottom: theme.spacing.sm }}>
        <ReanimatedSwipeable
          ref={((ref: any) => {
            if (ref) swipeableRefs.set(item.id, ref);
            else swipeableRefs.delete(item.id);
          }) as any}
          onSwipeableWillOpen={() => {
            if (currentlyOpenId.current && currentlyOpenId.current !== item.id) {
              const previousNode = swipeableRefs.get(currentlyOpenId.current);
              if (previousNode) previousNode.close();
            }
            currentlyOpenId.current = item.id;
          }}
          renderRightActions={(p, d, s) => renderRightActions(p, d, s, item.id)}
          friction={2}
          rightThreshold={40}
          overshootRight={false}
        >
          {CardContent}
        </ReanimatedSwipeable>
      </View>
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
        <View style={styles.container} onTouchStart={closeAnyOpenSwipeable}>
          {!isOnline && (
            <View style={{ backgroundColor: '#FFC107', padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#000', fontWeight: '600' }}>You are offline — showing saved trips</Text>
            </View>
          )}
          <Text style={styles.title}>My Trips</Text>
          <Text style={styles.sub}>Hold and drag to reorder. Tap to edit, Swipe to delete.</Text>
          
          <DraggableFlatList
            data={data}
            onScrollBeginDrag={closeAnyOpenSwipeable}
            onDragEnd={ async ({ data }) => {
              const reordered = data.map((item, index) => ({ ...item, order_index: index }));
              setData(reordered);
              setIsUnsaved(true);
              await saveAllTrips(reordered as any);
            }}
            activationDistance={Platform.OS === 'web' ? 1 : undefined}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListFooterComponent={renderFooter}
            contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          />

          <View style={styles.footerBar}>
            <TouchableOpacity 
              style={[styles.footerBtn, data.length === 0 && styles.btnDisabled]}
              disabled={data.length === 0}
              onPress={() => setSaveModalVisible(true)}
            >
              <Ionicons name="save-outline" size={20} color={data.length === 0 ? "#999" : theme.colors.primary} />
              <Text style={[styles.footerBtnText, data.length === 0 && {color: "#999"}]}>Save Trip</Text>
            </TouchableOpacity>

            <View style={styles.footerDivider} />

            <TouchableOpacity style={styles.footerBtn} onPress={openLoadManager}>
              <Ionicons name="folder-open-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.footerBtnText}>Load Trip</Text>
            </TouchableOpacity>
          </View>

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
              
              {Platform.OS === 'web' ? (
                <View style={{ flex: 1, padding: 15 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.white, marginBottom: 15 }]}
                    placeholder="Search for a place..."
                    value={webQuery}
                    onChangeText={(text) => {
                      setWebQuery(text);
                      
                      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                      
                      if (text.length < 3) {
                        setWebResults([]);
                        return;
                      }

                      searchTimeoutRef.current = setTimeout(async () => {
                        try {
                          const targetUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${TRIPS_KEY}`;
                          const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
                          if (!res.ok) throw new Error("Network error");
                          const json = await res.json();
                          setWebResults(json.predictions || []);
                        } catch (e) { 
                          console.error("Places API Error:", e); 
                        }
                      }, 600);
                    }}
                  />
                  <ScrollView style={{ flex: 1 }}>
                    {webResults.map((place) => (
                      <TouchableOpacity
                        key={place.place_id}
                        style={{ padding: 15, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' }}
                        onPress={async () => {
                          try {
                            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${TRIPS_KEY}`;
                            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(detailsUrl)}`);
                            if (!res.ok) throw new Error("Failed to fetch place details");
                            
                            const json = await res.json();
                            if (json.result) {
                              handleAddManualTrip(json.result);
                              setWebQuery("");
                              setWebResults([]);
                            } else {
                              alert("Could not load place details.");
                            }
                          } catch (e) {
                            console.error("Details Fetch Error:", e);
                            alert("Failed to load details. The proxy might be busy, please try again.");
                          }
                        }}
                      >
                        <Text style={{ fontWeight: 'bold' }}>{place.structured_formatting?.main_text || place.description}</Text>
                        <Text style={{ color: 'gray', fontSize: 12 }}>{place.structured_formatting?.secondary_text || ""}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <GooglePlacesAutocomplete
                  placeholder='Search for a place...'
                  fetchDetails={true}
                  onPress={(data, details = null) => {
                    if (details) handleAddManualTrip(details);
                  }}
                  debounce={400}
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
              )}
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

          <Modal visible={saveModalVisible} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}>Name your trip</Text>
                <TextInput 
                  style={[styles.input, styles.modalInput]} 
                  placeholder="e.g. Summer in Japan" 
                  value={itineraryName}
                  onChangeText={setItineraryName}
                />
                <PrimaryButton title="Confirm Save" onPress={handleSaveInitiate} style={styles.modalBtn} />
                <TouchableOpacity onPress={() => setSaveModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={confirmReplaceVisible} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}>Trip Already Exists</Text>
                <Text style={styles.alertSub}>A trip named "{itineraryName}" already exists. Do you want to replace it?</Text>
                <PrimaryButton title="Replace Trip" onPress={handleReplace} style={styles.modalBtn} />
                <TouchableOpacity onPress={() => {
                  setConfirmReplaceVisible(false);
                  setSaveModalVisible(true);
                }}>
                  <Text style={styles.cancelText}>Cancel & Rename</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={successVisible} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.alertBox}>
                <Ionicons name="checkmark-circle" size={54} color={theme.colors.primary} style={{ marginBottom: 10 }} />
                <Text style={styles.alertTitle}>Success</Text>
                <Text style={styles.alertSub}>Your trip has been saved successfully!</Text>
                <PrimaryButton title="Done" onPress={() => setSuccessVisible(false)} style={styles.modalBtn} />
              </View>
            </View>
          </Modal>

          <Modal visible={loadModalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Load Saved Trip</Text>
                  <TouchableOpacity onPress={() => setLoadModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                {savedItineraries.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={48} color={theme.colors.border} />
                    <Text style={styles.emptyText}>No saved trips found.</Text>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {savedItineraries.map((itinerary) => (
                      <View key={itinerary.id} style={styles.itineraryCardContainer}>
                        <TouchableOpacity 
                          style={styles.itineraryCard}
                          onPress={() => performLoad(itinerary.id)}
                        >
                          <View style={styles.itineraryInfo}>
                            <Text style={styles.itineraryNameText}>{itinerary.name}</Text>
                            <Text style={styles.itineraryDateText}>
                              {new Date(itinerary.created_at).toLocaleDateString()}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteItinerary(itinerary.id)}
                          style={styles.itineraryDeleteBtn}
                        >
                          <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          <Modal visible={confirmDeleteVisible} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.alertBox}>
                <Ionicons name="warning" size={48} color={theme.colors.error} style={{ marginBottom: 10 }} />
                <Text style={styles.alertTitle}>Delete Saved Trip</Text>
                <Text style={styles.alertSub}>Are you sure you want to permanently delete this saved itinerary? This action cannot be undone.</Text>
                <TouchableOpacity 
                  style={[styles.customActionBtn, { backgroundColor: theme.colors.error }]} 
                  onPress={executeDelete}
                >
                  <Text style={styles.customActionBtnText}>Delete Permanently</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setConfirmDeleteVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={conflictModalVisible} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}>Unsaved Changes</Text>
                <Text style={styles.alertSub}>Would you like to save your current trip before loading a new one?</Text>
                <PrimaryButton title="Save Current First" onPress={() => {
                  setConflictModalVisible(false);
                  setSaveModalVisible(true);
                }} style={styles.modalBtn} />
                <TouchableOpacity onPress={async () => {
                  setConflictModalVisible(false);
                  await handleClearActiveTrip();
                  const list = await getItineraries();
                  setSavedItineraries(list);
                  setLoadModalVisible(true);
                }}>
                  <Text style={styles.discardText}>Discard and Continue</Text>
                </TouchableOpacity>
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
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: Platform.OS === 'web' ? 'visible' : 'hidden',
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
  locationName: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: theme.colors.text 
  },
  time: { 
    fontSize: 12, 
    color: theme.colors.primary, 
    fontWeight: "600" },
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
    bottom: 85,
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
    zIndex: 999,
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
  footerBar: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnText: {
    marginLeft: 8,
    fontWeight: '700',
    color: theme.colors.text,
  },
  footerDivider: {
    width: 1,
    height: '60%',
    backgroundColor: theme.colors.border,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 30,
  },
  alertBox: {
    backgroundColor: '#FFF',
    borderRadius: theme.radius.lg,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    alignSelf: 'center',
  },
  alertTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    marginBottom: 15, 
    color: theme.colors.text 
  },
  modalInput: {
    width: '100%',
    marginBottom: 25,
  },
  modalBtn: {
    width: '100%',
    height: 44,
    marginBottom: 10,
  },
  customActionBtn: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  customActionBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  alertSub: { 
    textAlign: 'center', 
    color: theme.colors.subtext, 
    marginBottom: 20, 
    lineHeight: 20 
  },
  discardText: { 
    color: theme.colors.error, 
    fontWeight: '700', 
    marginTop: 15 
  },
  cancelText: { 
    color: theme.colors.subtext, 
    fontWeight: '600',
    padding: 10,
    marginTop: 5,
  },
  itineraryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.muted,
    borderRadius: 12,
    marginBottom: 10,
  },
  itineraryInfo: {
    flex: 1,
  },
  itineraryNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  itineraryDateText: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyText: {
    marginTop: 10,
    color: theme.colors.subtext,
    fontSize: 16,
  },
  itineraryCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itineraryDeleteBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteAction: {
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 79,
    borderRadius: theme.radius.md,
    paddingRight: 25,
  }
});
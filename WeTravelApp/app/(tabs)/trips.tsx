import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Linking, Alert } from "react-native";
import * as Location from 'expo-location';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../../components/PrimaryButton";
import { theme } from "../../constants/theme";
import { MOCK_TRIP_DATA, TripDestination } from "../../data/mock-trips";
import { useNetwork } from '../../hooks/use-network';
import { initDB, getTrips, saveTrip, deleteTrip, saveAllTrips, saveFullItinerary, getItineraries, getSavedDestinations, deleteFullItinerary,Itinerary, clearActiveTrips } from '../../hooks/use-offline-db';

export const NATIVE_MAPS_KEY = Platform.select({
  // Application Restricted keys for use in map tab (include only Maps SDK for iOS/Android/Web)
  ios: process.env.EXPO_PUBLIC_IOS_MAPS_KEY,
  android: process.env.EXPO_PUBLIC_ANDROID_MAPS_KEY,
  default: process.env.EXPO_PUBLIC_WEB_MAPS_KEY, 
});

// API Restricted key for use in GooglePlacesAutocomplete (include Places API, Geocoding API, and Distance Matrix API)
export const TRIPS_KEY = process.env.EXPO_PUBLIC_TRIPS_KEY;

const TripItemCard = React.memo(({ item, drag, isActive, isWeb, warning, onEdit, onDelete, onSwipeOpen, onShowWarning }: any) => {
  const swipeRef = useRef<any>(null);

  const handleWarningPress = () => {
    if (isWeb) {
      window.alert("Schedule Conflict\n\n" + warning);
    } else {
      onShowWarning(warning);
    }
  };

  const isCompleted = item.status === 'Completed';
  const isActiveStop = item.status === 'Active';

  const CardContent = (
    <ScaleDecorator>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={isWeb ? drag : undefined}
        onLongPress={isWeb ? undefined : drag}
        onPress={() => onEdit(item)}
        disabled={isActive}
        style={[
          styles.card,
          { 
            backgroundColor: isActive ? theme.colors.muted : theme.colors.white,
            transform: [{ scale: isActive ? 0.98 : 1 }],
            elevation: isActive ? 8 : 4,
            borderColor: isActiveStop ? theme.colors.primary : warning ? theme.colors.error : 'transparent', 
            borderWidth: isActiveStop ? 2 : 1.5, 
            borderLeftWidth: 5, 
            borderLeftColor: isCompleted ? theme.colors.subtext : isActiveStop ? theme.colors.primary : warning ? theme.colors.error : theme.colors.primary,
            opacity: isCompleted ? 0.6 : 1
          },
          isWeb ? ({ cursor: isActive ? 'grabbing' : 'grab' } as any) : null
        ]}
      >
        <View style={styles.dragHandle}>
          <Ionicons name="menu-outline" size={24} color={isCompleted ? theme.colors.subtext : warning ? theme.colors.error : theme.colors.subtext} />
        </View>
        
        <View style={styles.details}>
          <Text style={[styles.locationName, warning && { color: theme.colors.error }, isCompleted && { textDecorationLine: 'line-through' }]} numberOfLines={1}>
            {item.location_name || "Unknown Location"}
          </Text>
          <Text style={styles.time} numberOfLines={1}>
            {item.planned_date ? `${item.planned_date} • ` : ""}
            {item.planned_time ? item.planned_time : "Time not set"} 
            {item.duration_hours != null ? ` (${item.duration_hours}h)` : ""}
          </Text>
        </View>

        {isActiveStop && (
          <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
            <Ionicons name="navigate-circle" size={24} color={theme.colors.primary} />
          </View>
        )}

        {warning && !isCompleted && !isActiveStop && (
          <TouchableOpacity 
            style={{ paddingHorizontal: 10, justifyContent: 'center' }} 
            onPress={handleWarningPress}
            hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
          >
            <Ionicons name="warning" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        )}

        {isWeb && (
          <View style={{ flexDirection: 'row', gap: 15, paddingHorizontal: 10 }}>
            <TouchableOpacity onPress={() => onEdit(item)} style={{ padding: 5 }}>
              <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={{ padding: 5 }}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </ScaleDecorator>
  );

  if (isWeb) {
    return <View style={{ marginBottom: theme.spacing.sm }}>{CardContent}</View>;
  }

  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <ReanimatedSwipeable
        key={item.id}
        containerStyle={{ flex: 1 }}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        ref={((ref: any) => { if (ref) swipeRef.current = ref; }) as any}
        onSwipeableWillOpen={() => onSwipeOpen(item.id, swipeRef.current)}
        renderRightActions={() => (
          <TouchableOpacity 
            style={styles.swipeDeleteAction} 
            onPress={() => { 
              if (swipeRef.current) swipeRef.current.close(); 
              onDelete(item.id); 
            }}
          >
            <Ionicons name="trash" size={28} color="#FFF" />
          </TouchableOpacity>
        )}
      >
        {CardContent}
      </ReanimatedSwipeable>
    </View>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.planned_time === next.item.planned_time &&
    prev.item.planned_date === next.item.planned_date &&
    prev.item.duration_hours === next.item.duration_hours &&
    prev.item.location_name === next.item.location_name &&
    prev.item.status === next.item.status &&
    prev.warning === next.warning &&
    prev.isActive === next.isActive
  );
});

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
  const [selectedWarning, setSelectedWarning] = useState<string | null>(null); 
  const [webQuery, setWebQuery] = useState("");
  const [webResults, setWebResults] = useState<any[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pYear, setPYear] = useState(new Date().getFullYear().toString());
  const [pMonth, setPMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [pDay, setPDay] = useState(new Date().getDate().toString().padStart(2, '0'));
  const [tHour, setTHour] = useState("12");
  const [tMin, setTMin] = useState("00");
  const [tPeriod, setTPeriod] = useState("AM");
  const [dHour, setDHour] = useState(0);
  const [dMin, setDMin] = useState(0);
  const [localNote, setLocalNote] = useState("");
  const [localName, setLocalName] = useState("");

  const [logisticsWarnings, setLogisticsWarnings] = useState<Record<string, string>>({});
  const travelCache = useRef<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const swipeableRefs = useRef(new Map<string, any>());
  const currentlyOpenId = useRef<string | null>(null);

  const activeStopIndex = data.findIndex(d => d.status === 'Active');
  const firstPendingIndex = data.findIndex(d => d.status === 'Pending' || !d.status);

  const openNavigation = (dest: TripDestination) => {
    const query = encodeURIComponent(dest.address || dest.location_name || "");
    
    const url = Platform.select({
      ios: `maps://app?daddr=${query}`,
      android: `google.navigation:q=${query}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${query}`
    });
    
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported && Platform.OS !== 'web') {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(webUrl);
        }
      }).catch(() => {
        Linking.openURL(webUrl).catch(() => {}); // Silent catch to prevent any crashes
      });
    }
  };

  const recalculateSchedule = async (dataArray: TripDestination[], startIndex: number, startDateTime: Date, currentLocation?: { latitude: number, longitude: number }) => {
    let currentDateTime = new Date(startDateTime);
    const newData = [...dataArray];

    for (let i = startIndex; i < newData.length; i++) {
      const stop = newData[i];
      
      const originalTime = stop.original_planned_time !== undefined ? stop.original_planned_time : stop.planned_time;
      const originalDate = stop.original_planned_date !== undefined ? stop.original_planned_date : stop.planned_date;

      // Calculate travel time TO this stop
      let travelSeconds = 0;
      if (i === startIndex && currentLocation) {
        const cacheKey = `gps-${currentLocation.latitude},${currentLocation.longitude}-${stop.location_place_id}`;
        if (travelCache.current[cacheKey] !== undefined) {
          travelSeconds = travelCache.current[cacheKey];
        } else {
          try {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${currentLocation.latitude},${currentLocation.longitude}&destinations=place_id:${stop.location_place_id}&key=${TRIPS_KEY}`;
            const res = await fetch(Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url);
            const json = await res.json();
            travelSeconds = json.rows?.[0]?.elements?.[0]?.duration?.value || 0;
            travelCache.current[cacheKey] = travelSeconds;
          } catch (e) {
            travelSeconds = 0;
          }
        }
      } else if (i > 0) {
        const prevStop = newData[i - 1];
        const cacheKey = `${prevStop.location_place_id}-${stop.location_place_id}`;
        if (travelCache.current[cacheKey] !== undefined) {
          travelSeconds = travelCache.current[cacheKey];
        } else {
          try {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${prevStop.location_place_id}&destinations=place_id:${stop.location_place_id}&key=${TRIPS_KEY}`;
            const res = await fetch(Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url);
            const json = await res.json();
            travelSeconds = json.rows?.[0]?.elements?.[0]?.duration?.value || 0;
            travelCache.current[cacheKey] = travelSeconds;
          } catch (e) {
            travelSeconds = 0;
          }
        }
      }

      const travelMins = Math.ceil((travelSeconds || 0) / 60);
      
      // Next stop's arrival time
      const arrivalDateTime = new Date(currentDateTime.getTime() + (travelMins * 60 * 1000));
      
      const h = arrivalDateTime.getHours();
      const m = arrivalDateTime.getMinutes();
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      
      const y = arrivalDateTime.getFullYear();
      const mo = (arrivalDateTime.getMonth() + 1).toString().padStart(2, '0');
      const d = arrivalDateTime.getDate().toString().padStart(2, '0');

      newData[i] = {
        ...stop,
        planned_time: `${displayH}:${m.toString().padStart(2, '0')} ${period}`,
        planned_date: `${y}-${mo}-${d}`,
        original_planned_time: originalTime,
        original_planned_date: originalDate
      };

      const durationHours = stop.duration_hours || 0;
      
      // Next stop's start time
      currentDateTime = new Date(arrivalDateTime.getTime() + (durationHours * 3600 * 1000));
    }
    return newData;
  };

  const checkClosedWarnings = (projectedData: TripDestination[]) => {
    let closedCount = 0;
    for (let i = 0; i < projectedData.length; i++) {
      const stop = projectedData[i] as any;
      if (stop.status === 'Completed') continue;
      
      let arrivalMins = timeToMinutes(stop.planned_time);

      if (stop.opening_hours && stop.planned_date && stop.planned_time) {
        try {
          const periods = JSON.parse(stop.opening_hours);
          const [y, m, d] = stop.planned_date.split('-');
          const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
          const dayOfWeek = dateObj.getDay();
          
          const arrivalTimeStr = `${Math.floor(arrivalMins / 60).toString().padStart(2, '0')}${(arrivalMins % 60).toString().padStart(2, '0')}`;
          const arrivalTimeNum = parseInt(arrivalTimeStr, 10);

          const dayPeriods = periods.filter((p: any) => p.open.day === dayOfWeek);
          if (dayPeriods.length > 0) {
            let isOpen = false;
            let closeTimeStr = "";
            for (const p of dayPeriods) {
              const openTime = parseInt(p.open.time, 10);
              const closeTime = p.close ? parseInt(p.close.time, 10) : 2359;
              
              if (arrivalTimeNum >= openTime && arrivalTimeNum < closeTime) {
                isOpen = true;
                break;
              }
              if (arrivalTimeNum >= closeTime) {
                closeTimeStr = p.close.time;
              }
            }
            
            if (!isOpen && closeTimeStr) {
              closedCount++;
            }
          }
        } catch (e) {}
      }
    }
    return closedCount;
  };

  const handleStartTrip = async () => {
    if (isUnsaved) {
      alert("Please save your trip before starting.");
      return;
    }
    if (Object.keys(logisticsWarnings).length > 0) {
      alert("Please resolve schedule conflicts before starting.");
      return;
    }
    
    if (firstPendingIndex === -1) return;
    
    const dest = data[firstPendingIndex];
    const now = new Date();

    let currentLocation;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        currentLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      }
    } catch (e) {}

    let updatedData = await recalculateSchedule(data, firstPendingIndex, now, currentLocation);
    
    const closedCount = checkClosedWarnings(updatedData);
    if (closedCount > 0) {
      const msg = `Starting now will result in ${closedCount} destination(s) being closed when you arrive. Do you still want to start?`;
      if (Platform.OS === 'web') {
        if (!window.confirm(msg)) return;
      } else {
        Alert.alert(
          "Destinations Closed",
          msg,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Start Anyway", onPress: () => finalizeStartTrip(updatedData, dest, now) }
          ]
        );
        return;
      }
    }
    
    await finalizeStartTrip(updatedData, dest, now);
  };

  const finalizeStartTrip = async (updatedData: TripDestination[], dest: TripDestination, now: Date) => {
    updatedData[firstPendingIndex].status = 'Active';
    updatedData[firstPendingIndex].actual_arrival_time = now.toISOString();
    
    setData(updatedData);
    setIsUnsaved(true);
    await saveAllTrips(updatedData as any);
    
    openNavigation(dest);
  };

  const handleContinueTrip = async () => {
    if (activeStopIndex === -1) return;
    
    const currentStop = data[activeStopIndex];
    let updatedData = [...data];
    
    updatedData[activeStopIndex] = { ...currentStop, status: 'Completed' };
    
    const nextPendingIndex = updatedData.findIndex(d => d.status === 'Pending' || !d.status);
    
    if (nextPendingIndex !== -1) {
      const nextDest = updatedData[nextPendingIndex];
      const now = new Date();
      
      let currentLocation;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          currentLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        }
      } catch (e) {}

      let updatedDataRecalc = await recalculateSchedule(updatedData, nextPendingIndex, now, currentLocation);
      
      const closedCount = checkClosedWarnings(updatedDataRecalc);
      if (closedCount > 0) {
        const msg = `Continuing now will result in ${closedCount} destination(s) being closed when you arrive. Do you still want to continue?`;
        if (Platform.OS === 'web') {
          if (!window.confirm(msg)) return;
        } else {
          Alert.alert(
            "Destinations Closed",
            msg,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Continue Anyway", onPress: () => finalizeContinueTrip(updatedDataRecalc, nextPendingIndex, nextDest, now) }
            ]
          );
          return;
        }
      }

      await finalizeContinueTrip(updatedDataRecalc, nextPendingIndex, nextDest, now);
    } else {
      alert("Trip Completed! 🎉");
      setData(updatedData);
      setIsUnsaved(true);
      await saveAllTrips(updatedData as any);
    }
  };

  const finalizeContinueTrip = async (updatedData: TripDestination[], nextPendingIndex: number, nextDest: TripDestination, now: Date) => {
    updatedData[nextPendingIndex].status = 'Active';
    updatedData[nextPendingIndex].actual_arrival_time = now.toISOString();

    setData(updatedData);
    setIsUnsaved(true);
    await saveAllTrips(updatedData as any);
    
    openNavigation(nextDest);
  };

  const handleCancelTrip = async () => {
    const updatedData = data.map(dest => ({
      ...dest,
      status: 'Pending' as const,
      actual_arrival_time: null,
      planned_time: dest.original_planned_time || dest.planned_time,
      planned_date: dest.original_planned_date || dest.planned_date,
      original_planned_time: null,
      original_planned_date: null
    }));
    
    setData(updatedData);
    setIsUnsaved(true);
    await saveAllTrips(updatedData as any);
  };

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
      let y = new Date().getFullYear(), m = new Date().getMonth() + 1, d = new Date().getDate();
      if ((editingItem as any).planned_date) {
        const parts = (editingItem as any).planned_date.split("-");
        y = parseInt(parts[0], 10) || y;
        m = parseInt(parts[1], 10) || m;
        d = parseInt(parts[2], 10) || d;
      }
      setPYear(y.toString());
      setPMonth(m.toString().padStart(2, '0'));
      setPDay(d.toString().padStart(2, '0'));

      let h = 12, min = 0, period = "AM";
      if (editingItem.planned_time) {
        const parts = editingItem.planned_time.split(" ");
        period = parts[1] === "PM" ? "PM" : "AM";
        const timeParts = (parts[0] || "12:00").split(":");
        h = parseInt(timeParts[0], 10);
        if (isNaN(h) || h < 1 || h > 12) h = 12;
        min = parseInt(timeParts[1], 10);
        if (isNaN(min) || min < 0 || min > 59) min = 0;
      }
      setTHour(h.toString().padStart(2, '0'));
      setTMin(min.toString().padStart(2, '0'));
      setTPeriod(period);

      let dh = 0, dm = 0;
      if (editingItem.duration_hours != null) {
        dh = Math.floor(Number(editingItem.duration_hours));
        if (isNaN(dh) || dh < 0) dh = 0;
        dm = Math.round((Number(editingItem.duration_hours) % 1) * 60);
        if (isNaN(dm)) dm = 0;
        dm = dm >= 15 ? 30 : 0; 
      }
      setDHour(dh);
      setDMin(dm);
      setLocalNote(editingItem.note || "");
      setLocalName(editingItem.location_name || "");
    }
  }, [editingItem]);

  const timeToMinutes = useCallback((timeStr: string) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    if (!time) return 0;
    let [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours)) hours = 12;
    if (isNaN(minutes)) minutes = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }, []);

  useEffect(() => {
    if (!isOnline || data.length < 2 || isDragging || !!editingItem) return;

    const abortController = new AbortController();
    let isActive = true;

    const validateLogistics = async () => {
      try {
        let warnings: Record<string, string> = {};
        for (let i = 0; i < data.length - 1; i++) {
          const current = data[i] as any;
          const next = data[i + 1] as any;
          if (current.status === 'Completed') continue;
          if (!current.planned_time || !next.planned_time || current.duration_hours == null) continue;
          
          const cacheKey = `${current.location_place_id}-${next.location_place_id}`;
          let travelSeconds = travelCache.current[cacheKey];
          
          if (travelSeconds === undefined) {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${current.location_place_id}&destinations=place_id:${next.location_place_id}&key=${TRIPS_KEY}`;
            const res = await fetch(Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url, { signal: abortController.signal });
            const json = await res.json();
            travelSeconds = json.rows?.[0]?.elements?.[0]?.duration?.value || 0;
            travelCache.current[cacheKey] = travelSeconds; 
          }
          
          if (!isActive) return;
          
          const currentStartMins = timeToMinutes(current.planned_time);
          const durationMins = current.duration_hours * 60;
          const travelMins = Math.ceil(travelSeconds / 60);
          const earliestArrivalMins = currentStartMins + durationMins + travelMins;
          const nextPlannedStartMins = timeToMinutes(next.planned_time);
          
          if (nextPlannedStartMins < earliestArrivalMins) {
            const arrivalHours = Math.floor(earliestArrivalMins / 60);
            const arrivalMins = earliestArrivalMins % 60;
            const displayHours = arrivalHours % 12 || 12;
            const ampm = arrivalHours >= 12 ? 'PM' : 'AM';
            warnings[next.id] = `Based on travel time, the earliest you can arrive is ${displayHours}:${arrivalMins.toString().padStart(2, '0')} ${ampm}.`;
          }
        }

        // Check opening hours for all pending/active stops
        for (let i = 0; i < data.length; i++) {
          const stop = data[i] as any;
          if (stop.status === 'Completed') continue;
          
          let arrivalMins = timeToMinutes(stop.planned_time);

          if (stop.opening_hours && stop.planned_date && stop.planned_time) {
            try {
              const periods = JSON.parse(stop.opening_hours);
              const [y, m, d] = stop.planned_date.split('-');
              const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
              const dayOfWeek = dateObj.getDay();
              
              const arrivalTimeStr = `${Math.floor(arrivalMins / 60).toString().padStart(2, '0')}${(arrivalMins % 60).toString().padStart(2, '0')}`;
              const arrivalTimeNum = parseInt(arrivalTimeStr, 10);

              const dayPeriods = periods.filter((p: any) => p.open.day === dayOfWeek);
              if (dayPeriods.length > 0) {
                let isOpen = false;
                let closeTimeStr = "";
                for (const p of dayPeriods) {
                  const openTime = parseInt(p.open.time, 10);
                  const closeTime = p.close ? parseInt(p.close.time, 10) : 2359;
                  
                  if (arrivalTimeNum >= openTime && arrivalTimeNum < closeTime) {
                    isOpen = true;
                    break;
                  }
                  if (arrivalTimeNum >= closeTime) {
                    closeTimeStr = p.close.time;
                  }
                }
                
                if (!isOpen && closeTimeStr) {
                  const ch = parseInt(closeTimeStr.substring(0,2));
                  const cm = closeTimeStr.substring(2);
                  const formattedClose = `${ch % 12 || 12}:${cm} ${ch >= 12 ? 'PM' : 'AM'}`;
                  warnings[stop.id] = (warnings[stop.id] ? warnings[stop.id] + "\n" : "") + `Destination might be closed. It closes at ${formattedClose}.`;
                }
              }
            } catch (e) {}
          }
        }

        if (isActive) {
          setLogisticsWarnings(prev => JSON.stringify(prev) !== JSON.stringify(warnings) ? warnings : prev);
        }
      } catch (e) {
        // Silently catch aborts
      }
    };

    const timeoutId = setTimeout(validateLogistics, 500);
    return () => { 
      isActive = false; 
      clearTimeout(timeoutId); 
      abortController.abort(); 
    };
  }, [data, isOnline, isDragging, timeToMinutes, editingItem]);

  const closeAnyOpenSwipeable = useCallback(() => {
    if (currentlyOpenId.current) {
      const node = swipeableRefs.current.get(currentlyOpenId.current);
      if (node && typeof node.close === 'function') node.close();
      currentlyOpenId.current = null;
    }
  }, []);

  const handleSwipeOpen = useCallback((id: string, ref: any) => {
    if (currentlyOpenId.current && currentlyOpenId.current !== id) {
      const node = swipeableRefs.current.get(currentlyOpenId.current);
      if (node && typeof node.close === 'function') node.close();
    }
    currentlyOpenId.current = id;
    swipeableRefs.current.set(id, ref);
  }, []);

  const handleAddManualTrip = async (details: any) => {
    const newEntry: TripDestination = {
      id: Date.now().toString() + "-" + Math.floor(Math.random() * 1000).toString(),
      location_name: details.name || details.formatted_address,
      address: details.formatted_address,
      location_place_id: details.place_id,
      latitude: details.geometry?.location?.lat || 0,
      longitude: details.geometry?.location?.lng || 0,
      order_index: data.length,
      status: 'Pending',
      note: "",
      planned_date: null as any,
      planned_time: null,
      duration_hours: null,
      opening_hours: details.opening_hours ? JSON.stringify(details.opening_hours.periods) : null as any,
    };
    setData(prev => [...prev, newEntry]);
    setIsUnsaved(true);
    await saveTrip(newEntry as any);
    setIsSearchVisible(false);
  };

  const handleEdit = useCallback((item: TripDestination) => {
    closeAnyOpenSwipeable();
    setEditingItem(item);
  }, [closeAnyOpenSwipeable]);

  const handleDelete = useCallback(async (id: string) => {
    closeAnyOpenSwipeable();
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setData(prev => {
      const indexToDelete = prev.findIndex(item => item.id === id);
      if (indexToDelete === -1) return prev;
      const itemToDelete = prev[indexToDelete];
      setTimeout(() => setLastDeleted({ item: itemToDelete, index: indexToDelete }), 0);
      const newData = prev.filter(item => item.id !== id);
      const updated = newData.map((item, index) => item.order_index === index ? item : { ...item, order_index: index });
      Promise.resolve().then(async () => { 
        setIsUnsaved(true); 
        await deleteTrip(id); 
        await saveAllTrips(updated as any); 
      });
      return updated;
    });
    setShowUndo(true);
    undoTimerRef.current = setTimeout(() => { 
      setShowUndo(false); 
      setLastDeleted(null); 
    }, 4000);
  }, [closeAnyOpenSwipeable]);

  const handleUndo = async () => {
    if (!lastDeleted) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setData(prev => {
      const newData = [...prev];
      newData.splice(lastDeleted.index, 0, lastDeleted.item);
      const restored = newData.map((item, index) => item.order_index === index ? item : { ...item, order_index: index });
      Promise.resolve().then(async () => { 
        await saveAllTrips(restored as any); 
      });
      return restored;
    });
    setShowUndo(false); 
    setLastDeleted(null);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;    
    const updatedItem: TripDestination = {
      ...editingItem,
      location_name: localName,
      note: localNote,
      planned_date: `${pYear}-${pMonth}-${pDay}` as any,
      planned_time: `${tHour}:${tMin} ${tPeriod}`,
      duration_hours: dHour + (dMin / 60),
    };
    setData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setIsUnsaved(true); 
    await saveTrip(updatedItem as any); 
    setEditingItem(null);
  };

  const handleSaveInitiate = async () => {
    const trimmedName = itineraryName.trim();
    if (!trimmedName) return;

    if (Object.keys(logisticsWarnings).length > 0) {
      setSaveModalVisible(false); 
      setShowWarningBanner(true);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => setShowWarningBanner(false), 4000);
      return;
    }

    const list = await getItineraries(); 
    setSavedItineraries(list);
    
    const existing = list.find(it => (it.name || "").trim().toLowerCase() === trimmedName.toLowerCase());
    
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
    try {
      const trimmedName = itineraryName.trim();
      const list = await getItineraries();
      const existing = list.find(it => (it.name || "").trim().toLowerCase() === trimmedName.toLowerCase());
      
      if (existing) {
        await deleteFullItinerary(existing.id);
      }
      
      await executeSave();
    } catch (error: any) {
      alert("Failed to replace trip: " + error.message);
    }
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
    const resetDestinations = loadedDestinations.map(d => ({ ...d, status: 'Pending', actual_arrival_time: null }));
    await clearActiveTrips(); 
    await saveAllTrips(resetDestinations as any);
    setData(resetDestinations as any); 
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

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<TripDestination>) => {
    const isWeb = Platform.OS === 'web';
    const warning = logisticsWarnings[item.id];
    return (
      <TripItemCard
        item={item} 
        drag={drag} 
        isActive={isActive} 
        isWeb={isWeb} 
        warning={warning}
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onSwipeOpen={handleSwipeOpen}
        onShowWarning={(msg: string) => setSelectedWarning(msg)}
      />
    );
  }, [logisticsWarnings, handleEdit, handleDelete, handleSwipeOpen]);

  const renderFooter = () => (
    <TouchableOpacity style={styles.addCard} onPress={() => setIsSearchVisible(true)} activeOpacity={0.7}>
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
          
          {data.length > 0 && (
            <View style={styles.executionBanner}>
              {activeStopIndex !== -1 ? (
                <View>
                  <View style={styles.executionRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.executionTitle}>Current Stop: {data[activeStopIndex].location_name}</Text>
                      <Text style={styles.executionSub}>Tap continue when you're ready to leave.</Text>
                    </View>
                    <TouchableOpacity style={styles.executionBtn} onPress={handleContinueTrip}>
                      <Text style={styles.executionBtnText}>Continue Trip</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelTrip}>
                    <Text style={styles.cancelBtnText}>Cancel Trip</Text>
                  </TouchableOpacity>
                </View>
              ) : firstPendingIndex !== -1 ? (
                <View style={styles.executionRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.executionTitle}>Ready to explore?</Text>
                    <Text style={styles.executionSub}>Next: {data[firstPendingIndex].location_name}</Text>
                  </View>
                  <TouchableOpacity style={styles.executionBtn} onPress={handleStartTrip}>
                    <Text style={styles.executionBtnText}>Start Trip</Text>
                    <Ionicons name="navigate" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.executionRow}>
                  <Text style={styles.executionTitle}>Trip Completed! 🎉</Text>
                </View>
              )}
            </View>
          )}

          <DraggableFlatList
            data={data}
            extraData={logisticsWarnings}
            onDragBegin={() => { 
              closeAnyOpenSwipeable(); 
              setIsDragging(true); 
            }}
            onDragEnd={ async ({ data: reorderedData }) => {
              setIsDragging(false);
              const updatedData = reorderedData.map((item, index) => 
                item.order_index === index ? item : { ...item, order_index: index }
              );
              setData(updatedData); 
              setIsUnsaved(true);
              await saveAllTrips(updatedData as any);
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
          {showWarningBanner && (
            <View style={[styles.undoContainer, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.undoText}>Please fix conflicts before saving.</Text>
            </View>
          )}

          <Modal visible={!!selectedWarning} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.alertBox}>
                <Ionicons name="warning" size={54} color={theme.colors.error} style={{ marginBottom: 10 }} />
                <Text style={styles.alertTitle}>Schedule Conflict</Text>
                <Text style={styles.alertSub}>{selectedWarning}</Text>
                <PrimaryButton title="Got it" onPress={() => setSelectedWarning(null)} style={styles.modalBtn} />
              </View>
            </View>
          </Modal>

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
                          const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${TRIPS_KEY}`;
                          const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
                          const json = await res.json(); 
                          setWebResults(json.predictions || []);
                        } catch (e) { }
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
                            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,place_id,opening_hours&key=${TRIPS_KEY}`;
                            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
                            const json = await res.json(); 
                            if (json.result) { 
                              handleAddManualTrip(json.result); 
                              setWebQuery(""); 
                              setWebResults([]); 
                            }
                          } catch (e) { }
                      }}>
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
                  query={{ key: TRIPS_KEY, language: 'en' }} 
                  styles={{ textInputContainer: styles.searchInputContainer, textInput: styles.searchInput }} 
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
                    value={localName} 
                    onChangeText={setLocalName} 
                    placeholder="Enter destination name" 
                  />
                  <Text style={styles.label}>Address</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: theme.colors.muted, color: theme.colors.subtext }]} 
                    value={editingItem?.address || "No address provided"} 
                    editable={false} 
                    multiline 
                  />
                  
                  <Text style={styles.label}>Planned Date</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={pYear} style={styles.picker} onValueChange={setPYear}>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(y => (
                        <Picker.Item key={y.toString()} label={y.toString()} value={y.toString()} />
                      ))}
                    </Picker>
                    <Picker selectedValue={pMonth} style={styles.picker} onValueChange={setPMonth}>
                      {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                        <Picker.Item key={m} label={m} value={m} />
                      ))}
                    </Picker>
                    <Picker selectedValue={pDay} style={styles.picker} onValueChange={setPDay}>
                      {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                        <Picker.Item key={d} label={d} value={d} />
                      ))}
                    </Picker>
                  </View>

                  <Text style={styles.label}>Planned Arrival Time</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={tHour} style={styles.picker} onValueChange={setTHour}>
                      {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                        <Picker.Item key={h} label={h} value={h} />
                      ))}
                    </Picker>
                    <Picker selectedValue={tMin} style={styles.picker} onValueChange={setTMin}>
                      {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                        <Picker.Item key={m} label={m} value={m} />
                      ))}
                    </Picker>
                    <Picker selectedValue={tPeriod} style={styles.picker} onValueChange={setTPeriod}>
                      <Picker.Item label="AM" value="AM" />
                      <Picker.Item label="PM" value="PM" />
                    </Picker>
                  </View>

                  <Text style={styles.label}>Duration</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={dHour} style={styles.picker} onValueChange={setDHour}>
                      {Array.from({ length: 25 }, (_, i) => i).map(h => (
                        <Picker.Item key={h} label={`${h}h`} value={h} />
                      ))}
                    </Picker>
                    <Picker selectedValue={dMin} style={styles.picker} onValueChange={setDMin}>
                      <Picker.Item label="00m" value={0} />
                      <Picker.Item label="30m" value={30} />
                    </Picker>
                  </View>

                  <Text style={styles.label}>Personal Notes</Text>
                  <TextInput 
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                    multiline 
                    value={localNote} 
                    onChangeText={setLocalNote} 
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
                        <TouchableOpacity style={styles.itineraryCard} onPress={() => performLoad(itinerary.id)}>
                          <View style={styles.itineraryInfo}>
                            <Text style={styles.itineraryNameText}>{itinerary.name}</Text>
                            <Text style={styles.itineraryDateText}>{new Date(itinerary.created_at).toLocaleDateString()}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => handleDeleteItinerary(itinerary.id)} style={styles.itineraryDeleteBtn}>
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
                <TouchableOpacity style={[styles.customActionBtn, { backgroundColor: theme.colors.error }]} onPress={executeDelete}>
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
  safe: { 
    flex: 1, 
    backgroundColor: theme.colors.bg 
  },
  container: { 
    flex: 1, 
    padding: theme.spacing.lg 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "900", 
    color: theme.colors.text 
  },
  sub: { 
    margin: 10, 
    color: theme.colors.subtext, 
    fontWeight: "700" 
  },
  list: { 
    paddingBottom: 20 
  },
  card: {
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: theme.radius.md, 
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 16, 
    borderLeftColor: theme.colors.primary, 
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
    height: 70,
  },
  addText: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: theme.colors.primary 
  },
  dragHandle: { 
    marginRight: 12 
  },
  details: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  locationName: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: theme.colors.text 
  },
  time: { 
    fontSize: 12, 
    color: theme.colors.primary, 
    fontWeight: "600", 
    marginTop: 2 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    height: '70%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '900' 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: theme.colors.subtext, 
    marginBottom: 8, 
    marginTop: 15 
  },
  input: { 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16 
  },
  pickerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.colors.muted, 
    borderRadius: theme.radius.md, 
    overflow: 'hidden' 
  },
  picker: { 
    flex: 1, 
    height: 60 
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
    zIndex: 999 
  },
  undoText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  undoButton: { 
    paddingHorizontal: 8 
  },
  undoButtonText: { 
    color: theme.colors.primary, 
    fontWeight: '900', 
    fontSize: 14 
  },
  searchHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15 
  },
  searchTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: theme.colors.text 
  },
  searchInputContainer: { 
    backgroundColor: theme.colors.muted, 
    marginHorizontal: 15, 
    borderRadius: 10 
  },
  searchInput: { 
    height: 45, 
    color: theme.colors.text, 
    fontSize: 16, 
    backgroundColor: 'transparent' 
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
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  footerBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  footerBtnText: { 
    marginLeft: 8, 
    fontWeight: '700', 
    color: theme.colors.text 
  },
  footerDivider: { 
    width: 1, 
    height: '60%', 
    backgroundColor: theme.colors.border 
  },
  btnDisabled: { 
    opacity: 0.5 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    padding: 30 
  },
  alertBox: { 
    backgroundColor: '#FFF', 
    borderRadius: theme.radius.lg, 
    padding: 30, 
    alignItems: 'center', 
    width: '85%', 
    alignSelf: 'center' 
  },
  alertTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    marginBottom: 15, 
    color: theme.colors.text 
  },
  modalInput: { 
    width: '100%', 
    marginBottom: 25 
  },
  modalBtn: { 
    width: '100%', 
    height: 44, 
    marginBottom: 10 
  },
  customActionBtn: { 
    width: '100%', 
    height: 44, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  customActionBtnText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 16 
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
    marginTop: 5 
  },
  itineraryCard: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: theme.colors.muted, 
    borderRadius: 12, 
    marginBottom: 10 
  },
  itineraryInfo: { 
    flex: 1 
  },
  itineraryNameText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: theme.colors.text 
  },
  itineraryDateText: { 
    fontSize: 12, 
    color: theme.colors.subtext, 
    marginTop: 4 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingBottom: 50 
  },
  emptyText: { 
    marginTop: 10, 
    color: theme.colors.subtext, 
    fontSize: 16 
  },
  itineraryCardContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  itineraryDeleteBtn: { 
    padding: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  swipeDeleteAction: { 
    backgroundColor: theme.colors.error, 
    justifyContent: 'center', 
    alignItems: 'flex-end', 
    width: 79, 
    borderRadius: theme.radius.md, 
    paddingRight: 25 
  },
  executionBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  executionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  executionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  executionSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  executionBtn: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  executionBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: 14,
  }
});
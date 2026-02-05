import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ItineraryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Smart Itinerary</ThemedText>
      <ThemedText style={styles.subtitle}>Route Generation Prototype</ThemedText>
      <ThemedText style={styles.description}>
        This tab will organize saved locations into a navigable route.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  subtitle: {
    color: '#666',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    color: '#444',
  },
});
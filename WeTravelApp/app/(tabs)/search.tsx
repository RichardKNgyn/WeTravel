import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

export default function Search() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.sub}>Map screen goes here next 🗺️</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1, padding: theme.spacing.lg },
  title: { fontSize: 22, fontWeight: "900", color: theme.colors.text },
  sub: { marginTop: 10, color: theme.colors.subtext, fontWeight: "700" },
});

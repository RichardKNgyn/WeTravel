import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import PrimaryButton from "../../components/PrimaryButton";

export default function Create() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Create</Text>
        <Text style={styles.sub}>Upload / post flow goes here 📸</Text>

        <PrimaryButton title="Add a post" onPress={() => {}} style={{ marginTop: theme.spacing.lg }} />
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

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import PrimaryButton from "../../components/PrimaryButton";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.sub}>Account + saved trips + settings 👤</Text>

        <PrimaryButton
          title="Log out"
          onPress={() => router.replace("/(auth)/login")}
          style={{ marginTop: theme.spacing.lg }}
          variant="dark"
        />
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

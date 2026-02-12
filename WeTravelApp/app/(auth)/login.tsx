import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import TextField from "../../components/TextField";
import PrimaryButton from "../../components/PrimaryButton";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("jmph4556@gmail.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  const onNext = async () => {
    setLoading(true);
    // Fake delay to feel real
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    router.replace("/(tabs)/feed");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Log in</Text>

      <View style={styles.form}>
        <TextField
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextField
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          style={{ marginTop: theme.spacing.sm }}
        />

        <PrimaryButton
          title="NEXT"
          onPress={onNext}
          loading={loading}
          style={{ width: "100%", marginTop: theme.spacing.md }}
          variant="dark"
        />

        <View style={styles.links}>
          <Pressable onPress={() => {}}>
            <Text style={styles.link}>Forgot Password</Text>
          </Pressable>
          <Pressable onPress={() => {}}>
            <Text style={styles.link}>New User? Create Account</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footer}>WeTravel</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  form: {
    width: "100%",
  },
  links: {
    marginTop: theme.spacing.md,
    gap: 10,
    alignItems: "center",
  },
  link: {
    color: theme.colors.subtext,
    fontWeight: "700",
    fontSize: 12.5,
  },
  footer: {
    textAlign: "center",
    marginTop: theme.spacing.lg,
    color: theme.colors.subtext,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});

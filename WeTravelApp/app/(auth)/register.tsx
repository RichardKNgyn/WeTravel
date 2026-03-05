import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import TextField from "../../components/TextField";
import PrimaryButton from "../../components/PrimaryButton";

export default function Register() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onCreateAccount = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    router.replace("/(tabs)/feed");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Account</Text>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextField
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                autoCapitalize="words"
              />
            </View>
            <View style={{ width: theme.spacing.sm }} />
            <View style={{ flex: 1 }}>
              <TextField
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                autoCapitalize="words"
              />
            </View>
          </View>

          <TextField
            value={username}
            onChangeText={(t) => setUsername(t.replace(/\s/g, ""))}
            placeholder="Username"
            autoCapitalize="none"
            style={{ marginTop: theme.spacing.sm }}
          />

          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginTop: theme.spacing.sm }}
          />

          <TextField
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            style={{ marginTop: theme.spacing.sm }}
          />

          <TextField
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm Password"
            secureTextEntry
            autoCapitalize="none"
            style={{ marginTop: theme.spacing.sm }}
          />

          <PrimaryButton
            title="CREATE ACCOUNT"
            onPress={onCreateAccount}
            loading={loading}
            style={{ width: "100%", marginTop: theme.spacing.md }}
            variant="dark"
          />

          <View style={styles.links}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.link}>Already have an account? Log in</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>WeTravel</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    flexGrow: 1,
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
  row: {
    flexDirection: "row",
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

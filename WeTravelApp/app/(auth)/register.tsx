import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import TextField from "../../components/TextField";
import PrimaryButton from "../../components/PrimaryButton";
import { useUser } from "../../hooks/use-user";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const router = useRouter();
  const { setUser } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const onCreateAccount = async () => {
    let valid = true;

    if (!firstName.trim()) { setFirstNameError("First name is required."); valid = false; } else setFirstNameError("");
    if (!lastName.trim()) { setLastNameError("Last name is required."); valid = false; } else setLastNameError("");
    if (!username.trim()) { setUsernameError("Username is required."); valid = false; } else setUsernameError("");

    if (!email.trim()) {
      setEmailError("Email is required."); valid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address."); valid = false;
    } else setEmailError("");

    if (!password.trim()) { setPasswordError("Password is required."); valid = false; } else setPasswordError("");

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password."); valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match."); valid = false;
    } else setConfirmPasswordError("");

    if (!valid) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setUser({ displayName: `${firstName.trim()} ${lastName.trim()}`, username: username.trim() });
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
                onChangeText={(t) => { setFirstName(t); setFirstNameError(""); }}
                placeholder="First Name"
                autoCapitalize="words"
                error={firstNameError}
              />
            </View>
            <View style={{ width: theme.spacing.sm }} />
            <View style={{ flex: 1 }}>
              <TextField
                value={lastName}
                onChangeText={(t) => { setLastName(t); setLastNameError(""); }}
                placeholder="Last Name"
                autoCapitalize="words"
                error={lastNameError}
              />
            </View>
          </View>

          <TextField
            value={username}
            onChangeText={(t) => { setUsername(t.replace(/\s/g, "")); setUsernameError(""); }}
            placeholder="Username"
            autoCapitalize="none"
            style={{ marginTop: theme.spacing.sm }}
            error={usernameError}
          />

          <TextField
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(""); }}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginTop: theme.spacing.sm }}
            error={emailError}
          />

          <TextField
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(""); }}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            style={{ marginTop: theme.spacing.sm }}
            error={passwordError}
          />

          <TextField
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setConfirmPasswordError(""); }}
            placeholder="Confirm Password"
            secureTextEntry
            autoCapitalize="none"
            style={{ marginTop: theme.spacing.sm }}
            error={confirmPasswordError}
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

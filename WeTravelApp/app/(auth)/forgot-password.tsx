import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import TextField from "../../components/TextField";
import PrimaryButton from "../../components/PrimaryButton";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const onSend = async () => {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Forgot Password</Text>

      <View style={styles.form}>
        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              A reset link has been sent to{"\n"}<Text style={styles.successEmail}>{email}</Text>
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>

            <TextField
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailError(""); }}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginTop: theme.spacing.sm }}
              error={emailError}
            />

            <PrimaryButton
              title="SEND RESET LINK"
              onPress={onSend}
              loading={loading}
              style={{ width: "100%", marginTop: theme.spacing.md }}
              variant="dark"
            />
          </>
        )}

        <View style={styles.links}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Back to Log in</Text>
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
  subtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  form: {
    width: "100%",
  },
  successBox: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  successText: {
    fontSize: 14,
    color: theme.colors.subtext,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  successEmail: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  links: {
    marginTop: theme.spacing.md,
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

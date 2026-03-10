import React, { useEffect, useRef } from "react";
import { View, TextInput, StyleSheet, Text, ViewStyle, Animated } from "react-native";
import { theme } from "../constants/theme";

type Props = {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  style?: ViewStyle;
  error?: string;
};

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  style,
  error,
}: Props) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.subtext}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, error ? styles.inputError : null]}
        />
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  label: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    height: theme.input.height,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.muted,
    paddingHorizontal: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: "#e53935",
    backgroundColor: "#fff5f5",
  },
  errorText: {
    color: "#e53935",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 4,
  },
});

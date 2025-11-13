import React, { useState, useMemo } from "react";
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { common, colors } from "./styles/common";
import { loginUser } from "../helpers/auth";
import { useEffect } from "react";


export default function Login() 
{
  
  // ---------- STATE (constants up top) ----------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Derived validity (same pattern as SignUp)
  const isValid = useMemo(() => {
    if (!email || !password) return false;
    return true;
  }, [email, password]);

  const onSubmit = async () => 
    {
    try 
    {
      setLoading(true);
      await loginUser(email.trim(), password);
      router.replace("/home");
    } 
    catch (e) 
    {
      Alert.alert("Sign in failed", e?.message || String(e));
    } finally 
    {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={common.screen}>
        <KeyboardAvoidingView
          style={common.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={[common.header, { alignItems: "center" }]}>
            <Text style={common.title}>Sign In to Team Space</Text>
            <View style={common.divider} />
          </View>

          {/* Form */}
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@domain.com"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />

            {/* Actions */}
            <View style={styles.actionsRow}>
              <View style={styles.buttonOutline}>
                <Button title="Cancel" onPress={() => 
                  {
                    setEmail("");
                    setPassword("");
                    Keyboard.dismiss();
                  }
                } color={colors.surface} />
              </View>
              <View style={styles.buttonOutline}>
                <Button
                  title={loading ? "Signing In..." : "Sign In"}
                  onPress={onSubmit}
                  disabled={!isValid || loading}
                  color= {colors.surface}
                />
              </View>
            </View>

            <Text style={styles.altLink} onPress={() => router.replace("/signUp")}>
              New here? Create an account
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  label: {
    color: colors.onBackground,
    fontWeight: "600",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    color: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  buttonOutline: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 6,
  },
  altLink: {
    marginTop: 14,
    textAlign: "center",
    color: colors.surface,
    opacity: 0.85,
    textDecorationLine: "underline",
  },
});

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";

export default function VerifyScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const router = useRouter();

  useEffect(() => {
    // After a short delay, send them to login or home
    const timeout = setTimeout(() => {
      router.replace("/VerifyEmail"); // or wherever your login/home screen is
    }, 1500);

    return () => clearTimeout(timeout);
  }, [router]);

  if (status === "success") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, marginBottom: 8 }}>Email verified ✅</Text>
        <Text>You can now log in.</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, marginBottom: 8 }}>Verification failed ❌</Text>
        <Text>Please request a new verification email.</Text>
      </View>
    );
  }

  // Fallback if status missing
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator />
    </View>
  );
}

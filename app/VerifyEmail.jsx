import { View, Text, Button } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { common,colors } from "./styles/common";
import { account, ID, tablesDb } from "../lib/appwrite";
import { router } from 'expo-router';




export default function VerifyEmail() {
  const { email } = useLocalSearchParams();

  const checkVerified = async () => {
    try {
      const user = await account.get();
      if (user.emailVerification) {
        router.replace("/home");
      } else {
        alert("Your email is not verified yet. Please check your inbox.");
      }
    } catch (err) {
      console.log("Error checking verification:", err);
    }
  };

  const resend = async () => {
    try {
      await account.createVerification("https://magic-portfolio-personal-projects-teamspace.appwrite.network/" );
      alert("Verification email resent.");
    } catch (err) {
      console.log("Error resending verification:", err);
    }
  };

  return (
    <View style={[common.screen, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={common.title}>Verify your email</Text>
      <Text style={{ color: colors.surface, marginTop: 10, textAlign: "center", paddingHorizontal: 24 }}>
        We’ve sent a verification link to{" "}
        <Text style={{ fontWeight: "700" }}>{email}</Text>. Please verify your email before continuing.
      </Text>

      <View style={{ marginTop: 24, gap: 12 }}>
        <Button title="I’ve verified my email" onPress={checkVerified} />
        <Button title="Resend verification email" onPress={resend} />
      </View>
    </View>
  );
}
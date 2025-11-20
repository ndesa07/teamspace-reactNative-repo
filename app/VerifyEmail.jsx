import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator,TouchableWithoutFeedback, Keyboard} from "react-native";

import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import { common, colors } from "./styles/common";
import { account, ID, tablesDb } from "../lib/appwrite";


export default function VerifyEmail() {
  const { email,playerId,password } = useLocalSearchParams();
  
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(email || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const checkVerified = async () => {
    try {
      setIsChecking(true);
      const user = await account.get();

      if (user.emailVerification) {
        router.replace("/home");
      } else {
        alert("Your email is not verified yet. Check your inbox.");
      }
    } catch (err) {
      console.log("Error checking verification:", err);
      alert("Error checking the verification status.");
    } finally {
      setIsChecking(false);
    }
  };

  const resend = async () => {
    try {
      setIsResending(true);
      await account.createVerification(
        "https://magic-portfolio-personal-projects-teamspace.appwrite.network/"
      );
      alert("Verification email resent.");
    } catch (err) {
      console.log("Error resending verification:", err);
      alert("Error resending the verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const updateEmail = async () => {
    if (!newEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    try 
    {
      setIsUpdating(true);
      await account.updateEmail(newEmail,password);

      alert("Email updated. A new verification email has been sent.");
      setIsEditingEmail(false);
      
      await account.createVerification(
        "https://magic-portfolio-personal-projects-teamspace.appwrite.network/"
      );
      const updateData = {};
      updateData.email = newEmail;
      console.log(updateData);
      await tablesDb.updateRow(
        "68cfc3d00013a224d25f",
        "name",              
        playerId,             
        updateData,
        );
    } 
    catch (err) 
    {
      console.log("Error updating email:", err);
      alert("Could not update email. Make sure the email is not already in use.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View
      style={[
        common.screen,
        { justifyContent: "start", alignItems: "center", paddingHorizontal: 24 },
      ]}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 24,
          borderRadius: 20,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 16,
          marginTop: "10%",
        }}
      >
        <Text style={[common.title, { textAlign: "center" }]}>
          Verify your email
        </Text>

        <Text style={{ color: colors.surface, textAlign: "center", lineHeight: 20 }}>
          We’ve sent a verification link to{" "}
          <Text style={{ fontWeight: "700" }}>{newEmail}</Text>.
        </Text>

        <View style={{ marginTop: 8, gap: 10 }}>
          <Pressable
            onPress={checkVerified}
            disabled={isChecking}
            style={{
              backgroundColor: colors.surface,
              paddingVertical: 12,
              borderRadius: 999,
              alignItems: "center",
              opacity: isChecking ? 0.6 : 1,
            }}
          >
            {isChecking ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={{ color: colors.background, fontWeight: "600", fontSize: 15 }}>
                I’ve verified my email
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={resend}
            disabled={isResending}
            style={{
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              opacity: isResending ? 0.6 : 1,
            }}
          >
            {isResending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={{ color: colors.surface, fontSize: 15, fontWeight: "500" }}>
                Resend verification email
              </Text>
            )}
          </Pressable>
        </View>

        {/* ---------- CHANGE EMAIL SECTION ---------- */}

        {!isEditingEmail ? (
          <>
            <Text
              style={{
                textAlign: "center",
                color: colors.muted,
                marginTop: 8,
              }}
            >
              Typed the wrong email?
            </Text>

            <Pressable
              onPress={() => setIsEditingEmail(true)}
              style={{ alignSelf: "center", padding: 4 }}
            >
              <Text
                style={{
                  color: colors.surface,
                  fontSize: 14,
                  fontWeight: "600",
                  textDecorationLine: "underline",
                }}
              >
                Change email address
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={{ marginTop: 10, gap: 10 }}>
            <Text style={{ color: colors.surface, fontWeight: "600" }}>Enter new email:</Text>

            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="new email address"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 12,
                color: colors.surface,
              }}
            />

            {/* Update Email Button */}
            <Pressable
              onPress={updateEmail}
              disabled={isUpdating}
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 12,
                borderRadius: 999,
                alignItems: "center",
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              {isUpdating ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={{ color: colors.background, fontWeight: "600", fontSize: 15 }}>
                  Update Email
                </Text>
              )}
            </Pressable>

            {/* Cancel */}
            <Pressable onPress={() => setIsEditingEmail(false)} style={{ alignSelf: "center" }}>
              <Text
                style={{
                  color: colors.muted,
                  marginTop: 4,
                  textDecorationLine: "underline",
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
    </TouchableWithoutFeedback>
  );
}

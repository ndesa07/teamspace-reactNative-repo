"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Client, Account } from "appwrite";

const endpoint = "https://syd.cloud.appwrite.io/v1";
const projectId = "teamspace728157";

export function VerifyHandler() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!searchParams) return;

    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    // No verification params → nothing to do
    if (!userId || !secret) return;

    const client = new Client().setEndpoint(endpoint).setProject(projectId);
    const account = new Account(client);

    const run = async () => {
      try {
        await account.updateVerification(userId, secret);
        setMessage("Email verified! Redirecting to the TeamSpace app...");

        // 🔁 deep-link back into the mobile app
        setTimeout(() => {
          window.location.href = "teamspace://verify?status=success";
        }, 1000);
      } catch (err: any) {
        console.error(err);
        setMessage(
          err?.message ||
            "Email verification failed. The link may be expired or already used."
        );

        // Optional: tell the app it failed
        setTimeout(() => {
          window.location.href = "teamspace://verify?status=error";
        }, 1500);
      }
    };

    run();
  }, [searchParams]);

  if (!message) return null;

  return (
    <div
      style={{
        padding: "12px 16px",
        marginBottom: "16px",
        borderRadius: "8px",
        backgroundColor: "rgba(34,197,94,0.15)",
        color: "#e5e7eb",
        textAlign: "center",
        fontSize: "0.9rem",
      }}
    >
      {message}
    </div>
  );
}

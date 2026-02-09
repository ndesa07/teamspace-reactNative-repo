"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Client, Account } from "appwrite";

const endpoint = "https://syd.cloud.appwrite.io/v1";
const projectId = "teamspace728157";

export default function VerifyPage() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!searchParams) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    if (!userId || !secret) {
      setStatus("error");
      setMessage("Invalid or incomplete verification link.");
      return;
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId);
    const account = new Account(client);

    const run = async () => {
      try {
        await account.updateVerification(userId, secret);
        setStatus("success");
        setMessage(
          "Your email has been verified. You can now open the TeamSpace app and sign in."
        );
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setMessage(
          err?.message ||
            "Verification failed. The link may be expired or already used."
        );
      }
    };

    run();
  }, [searchParams]);

  const title =
    status === "loading"
      ? "Verifying…"
      : status === "success"
      ? "Email verified!"
      : "Verification error";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-neutral-600">{message}</p>
        {status === "success" && (
          <p className="text-sm text-neutral-500">
            You may now return to the TeamSpace app.
          </p>
        )}
      </div>
    </main>
  );
}

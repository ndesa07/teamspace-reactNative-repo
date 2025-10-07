// helpers/auth.ts
import { account } from "../lib/appwrite";

export async function loginUser(email, password) 
{
    try 
    {
        // If a session exists, remove it so every launch is "fresh"
        await account.get();
        await account.deleteSession("current");
      } catch {
        // No active session — nothing to do
      }
  const session = await account.createEmailPasswordSession(email, password);
  return session;
}

export async function logout() {
    await account.deleteSession('current'); // end current session
  }
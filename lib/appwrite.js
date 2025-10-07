// lib/appwrite.js
import { Client, Account, Databases, ID, Permission, Role, TablesDB } from "react-native-appwrite";
import { Platform } from "react-native";

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

export const config = {
  endpoint,
  projectId,
  // ⚠️ use the **IDs** from Appwrite Console here
  databaseId: "YOUR_DATABASE_ID",
  collections: {
    clubs: "YOUR_CRICKETCLUB_COLLECTION_ID",
    profiles: "YOUR_PROFILES_COLLECTION_ID", // optional
  },
  platform: {
    ios: "dev.nihal.teamspace",
    android: "dev.nihal.teamspace",
  },
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(Platform.OS === "ios" ? config.platform.ios : config.platform.android);

export const account = new Account(client);
export const databases = new Databases(client);
export const tablesDb = new TablesDB(client);
export { ID, Permission, Role };

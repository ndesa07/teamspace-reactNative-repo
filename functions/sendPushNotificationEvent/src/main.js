import { Client, Databases } from "node-appwrite";
import axios from "axios";


export default async ({ req, res, log, error }) => {
  // --- 1. Parse request body ---
  let body = {};
  try {
    body = req.bodyJson ?? (req.body ? JSON.parse(req.body) : {});
  } catch (e) {
    error("Failed to parse request body: " + e.message);
    return res.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  // New: support both EVENT and ANNOUNCEMENT
  const {
    type,               // "EVENT" | "ANNOUNCEMENT"
    clubName,
    eventName,
    date,
    announcementTitle,  // used only for ANNOUNCEMENT
  } = body;

  const normalizedType = (type || "").toUpperCase();

  if (!clubName || !normalizedType) {
    return res.json(
      {
        success: false,
        error: "clubName and type are required",
      },
      400
    );
  }

  // Type-specific validation
  if (normalizedType === "EVENT") {
    if (!eventName || !date) {
      return res.json(
        {
          success: false,
          error: "eventName and date are required for type EVENT",
        },
        400
      );
    }
  } else if (normalizedType === "ANNOUNCEMENT") {
    if (!announcementTitle) {
      return res.json(
        {
          success: false,
          error: "announcementTitle is required for type ANNOUNCEMENT",
        },
        400
      );
    }
  } else {
    return res.json(
      {
        success: false,
        error: "Invalid type. Must be EVENT or ANNOUNCEMENT",
      },
      400
    );
  }

  // --- 2. Init Appwrite client ---
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(
      process.env.APPWRITE_API_KEY ?? req.headers["x-appwrite-key"] ?? ""
    );

  const databases = new Databases(client);

  const DB_ID = process.env.DB_ID;
  const USERS_COLLECTION_ID = process.env.USERS_COLLECTION_ID; // e.g. CricketClub collection

  if (!DB_ID || !USERS_COLLECTION_ID) {
    error("DB_ID or USERS_COLLECTION_ID env var is missing");
    return res.json(
      {
        success: false,
        error:
          "Server configuration error: DB_ID or USERS_COLLECTION_ID not set",
      },
      500
    );
  }

  try {
    // --- 3. Fetch all users from the collection ---
    const usersSnapshot = await databases.listDocuments(
      DB_ID,
      USERS_COLLECTION_ID
    );

    const tokens = [];

    for (const user of usersSnapshot.documents) {
      // Preferred: array field `expoPushTokens`
      if (Array.isArray(user.expoPushTokens)) {
        tokens.push(
          ...user.expoPushTokens.filter(
            (t) => typeof t === "string" && t.trim().length > 0
          )
        );
      }

      // Fallback: single string field `expoPushToken`
      if (
        typeof user.expoPushToken === "string" &&
        user.expoPushToken.trim().length > 0
      ) {
        tokens.push(user.expoPushToken.trim());
      }
    }

    if (!tokens.length) {
      log("No Expo push tokens found in users collection");
      return res.json(
        {
          success: false,
          error: "No push tokens found in users collection",
        },
        200
      );
    }

    // --- 4. Build notification payload (type-specific) ---
    let notificationTitle;
    let notificationBody;
    let extraData = {};

    if (normalizedType === "EVENT") {
      notificationTitle = "New Event Created";
      notificationBody = `${clubName} has created a new event ${eventName} on ${date}`;
      extraData = { eventName, date };
    } else {
      // ANNOUNCEMENT
      notificationTitle = "New Club Announcement";
      notificationBody = `New announcement for ${clubName}: ${announcementTitle}`;
      extraData = { announcementTitle };
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: notificationTitle,
      body: notificationBody,
      data: {
        type: normalizedType, // "EVENT" or "ANNOUNCEMENT"
        clubName,
        ...extraData,
      },
    }));

    // --- 5. Send to Expo Push API (Node 22 has global fetch) ---
      const { data: expoResult } = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      messages,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    log("Expo push result: " + JSON.stringify(expoResult));

    return res.json(
      {
        success: true,
        message: "Push notifications sent",
        sentTo: tokens.length,
        expoResult,
      },
      200
    );
  } catch (e) {
    error("Function error: " + e.message);
    return res.json(
      { success: false, error: "Internal server error: " + e.message },
      500
    );
  }
};
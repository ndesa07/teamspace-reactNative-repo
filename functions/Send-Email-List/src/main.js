// src/main.js

import { Client, Databases, Query } from "node-appwrite";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.FROM_EMAIL || "TeamSpace <no-reply@teamspacesports.com>";

export default async ({ req, res, log, error }) => {
  // --- Parse payload ---
  let body = {};
  try {
    body = req.bodyJson ?? (req.body ? JSON.parse(req.body) : {});
  } catch (e) {
    error("Failed to parse request body: " + e.message);
    return res.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { templateId, recipients } = body;

  if (!templateId) {
    return res.json({ success: false, error: "templateId is required" }, 400);
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.json(
      {
        success: false,
        error: "recipients must be a non-empty array of emails",
      },
      400
    );
  }

  // --- Init Appwrite client ---
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(
      process.env.APPWRITE_API_KEY ?? req.headers["x-appwrite-key"] ?? ""
    );

  const databases = new Databases(client);

  const DB_ID = process.env.DB_ID;
  const EMAIL_TEMPLATE_COLLECTION_ID =
    process.env.EMAIL_TEMPLATE_COLLECTION_ID;
  const TEAMS_IN_TEMPLATE_COLLECTION_ID =
    process.env.TEAMS_IN_TEMPLATE_COLLECTION_ID;
  const TEAMS_COLLECTION_ID = process.env.TEAMS_COLLECTION_ID; // TeamLists table

  try {
    // --- 1. Fetch the email template ---
    const templateDoc = await databases.getDocument(
      DB_ID,
      EMAIL_TEMPLATE_COLLECTION_ID,
      templateId
    );

    const templateName = templateDoc.templateName;
    const subjectLine = templateDoc.subjectLine || "Team List"; // <- subject text
    const bodyText = templateDoc.bodyText || "";
    const senderName = templateDoc.senderName || "TeamSpace";
    const clubName = templateDoc.clubName || "";

    // --- 2. Fetch all TeamsInTemplate rows for this template ---
    const teamsInTemplate = await databases.listDocuments(
      DB_ID,
      TEAMS_IN_TEMPLATE_COLLECTION_ID,
      [Query.equal("templateId", templateId)]
    );

    // --- 3. For each team, query TeamLists by teamId and build sections ---
    const teamSectionsHtml = [];
    const teamSectionsText = [];

    for (const row of teamsInTemplate.documents) {
      const { teamId, teamDetails } = row;
      if (!teamId) continue;

      try {
        // Query by TeamId field in TeamLists
        const teamList = await databases.listDocuments(
          DB_ID,
          TEAMS_COLLECTION_ID,
          [Query.equal("TeamId", teamId)]
        );

        if (!teamList.total) {
          error(
            `No team-list rows found for teamId ${teamId} in collection ${TEAMS_COLLECTION_ID}`
          );
          continue;
        }

        // Use the first row to get the team name
        const firstRow = teamList.documents[0];
        const teamName = firstRow.Team || firstRow.team || "Team";

        // Players are all rows with that teamId
        const players = teamList.documents.map((doc) => {
          if (doc.Player) return doc.Player;
          if (doc.player) return doc.player;
          return "Unknown Player";
        });

        // Build HTML list of players (1..N) – WITHOUT extra index formatting
        const playersHtml = players
          .map((playerName) => `<li>${playerName}</li>`)
          .join("");

        // ✅ teamDetails shown ABOVE the list
        const teamHtml = `
          <div style="margin-top:18px; margin-bottom:18px;">
            <h3 style="margin:0 0 8px 0;">${teamName}</h3>
            ${
              teamDetails
                ? `<p style="margin:0 0 8px 0; font-size:14px;">
                     <strong>Team details:</strong> ${teamDetails}
                   </p>`
                : ""
            }
            <ol style="padding-left:20px; margin:0 0 8px 0;">
              ${playersHtml || "<li>No players listed</li>"}
            </ol>
          </div>
        `;

        const playersText = players
          .map((playerName, idx) => `${idx + 1}. ${playerName}`)
          .join("\n");

        const teamText = [
          `\n${teamName}`,
          "-----------------",
          teamDetails ? `Team details: ${teamDetails}` : "",
          playersText || "No players listed",
        ]
          .filter(Boolean)
          .join("\n");

        teamSectionsHtml.push(teamHtml);
        teamSectionsText.push(teamText);
      } catch (e) {
        error(`Failed to fetch team list for teamId ${teamId}: ${e.message}`);
        continue;
      }
    }

    // --- 4. Build final email HTML + text ---
    const headerHtml = bodyText
      ? `<p style="margin:0 0 16px 0; font-size:16px;">${bodyText}</p>`
      : "";

    const footerHtml = `
      <div style="margin-top:24px; font-size:14px;">
        <p style="margin:0 0 4px 0;">Regards,</p>
        <p style="margin:0 0 2px 0;"><strong>${senderName}</strong></p>
        ${
          clubName
            ? `<p style="margin:0; color:#4b5563;">${clubName}</p>`
            : ""
        }
      </div>
    `;

    const html = `
      <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827; line-height:1.5;">
        <h2 style="margin:0 0 10px 0;">${subjectLine || templateName || "Team List"}</h2>
        ${headerHtml}
        ${teamSectionsHtml.join("")}
        ${footerHtml}
      </div>
    `;

    const text = [
      subjectLine || templateName || "Team List",
      "",
      bodyText || "",
      "",
      teamSectionsText.join("\n"),
      "",
      "Regards,",
      senderName,
      clubName || "",
    ]
      .filter(Boolean)
      .join("\n");

    // --- 5. Send email via Resend ---
    const sendResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: subjectLine, // ✅ real email subject = subjectLine
      html,
      text,
    });

    log("Resend response: " + JSON.stringify(sendResult));

    if (sendResult.error) {
      error("Resend error: " + sendResult.error.message);
      return res.json(
        { success: false, error: "Failed to send email", provider: sendResult },
        500
      );
    }

    // --- 6. Respond success ---
    return res.json(
      {
        success: true,
        message: "Email sent",
        templateId,
        recipients,
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

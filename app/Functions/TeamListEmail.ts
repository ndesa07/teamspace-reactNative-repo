export const TEAM_LIST_FN_URL = "https://692b8d68002d86d72975.syd.appwrite.run/"; 
export default {}; 
export async function TeamListEmail({ templateId, recipients }) {
  if (!templateId) {
    throw new Error("templateId is required");
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("recipients must be a non-empty array");
  }

  const body = { templateId, recipients };

  let response;
  try {
    response = await fetch(TEAM_LIST_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // This is a real network error (no connection, DNS, etc.)
    console.warn("TeamListEmail network error:", err);
    throw new Error("Network error while calling email function");
  }

  // Read raw text first (works whether it's JSON or plain text or empty)
  const rawText = await response.text();
  let json = null;

  if (rawText) {
    try {
      json = JSON.parse(rawText);
    } catch (e) {
      // Not JSON, that's fine
      json = null;
    }
  }

  // If HTTP status is not OK, treat as failure
  if (!response.ok) {
    const msg = json?.error || rawText || `HTTP ${response.status}`;
    throw new Error(`sendTeamListEmail: ${msg}`);
  }

  // If server chooses to send { success: false, error: "..." }
  if (json && json.success === false) {
    throw new Error(json.error || "sendTeamListEmail: Function reported failure");
  }

  // At this point: request succeeded. Just return something sane.
  return json || { success: true };
}


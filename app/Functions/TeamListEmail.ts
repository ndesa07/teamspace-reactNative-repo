export const TEAM_LIST_FN_URL = "https://692b8d68002d86d72975.syd.appwrite.run/"; 
export default {}; 
export async function TeamListEmail({templateId,recipients}) 
{
  if (!templateId) {
    throw new Error("templateId is required");
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("recipients must be a non-empty array");
  }

  const body = {
    templateId,
    recipients, // array of email strings
  };

  const response = await fetch(TEAM_LIST_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || "sendTeamListEmail: Function call failed");
  }

  return json;
}

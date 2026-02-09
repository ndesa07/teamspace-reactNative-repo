// src/main.js

// Import necessary modules
import { Client, Users /* , Messaging */ } from 'node-appwrite';
import { Resend } from 'resend'; // Import Resend SDK

// Initialize Resend client using the environment variable
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'TeamSpace <no-reply@teamspacesports.com>'; // Define sender email here

export default async ({ req, res, log, error }) => {
  // Init Appwrite SDK if you need it (Users/Messaging/etc.)
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY ?? req.headers['x-appwrite-key'] ?? '');

  // ---- Parse body safely (works for POST/PUT; empty body ok) ----
  let body = {};
  try {
    // Note: Appwrite uses req.body (raw string) or req.bodyJson (parsed object)
    body = req.bodyJson ?? (req.body ? JSON.parse(req.body) : {});
  } catch (_) {
    body = {};
  }

  const { email, name, clubName, sortCode, SortCodeCaptain } = body;

  if (!email || !name || !clubName || !sortCode || !SortCodeCaptain) {
    return res.json(
      { success: false, error: 'Missing required fields', received: body },
      400
    );
  }

  // Example SDK call to prove auth works (kept from your template)
  try {
    const users = new Users(client);
    const list = await users.list();
    log(`Total users: ${list.total}`);
  } catch (e) {
    error(`Users.list failed: ${e.message}`);
  }

  // --- Send welcome email using Resend ---
  try {
    const { data, err: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email], // Send to the email provided in the request body
      subject: `Welcome to ${clubName}, ${name}!`,
      html: `
  <h3 style="color: #0057ff;">✅ Your Important Details</h3>

<div style="background: #f4f7ff; padding: 16px; border-radius: 10px; margin-bottom: 12px;">
  <p style="margin: 0; font-size: 16px;">
    <strong>Club Name:</strong> ${clubName}
  </p>

  <div style="margin-top: 12px;">
    <p style="margin: 0; font-size: 16px;">
      <strong style="color: #0057ff;">Player Sort Code:</strong><br/>
      <span style="font-size: 22px; font-weight: bold; color: #000;">${sortCode}</span>
    </p>
  </div>

  <div style="margin-top: 16px;">
    <p style="margin: 0; font-size: 16px;">
      <strong style="color: #d9534f;">Captain Sort Code:</strong><br/>
      <span style="font-size: 22px; font-weight: bold; color: #000;">${SortCodeCaptain}</span>
    </p>
  </div>

  <p style="margin-top: 18px; background: #eef3ff; padding: 12px; border-radius: 8px; font-size: 14px;">
    Share these codes with your club.<br/>
    Players must use the <strong>Player Sort Code</strong>.<br/>
    Captains must use the <strong>Captain Sort Code</strong>.
  </p>
</div>

`,

    });

    if (resendError) {
      error(`Resend failed to send email: ${resendError.message}`);
      // Continue function execution but log the error
    } else {
      log(`Email sent successfully to ${email}. Data: ${JSON.stringify(data)}`);
    }

  } catch (e) {
    // Catch any network or configuration errors with Resend
    error(`General error during email sending: ${e.message}`);
  }
  // --- End Resend logic ---

  // Final response to the client
  return res.json({
    success: true,
    message: 'Payload OK, email attempt logged, and function executed',
    received: { email, name, clubName, sortCode,SortCodeCaptain },
  });
};

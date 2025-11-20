// Simple Express server that appends RSVP rows to a Google Sheet.
//
// NOTE:
// - Replace the placeholder SHEET_ID below with your Google Sheet ID
//   OR set process.env.SHEET_ID before running.
// - Provide a service account JSON key file (credentials.json) and
//   place its path in CREDENTIALS_PATH or set GOOGLE_APPLICATION_CREDENTIALS env var.

const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(express.json()); // parse application/json
app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

// Configuration: change these or provide environment variables.
const SHEET_ID = process.env.SHEET_ID || 'YOUR_SHEET_ID_HERE'; // <-- Insert your Sheet ID here
const CREDENTIALS_PATH =
  process.env.CREDENTIALS_PATH || path.join(__dirname, 'credentials.json'); // <-- path to service account key file

// Initialize Google Sheets client using a service account key file
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// POST /submit-rsvp
// Expected body fields: name, email, attendees, message
app.post('/submit-rsvp', async (req, res) => {
  try {
    const { name, email, attendees, message } = req.body;

    // Basic validation
    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, error: 'name and email are required' });
    }

    // Map fields to Sheet columns: A = name, B = email, C = attendees, D = message
    const row = [name, email, attendees || '', message || ''];

    const sheets = await getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:D', // change sheet name/range if needed
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row],
      },
    });

    return res.json({ success: true, message: 'RSVP recorded' });
  } catch (err) {
    console.error('Error appending to sheet:', err.message || err);
    return res
      .status(500)
      .json({ success: false, error: 'internal_server_error' });
  }
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`RSVP Sheets server listening on port ${PORT}`);
  console.log(
    `Ensure SHEET_ID is set and credentials file is at: ${CREDENTIALS_PATH}`
  );
});

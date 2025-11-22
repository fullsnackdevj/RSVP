// Simple Express server that appends RSVP rows to a Google Sheet.
// - Make sure your service account key file is at ./credentials.json (or set CREDENTIALS_PATH)
// - The SHEET_ID below is set from the Sheet URL you provided.

const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Replace/confirm: extracted Sheet ID from your URL
const SHEET_ID =
  process.env.SHEET_ID || '17J6YPimGOkna7qYKX7Q6MibKcSVqp2ZylMqAXNsDEXQ';

// Path to your service account credentials JSON (or set CREDENTIALS_PATH env var)
const CREDENTIALS_PATH =
  process.env.CREDENTIALS_PATH || path.join(__dirname, 'credentials.json');

// Startup checks: credentials presence and readable client_email
if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error(`ERROR: credentials file not found at ${CREDENTIALS_PATH}`);
  console.error(
    'Place your service account JSON at that path or set CREDENTIALS_PATH env var.'
  );
} else {
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    console.log(
      `Found credentials file. Service account: ${parsed.client_email || 'N/A'}`
    );
  } catch (e) {
    console.error(`ERROR reading/parsing credentials.json: ${e.message || e}`);
  }
}

// Initialize Google Sheets client using service account key file
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// POST /submit-rsvp
// Expected JSON body: { name, email, attendees, message }
app.post('/submit-rsvp', async (req, res) => {
  try {
    const { name, email, attendees, message } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, error: 'name and email are required' });
    }

    const row = [name, email, attendees || '', message || ''];

    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1A:D',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    return res.json({ success: true, message: 'RSVP recorded' });
  } catch (err) {
    // improved logging for debugging
    console.error(
      'Error appending to sheet:',
      err && err.stack ? err.stack : err
    );
    if (err && err.response && err.response.data) {
      console.error(
        'Google API response:',
        JSON.stringify(err.response.data, null, 2)
      );
    }
    return res
      .status(500)
      .json({ success: false, error: 'internal_server_error' });
  }
});

// Optional: serve static files from project root (so index.html can POST to same origin during dev)
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`RSVP Sheets server listening on port ${PORT}`);
  console.log(`SHEET_ID=${SHEET_ID}`);
  console.log(`CREDENTIALS_PATH=${CREDENTIALS_PATH}`);
});

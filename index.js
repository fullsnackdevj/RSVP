// Simple Express server that appends RSVP rows to a Google Sheet.
// - Make sure your service account key file is at ./credentials.json (or set CREDENTIALS_PATH)
// - The SHEET_ID below is set from the Sheet URL you provided.

const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Replace/confirm: extracted Sheet ID from your URL
const SHEET_ID =
  process.env.SHEET_ID || '1AZOp_Rz0y2367_IhTlv-DoNzWg2Ja6Mku69ko4dLVRI';

// Path to your service account credentials JSON (or set CREDENTIALS_PATH env var)
const CREDENTIALS_PATH =
  process.env.CREDENTIALS_PATH || path.join(__dirname, 'credentials.json');

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

    // Map to sheet columns A = name, B = email, C = attendees, D = message
    const row = [name, email, attendees || '', message || ''];

    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:D', // change sheet name/range if needed
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    return res.json({ success: true, message: 'RSVP recorded' });
  } catch (err) {
    console.error('Error appending to sheet:', err);
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

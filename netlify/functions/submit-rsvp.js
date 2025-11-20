const { google } = require('googleapis');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    // Normalize incoming keys
    const fullName = (payload.fullName || payload.name || '').trim();
    const email = (payload.email || '').trim();
    const attendance = (payload.attendance || payload.attendees || '').trim();
    const message = (payload.message || '').trim();
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!fullName || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Missing name or email',
        }),
      };
    }

    // MATCH THIS ORDER TO YOUR SHEET HEADER ROW
    // Your sheet headers: [Write your FULL NAME, Email, Can you attend?, Message]
    const row = [fullName, email, attendance, message];

    // Log final row (visible in function logs) before attempting append
    console.log('Prepared row for sheet append:', row);

    // Append
    await appendToSheet(row);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Function error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: err.message,
      }),
    };
  }
};

async function appendToSheet(row) {
  const auth = new google.auth.JWT(key.client_email, null, key.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);

  const sheets = google.sheets({ version: 'v4', auth });

  // EXACT tab name used in your sheet (case sensitive)
  const range = 'Form_Responses';

  console.log('About to append to sheet:', { spreadsheetId, range, row });

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return res.data;
}

// normalize env var names (support SPREADSHEET_ID or SHEET_ID, and GOOGLE_SERVICE_ACCOUNT or GOOGLE_CREDENTIALS)
const spreadsheetId =
  process.env.SPREADSHEET_ID ||
  process.env.SHEET_ID ||
  process.env.SHEET_ID_VALUE;
const svcJson =
  process.env.GOOGLE_SERVICE_ACCOUNT ||
  process.env.GOOGLE_CREDENTIALS ||
  process.env.GOOGLE_CREDENTIAL;

if (!spreadsheetId || !svcJson) {
  throw new Error(
    'Missing spreadsheet credentials: set SPREADSHEET_ID (or SHEET_ID) and GOOGLE_SERVICE_ACCOUNT (or GOOGLE_CREDENTIALS)'
  );
}

let key;
try {
  key = typeof svcJson === 'string' ? JSON.parse(svcJson) : svcJson;
} catch (err) {
  throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT / GOOGLE_CREDENTIALS JSON');
}

// normalize private_key newlines if pasted with \n
if (key.private_key && key.private_key.includes('\\n')) {
  key.private_key = key.private_key.replace(/\\n/g, '\n');
}

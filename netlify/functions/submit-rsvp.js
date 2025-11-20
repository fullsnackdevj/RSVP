const { google } = require('googleapis');

exports.handler = async function (event) {
  // Allow preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { name, email, attendees, message } = body;
    if (!name || !email)
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'name and email required',
        }),
        headers: { 'Access-Control-Allow-Origin': '*' },
      };

    // Read sheet id and credentials from env vars
    const SHEET_ID = process.env.SHEET_ID;
    if (!SHEET_ID) throw new Error('Missing SHEET_ID env var');

    // GOOGLE_CREDENTIALS must be base64 of the service account JSON
    const credsB64 = process.env.GOOGLE_CREDENTIALS;
    if (!credsB64) throw new Error('Missing GOOGLE_CREDENTIALS env var');
    const creds = JSON.parse(Buffer.from(credsB64, 'base64').toString('utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({
      version: 'v4',
      auth: await auth.getClient(),
    });

    const row = [name, email, attendees || '', message || ''];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:D', // change to your tab name if needed
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true, message: 'RSVP recorded' }),
    };
  } catch (err) {
    console.error('Function error:', err && (err.stack || err));
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: err.message || 'server_error',
      }),
    };
  }
};

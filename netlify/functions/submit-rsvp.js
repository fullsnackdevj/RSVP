exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    // Validate/normalize
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

    // IMPORTANT: Order this array to match your Google Sheet columns exactly.
    // Example sheet columns: [Write your FULL NAME:, Email, Can you attend?, Message]
    const row = [fullName, email, attendance, message];

    console.log('Appending row to sheet:', row);
    // TODO: append `row` to Google Sheet here (googleapis / sheets.spreadsheets.values.append)
    // If you already have Sheets code, replace the TODO above and return success only after append succeeds.

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
      }),
    };
  }
};

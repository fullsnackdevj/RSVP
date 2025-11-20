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
    // TODO: validate and save payload (e.g., write to DB or send to email)
    console.log('RSVP payload:', payload);

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

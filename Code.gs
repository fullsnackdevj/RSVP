/**
 * RSVP Apps Script - robust JSON + form handler
 * Update: uses provided spreadsheet and deployment constants.
 */

const SPREADSHEET_ID = '1KnaOqA8eMczgW2DzHY3hz_TH3GtMNx9H1DuiVMeUlC4';
const DEPLOYMENT_ID =
  'AKfycbxKe4v8rci2a-fZQY5eGPpF04x8gG9VKrqt4nubgWVt1QhXThmZ9s2XVPO61ndD_010';
const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxKe4v8rci2a-fZQY5eGPpF04x8gG9VKrqt4nubgWVt1QhXThmZ9s2XVPO61ndD_010/exec';

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ready' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Responses') || ss.getSheets()[0];

    // Log incoming raw postData for debugging (check Executions / Logs)
    try {
      Logger.log('Raw postData: %s', JSON.stringify(e.postData || {}));
    } catch (logErr) {
      Logger.log('postData logging error: ' + String(logErr));
    }

    // Parse JSON body if present, otherwise fallback to e.parameter (urlencoded/form)
    let data = {};
    if (
      e.postData &&
      e.postData.type &&
      e.postData.type.indexOf('application/json') === 0
    ) {
      try {
        data = JSON.parse(e.postData.contents || '{}');
      } catch (jsonErr) {
        Logger.log('JSON parse error: ' + String(jsonErr));
        data = {};
      }
    } else {
      data = e.parameter || {};
    }

    Logger.log('Parsed data: %s', JSON.stringify(data));

    const timestamp = data.timestamp || new Date().toISOString();
    const firstName = (data.firstName || '').toString().trim();
    const lastName = (data.lastName || '').toString().trim();
    const email = (data.email || '').toString().trim();
    const attendance = (data.attendance || '').toString().trim();
    // preserve full message text (no trimming) to avoid accidental truncation
    const message =
      typeof data.message === 'string' ? data.message : data.message || '';
    const fullName =
      (data.fullName && data.fullName.toString().trim()) ||
      (firstName + ' ' + lastName).trim();

    // Append a new row — use appendRow to preserve full content
    const values = [
      timestamp,
      firstName,
      lastName,
      email,
      attendance,
      message,
      fullName,
    ];
    sheet.appendRow(values);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + String(err));
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.message || String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

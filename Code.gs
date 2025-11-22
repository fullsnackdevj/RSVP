function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ready' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const SPREADSHEET_ID = '1KnaOqA8eMczgW2DzHY3hz_TH3GtMNx9H1DuiVMeUlC4';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Responses') || ss.getSheets()[0];

    const DATA_START_ROW = 4; // overwrite row 4 on each submission
    const p = e.parameter || {};

    const timestamp = p.timestamp || new Date().toISOString();
    const firstName = (p.firstName || '').toString().trim();
    const lastName = (p.lastName || '').toString().trim();
    const email = p.email || '';
    const attendance = p.attendance || '';
    const message = p.message || '';
    const fullName = p.fullName || (firstName + ' ' + lastName).trim();

    const values = [
      timestamp,
      firstName,
      lastName,
      email,
      attendance,
      message,
      fullName,
    ];

    const targetColCount = Math.max(values.length, sheet.getLastColumn() || 7);
    sheet.getRange(DATA_START_ROW, 1, 1, targetColCount).clearContent();
    sheet.getRange(DATA_START_ROW, 1, 1, values.length).setValues([values]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', row: DATA_START_ROW })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error('doPost error', err);
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.message || String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

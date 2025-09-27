/**
 * Google Apps Script for SRN Payment Status API
 * This script creates a public API endpoint that checks if an SRN exists in the active Google Sheet
 */

function doGet(e) {
  try {
    // Get the SRN parameter from the URL
    const srn = e.parameter.SRN;
    
    // Check if SRN parameter is provided
    if (!srn) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "SRN parameter is required"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the active spreadsheet and sheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    
    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();
    
    // Check if sheet has data
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "No data found in the sheet"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get headers (first row)
    const headers = data[0];
    
    // Find the SRN column index
    const srnColumnIndex = headers.findIndex(header => 
      header.toString().toLowerCase().includes('srn')
    );
    
    if (srnColumnIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "SRN column not found in the sheet"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find the Status column index (required for Option 1)
    const statusColumnIndex = headers.findIndex(header => 
      header.toString().toLowerCase().includes('status')
    );
    
    if (statusColumnIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "Status column not found in the sheet. Please add a 'Status' column with 'Paid' or 'Unpaid' values."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Search for the SRN in the data (skip header row)
    for (let i = 1; i < data.length; i++) {
      const rowSrn = data[i][srnColumnIndex];
      
      // Check if the SRN matches (case-insensitive)
      if (rowSrn && rowSrn.toString().trim().toLowerCase() === srn.trim().toLowerCase()) {
        // Check payment status from Status column
        const status = data[i][statusColumnIndex];
        let paymentStatus = "Not Paid"; // Default to not paid
        
        if (status) {
          const statusText = status.toString().trim().toLowerCase();
          // Check for paid status (case-insensitive)
          if (statusText === 'paid' || statusText === 'yes' || statusText === 'complete' || 
              statusText === 'done' || statusText === '1' || statusText === 'true') {
            paymentStatus = "Paid";
          } else {
            paymentStatus = "Not Paid";
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "success",
            result: paymentStatus,
            srn: srn,
            found: true,
            paymentStatus: paymentStatus
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // SRN not found
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        result: "Not Found",
        srn: srn,
        found: false
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Handle any errors
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "An error occurred: " + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function to verify the script works
 * You can run this function in the Apps Script editor to test
 */
function testScript() {
  // Test with a sample SRN
  const testEvent = {
    parameter: {
      SRN: "R24SA036"
    }
  };
  
  const result = doGet(testEvent);
  console.log(result.getContent());
}

/**
 * Setup function to prepare the sheet with Status column
 * Run this once to set up your Google Sheet with the correct format
 */
function setupSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  
  // Set up headers if the sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([["Name", "SRN", "Status"]]);
    sheet.getRange(2, 1, 5, 3).setValues([
      ["John Doe", "R24SA036", "Paid"],
      ["Jane Smith", "R24SA037", "Paid"],
      ["Alice Johnson", "R24SA038", "Unpaid"],
      ["Bob Wilson", "R24SA039", "Paid"],
      ["Carol Brown", "R24SA040", "Unpaid"]
    ]);
  }
  
  console.log("Sheet setup complete with Status column!");
}

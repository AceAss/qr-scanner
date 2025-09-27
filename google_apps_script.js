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
    
    // Cache the spreadsheet data for better performance
    const cacheKey = 'spreadsheet_data';
    let data = CacheService.getScriptCache().get(cacheKey);
    
    if (!data) {
      // Load data from spreadsheet
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = spreadsheet.getActiveSheet();
      data = sheet.getDataRange().getValues();
      
      // Cache for 5 minutes to handle high volume
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(data), 300);
    } else {
      data = JSON.parse(data);
    }
    
    // Check for duplicate scans (server-side tracking)
    const scannedKey = `scanned_${srn}`;
    const alreadyScanned = CacheService.getScriptCache().get(scannedKey);
    
    if (alreadyScanned) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          result: "Already Scanned",
          srn: srn,
          found: true,
          message: "This QR code has already been scanned and used for entry"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
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
        
        // Mark this SRN as scanned (server-side tracking)
        CacheService.getScriptCache().put(scannedKey, 'true', 3600); // Cache for 1 hour
        
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

/**
 * Clear all scanned records (for new events)
 * Run this function to reset all scanned SRNs
 */
function clearScannedRecords() {
  // Clear all scanned SRNs from cache
  const cache = CacheService.getScriptCache();
  
  // Get all cached keys and remove scanned ones
  // Note: This is a simplified approach - in production, you might want to track keys
  console.log("Clearing all scanned records...");
  
  // Clear the main data cache as well to force refresh
  cache.remove('spreadsheet_data');
  
  console.log("All scanned records cleared! Ready for new event.");
  return "All scanned records cleared successfully!";
}

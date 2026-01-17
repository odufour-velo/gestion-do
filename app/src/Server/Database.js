/**
 * Manage all interactions with the Google Sheets database
 */
const Database = {
  SHEET_NAME: "Epreuves",

  /**
   * Record new events in the spreadsheet
   * @param {Object} data - Object containing event data
   * @returns {boolean} True if saving was successful
   */
  saveEpreuves: function(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(this.SHEET_NAME);
    
    // Create the sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(this.SHEET_NAME);
      sheet.appendRow([
        "Identifiant", "Date", "Nom", "Lieu", "Discipline", 
        "Catégorie", "Heure dossards", "Heure départ", 
        "Étape ?", "Engagement", "Grille de prix", 
        "Détails", "Téléphone", "Mail"
      ]);
    }

    // Prepare data for insertion
    const rowsToAppend = data.epreuves.map(ep => {
      return [
        data.id,
        ep.date,
        data.nom,
        data.lieu,
        data.discipline,
        ep.categorie,
        ep.hDossard,
        ep.hDepart,
        data.isEtapes ? "Oui" : "Non",
        data.engagement,
        data.grille,
        data.details,
        data.telephone,
        data.mail
      ];
    });

    // Grouped insertion for better performance
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rowsToAppend.length, rowsToAppend[0].length)
         .setValues(rowsToAppend);
         
    return true;
  }
};

/**
 * Function called by google.script.run (client-side) to process the form data
 * @param {Object} data - The form data object
 * @returns {boolean} True if saving was successful
 */
function processForm(data) {
  try {
    return Database.saveEpreuves(data);
  } catch (e) {
    throw new Error("Erreur lors de l'enregistrement : " + e.message);
  }
}

/**
 * Get the list for the Sheet "Discipline"
 * @return {Array} Name list of disciplines
 */
function getDisciplines() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Discipline");
    
    if (!sheet) return ["Route", "VTT", "Cyclo-cross"]; // Default values if sheet doesn't exist
    
    // Get all values from the first column
    const values = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    
    // Cleanup the array to return a simple list
    return values.map(row => row[0]).filter(item => item && item !== "Nom"); 
  } catch (e) {
    return ["Erreur de chargement"];
  }
}
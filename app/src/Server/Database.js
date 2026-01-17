/**
 * Gère toutes les interactions avec la feuille de calcul
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
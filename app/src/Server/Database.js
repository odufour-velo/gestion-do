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
  
    const timestamp = new Date();
    const uuid = generateUUID(data);

    // CAS 1 : ROUTE PAR ÉTAPES (Concaténation sur une seule ligne)
    if (data.discipline.toLowerCase() === 'route' && data.type_route === 'course_ligne') {
      
      sheet.appendRow([
        uuid,
        data.discipline,
        data.type_route,
        data.organizer,
        data.mail,
        data.tel,
        data.name,
        data.date,
        data.location,
        "", // Pas de distance circuit
        (data.h_doss ? data.h_doss.join(" | ") : ""),
        (data.h_dep ? data.h_dep.join(" | ") : ""),
        "", // Pas de tours
        (data.dist ? data.dist.join(" | ") : ""),
        (data.v_dep ? data.v_dep.join(" | ") : ""),
        (data.v_arr ? data.v_arr.join(" | ") : ""),
        (data.cat_min ? data.cat_min[0] : ""), // Souvent une seule cat pour les étapes
        (data.cat_max ? data.cat_max[0] : ""),
        data.engagement || "",
        data.grid || "",
        data.infos,
        timestamp
      ]);

    } 
    // CAS 2 : CIRCUIT OU AUTRES (Format Relationnel - Une ligne par épreuve)
    else {
      const nbEpreuves = data.h_dep ? data.h_dep.length : 1;
      
      for (let i = 0; i < nbEpreuves; i++) {
        sheet.appendRow([
          uuid,
          data.discipline,
          data.type_route || "N/A",
          data.organizer,
          data.mail,
          data.tel,
          data.name,
          data.date,
          data.location,
          data.distance_circuit || "",
          (data.h_doss ? data.h_doss[i] : ""),
          (data.h_dep ? data.h_dep[i] : ""),
          (data.tours ? data.tours[i] : ""),
          (data.dist_totale ? data.dist_totale[i] : ""),
          "", // Ville départ (N/A circuit)
          "", // Ville arrivée (N/A circuit)
          (data.cat_min ? data.cat_min[i] : ""),
          (data.cat_max ? data.cat_max[i] : ""),
          (data.prix_engag ? data.prix_engag[i] : (data.engagement || "")),
          (data.grille_prix ? data.grille_prix[i] : (data.grid || "")),
          data.infos,
          timestamp
        ]);
      }
    }
         
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

/**
 * Get the list for the Sheet "Categories"
 * @return {Array} Name list of categories
 */
function getCategories() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Categories");
    
    if (!sheet) return ["Elite", "Open 1", "Open 2", "Open 3", "Access 1", "Access 2", "Access 3", "Access 4"]; // Default values if sheet doesn't exist
    
    // Get all values from the first column
    const values = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    
    // Cleanup the array to return a simple list
    return values.map(row => row[0]).filter(item => item && item !== "Nom"); 
  } catch (e) {
    return ["Erreur de chargement"];
  }
}
/**
 * Manage all interactions with the Google Sheets database
 */
const Database = {
  SHEET_NAME: "Epreuves",

  FIELD_MAP: {
    uuid: "UUID",
    discipline: "Discipline",
    type_discipline: "Type Discipline",
    organizer: "Organisateur",
    mail: "Mail",
    tel: "Téléphone",
    name: "Nom",
    date: "Date",
    location: "Lieu",
    distance_circuit: "Distance Circuit",
    tours: "Tours",
    date_perm: "Date Permanence",
    h_perm: "Heure Permanence",
    h_ds: "Heure DS",
    perm_addr: "Adresse Permanence",
    h_doss: "Heure Dossard",
    h_dep: "Heure Départ",
    dist_totale: "Distance Totale",
    v_dep: "Ville Départ",
    v_arr: "Ville Arrivée",
    cat_min_h: "Cat Min H",
    cat_max_h: "Cat Max H",
    cat_min_f: "Cat Min F",
    cat_max_f: "Cat Max F",
    prix_engag: "Prix Engagement",
    grille_prix: "Grille Prix",
    limitations: "Limitation",
    infos: "Infos",
    timestamp: "Horodatage"
  },

  REQUIRED_FIELDS: ["discipline", "organizer", "mail", "name"],

  /**
   * Validate payload before writing to sheet
   * @param {Object} data
   */
  validateEpreuve: function(data) {
    if (!data) throw new Error("Données manquantes");

    this.REQUIRED_FIELDS.forEach(field => {
      if (!data[field] || data[field].toString().trim() === "") {
        throw new Error(`Champ requis manquant : ${field}`);
      }
    });

    const mailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!mailPattern.test(data.mail)) {
      throw new Error("Adresse email invalide");
    }

    if (data.h_dep && data.h_doss && data.h_dep.length !== data.h_doss.length) {
      throw new Error("Le nombre d'horaires de départ et de dossards doit être cohérent");
    }

    if (data.cat_min && data.cat_max && data.cat_min.length !== data.cat_max.length) {
      throw new Error("Le nombre de catégories min et max doit être identique");
    }

    return true;
  },

  /**
   * Read the header row from the sheet and normalize names
   */
  getSheetHeaders: function(sheet) {
    const lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) {
      return [];
    }

    const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    return headerRow.map(cell => (cell || "").toString().trim());
  },

  /**
   * Build a map from header name to zero-based column index
   */
  buildHeaderMap: function(headers) {
    const map = {};
    headers.forEach((header, index) => {
      if (header) {
        map[header] = index;
      }
    });
    return map;
  },

  /**
   * Ensure the sheet has all expected headers. Append missing headers if needed.
   * Returns the current header list after synchronization.
   */
  syncHeaders: function(sheet) {
    const existingHeaders = this.getSheetHeaders(sheet);
    const expectedHeaders = Object.values(this.FIELD_MAP);
    const missingHeaders = expectedHeaders.filter(header => !existingHeaders.includes(header));

    if (missingHeaders.length === 0) {
      return existingHeaders;
    }

    const finalHeaders = existingHeaders.concat(missingHeaders);
    sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
    return finalHeaders;
  },

  /**
   * Convert a value into a sheet-friendly cell value.
   */
  formatCellValue: function(value) {
    if (value === null || value === undefined) {
      return "";
    }

    if (Array.isArray(value)) {
      return value.join(" | ");
    }

    return value;
  },

  /**
   * Get the appropriate scalar value for a specific row index.
   */
  getValueForRow: function(value, index) {
    if (value === null || value === undefined) {
      return "";
    }

    if (!Array.isArray(value)) {
      return value;
    }

    return value[index] != null ? value[index] : "";
  },

  /**
   * Build one full row based on the mapped headers.
   */
  buildRow: function(record, headerMap, columnCount) {
    const row = Array(columnCount).fill("");

    Object.entries(this.FIELD_MAP).forEach(([field, header]) => {
      const columnIndex = headerMap[header];
      if (columnIndex === undefined || columnIndex < 0) {
        return;
      }
      row[columnIndex] = this.formatCellValue(record[field]);
    });

    return row;
  },

  isRouteEtapes: function(data) {
    return data.discipline && data.discipline.toString().toLowerCase() === "route" &&
      ["course_ligne", "u19", "u23"].includes(data.type_discipline);
  },

  /**
   * Build rows from the payload according to the event shape.
   */
  buildRows: function(data, headerMap, columnCount) {
    const rows = [];
    const timestamp = new Date();
    const uuid = generateUUID(data);
    const baseRecord = {
      ...data,
      uuid,
      timestamp
    };

    if (this.isRouteEtapes(data)) {

      const nbEtapes = Array.isArray(data.h_dep) ? data.h_dep.length : (Array.isArray(data.date) ? data.date.length : 1);

      for (let i = 0; i < nbEtapes; i++) {
        const rowData = {
          ...baseRecord,
          date: this.getValueForRow(data.date, i),
          location: this.getValueForRow(data.v_dep, i),
          distance_circuit: "",
          tours: "",
          date_perm: i === 0 ? data.date_perm : "",
          h_perm: i === 0 ? data.h_perm : "",
          h_ds: i === 0 ? data.h_ds : "",
          perm_addr: i === 0 ? data.perm_addr : "",
          h_dep: this.getValueForRow(data.h_dep, i),
          dist_totale: this.getValueForRow(data.dist, i),
          v_dep: this.getValueForRow(data.v_dep, i),
          v_arr: this.getValueForRow(data.v_arr, i),
          cat_min_h: data.cat_min_h,
          cat_max_h: data.cat_max_h,
          cat_min_f: data.cat_min_f,
          cat_max_f: data.cat_max_f,
          prix_engag: this.getValueForRow(data.prix_engag, i),
          grille_prix: this.getValueForRow(data.grille_prix, i),
          limitations: this.getValueForRow(data.limitations, i),
          infos: this.getValueForRow(data.infos, i)
        };

        rows.push(this.buildRow(rowData, headerMap, columnCount));
      }
    } else if (Array.isArray(data.h_dep) && data.h_dep.length > 1) {
      for (let i = 0; i < data.h_dep.length; i++) {
        const rowData = {
          ...baseRecord,
          date: this.getValueForRow(data.date, i),
          h_doss: this.getValueForRow(data.h_doss, i),
          h_dep: this.getValueForRow(data.h_dep, i),
          tours: this.getValueForRow(data.tours, i),
          dist_totale: this.getValueForRow(data.dist_totale, i),
          cat_min_h: this.getValueForRow(data.cat_min_h, i),
          cat_max_h: this.getValueForRow(data.cat_max_h, i),
          cat_min_f: this.getValueForRow(data.cat_min_f, i),
          cat_max_f: this.getValueForRow(data.cat_max_f, i),
          prix_engag: this.getValueForRow(data.prix_engag, i),
          grille_prix: this.getValueForRow(data.grille_prix, i),
          limitations: this.getValueForRow(data.limitations, i),
          infos: this.getValueForRow(data.infos, i)
        };

        rows.push(this.buildRow(rowData, headerMap, columnCount));
      }
    } else {
      rows.push(this.buildRow(baseRecord, headerMap, columnCount));
    }

    return rows;
  },

  /**
   * Record new events in the spreadsheet
   * @param {Object} data - Object containing event data
   * @returns {boolean} True if saving was successful
   */
  saveEpreuves: function(data) {
    this.validateEpreuve(data);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      throw new Error(`Feuille introuvable : ${this.SHEET_NAME}`);
    }

    const headers = this.syncHeaders(sheet);
    const headerMap = this.buildHeaderMap(headers);
    const rows = this.buildRows(data, headerMap, headers.length);

    if (rows.length === 0) {
      throw new Error("Aucune ligne à enregistrer");
    }

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);

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
 * Get the disciplines and types from the sheet "Discipline"
 * @return {Object} { disciplines: Array<String>, types: Array<{discipline:String,type:String}> }
 */
function getDisciplines() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Discipline");

    if (!sheet) {
      return {
        disciplines: ["Route", "VTT", "Cyclo-cross"],
        types: []
      };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      return { disciplines: [], types: [] };
    }

    const values = sheet.getRange(1, 1, lastRow, 2).getValues();
    const disciplines = [];
    const types = [];
    const seen = new Set();

    values.forEach(row => {
      const discipline = (row[0] || "").toString().trim();
      const typeValue = (row[1] || "").toString().trim();

      if (!discipline || discipline === "Discipline") {
        return;
      }

      if (!disciplines.includes(discipline)) {
        disciplines.push(discipline);
      }

      if (typeValue) {
        const key = `${discipline}::${typeValue}`;
        if (!seen.has(key)) {
          seen.add(key);
          types.push({ discipline, type: typeValue });
        }
      }
    });

    return { disciplines, types };
  } catch (e) {
    return { disciplines: [], types: [] };
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

    if (!sheet) return ["Elite", "Open 1", "Open 2", "Open 3", "Access 1", "Access 2", "Access 3", "Access 4"];

    const values = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    return values.map(row => row[0]).filter(item => item && item !== "Nom");
  } catch (e) {
    return ["Erreur de chargement"];
  }
}

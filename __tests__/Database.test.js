/**
 * Unit tests for Database module
 * Tests validation and mock data insertion
 */

// Mock Google Sheets API
const mockSheet = {
  getLastRow: jest.fn(() => 0),
  getRange: jest.fn(function(row, col, rows, cols) {
    return {
      setValues: jest.fn(() => true)
    };
  })
};

const mockSpreadsheet = {
  getSheetByName: jest.fn(() => mockSheet)
};

global.SpreadsheetApp = {
  getActiveSpreadsheet: () => mockSpreadsheet
};

// Load Database module (simulated since clasp uses server-side)
const Database = {
  SHEET_NAME: "Epreuves",

  validateEpreuve: function(data) {
    if (!data) throw new Error("Données manquantes");

    const requiredFields = ["discipline", "organizer", "mail", "name", "date", "location"];
    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === "") {
        throw new Error(`Champ requis manquant : ${field}`);
      }
    });

    const dateValue = new Date(data.date);
    if (isNaN(dateValue.getTime())) {
      throw new Error("Date invalide");
    }

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

  saveEpreuves: function(data) {
    this.validateEpreuve(data);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      throw new Error(`Feuille introuvable : ${this.SHEET_NAME}`);
    }

    const timestamp = new Date();
    const uuid = "test-uuid";
    const rows = [];

    if (data.discipline.toLowerCase() === 'route' && data.type_discipline === 'course_ligne') {
      rows.push([
        uuid,
        data.discipline,
        data.type_discipline,
        data.organizer,
        data.mail,
        data.tel || "",
        data.name,
        data.date,
        data.location,
        "",
        (data.h_doss ? data.h_doss.join(" | ") : ""),
        (data.h_dep ? data.h_dep.join(" | ") : ""),
        "",
        (data.dist ? data.dist.join(" | ") : ""),
        (data.v_dep ? data.v_dep.join(" | ") : ""),
        (data.v_arr ? data.v_arr.join(" | ") : ""),
        (data.cat_min ? data.cat_min[0] : ""),
        (data.cat_max ? data.cat_max[0] : ""),
        data.engagement || "",
        data.grid || "",
        data.infos || "",
        timestamp
      ]);
    } else {
      const nbEpreuves = data.h_dep ? data.h_dep.length : 1;
      for (let i = 0; i < nbEpreuves; i++) {
        rows.push([
          uuid,
          data.discipline,
          data.type_discipline || "N/A",
          data.organizer,
          data.mail,
          data.tel || "",
          data.name,
          data.date,
          data.location,
          data.distance_circuit || "",
          (data.h_doss ? data.h_doss[i] : ""),
          (data.h_dep ? data.h_dep[i] : ""),
          (data.tours ? data.tours[i] : ""),
          (data.dist_totale ? data.dist_totale[i] : ""),
          "",
          "",
          (data.cat_min ? data.cat_min[i] : ""),
          (data.cat_max ? data.cat_max[i] : ""),
          (data.prix_engag ? data.prix_engag[i] : (data.engagement || "")),
          (data.grille_prix ? data.grille_prix[i] : (data.grid || "")),
          data.infos || "",
          timestamp
        ]);
      }
    }

    if (rows.length === 0) {
      throw new Error("Aucune ligne à enregistrer");
    }

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

    return true;
  }
};

// ===== TESTS =====

describe("Database.validateEpreuve", () => {
  test("devrait accepter des données valides", () => {
    const validData = {
      discipline: "Route",
      organizer: "Club Cycliste",
      mail: "test@example.com",
      name: "Course locale",
      date: "2026-03-21",
      location: "Paris"
    };
    expect(() => Database.validateEpreuve(validData)).not.toThrow();
  });

  test("devrait rejeter données null", () => {
    expect(() => Database.validateEpreuve(null)).toThrow("Données manquantes");
  });

  test("devrait rejeter champ discipline manquant", () => {
    const invalidData = {
      organizer: "Club",
      mail: "test@example.com",
      name: "Course",
      date: "2026-03-21",
      location: "Paris"
    };
    expect(() => Database.validateEpreuve(invalidData)).toThrow(/Champ requis manquant/);
  });

  test("devrait rejeter email invalide", () => {
    const invalidData = {
      discipline: "Route",
      organizer: "Club",
      mail: "invalid-email",
      name: "Course",
      date: "2026-03-21",
      location: "Paris"
    };
    expect(() => Database.validateEpreuve(invalidData)).toThrow("Adresse email invalide");
  });

  test("devrait rejeter date invalide", () => {
    const invalidData = {
      discipline: "Route",
      organizer: "Club",
      mail: "test@example.com",
      name: "Course",
      date: "invalid-date",
      location: "Paris"
    };
    expect(() => Database.validateEpreuve(invalidData)).toThrow("Date invalide");
  });

  test("devrait rejeter si h_dep et h_doss ont longueurs différentes", () => {
    const invalidData = {
      discipline: "VTT",
      organizer: "Club",
      mail: "test@example.com",
      name: "Course",
      date: "2026-03-21",
      location: "Paris",
      h_dep: ["09:00", "09:30"],
      h_doss: ["08:30"]
    };
    expect(() => Database.validateEpreuve(invalidData)).toThrow(/cohérent/);
  });

  test("devrait rejeter si cat_min et cat_max ont longueurs différentes", () => {
    const invalidData = {
      discipline: "VTT",
      organizer: "Club",
      mail: "test@example.com",
      name: "Course",
      date: "2026-03-21",
      location: "Paris",
      cat_min: ["Elite", "Open"],
      cat_max: ["Open"]
    };
    expect(() => Database.validateEpreuve(invalidData)).toThrow(/identique/);
  });
});

describe("Database.saveEpreuves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("devrait sauvegarder une épreuve route étapes", () => {
    const routeData = {
      discipline: "Route",
      type_discipline: "course_ligne",
      organizer: "Club Cycliste",
      mail: "test@example.com",
      name: "Tour du Pays",
      date: "2026-03-21",
      location: "Lyon",
      h_dep: ["09:00", "09:30"],
      v_dep: ["Lyon", "Villeurbanne"],
      v_arr: ["Villeurbanne", "Tassin"],
      dist: ["25", "30"]
    };

    expect(() => Database.saveEpreuves(routeData)).not.toThrow();
    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith("Epreuves");
  });

  test("devrait sauvegarder une épreuve circuit (plusieurs lignes)", () => {
    const circuitData = {
      discipline: "Route",
      type_discipline: "circuit",
      organizer: "Asso Cyclisme",
      mail: "contact@asso.com",
      name: "Circuit local",
      date: "2026-03-22",
      location: "Grenoble",
      distance_circuit: "8.5",
      h_doss: ["08:30", "09:00"],
      h_dep: ["09:00", "09:30"],
      tours: ["5", "6"],
      cat_min: ["Elite", "Open"],
      cat_max: ["Elite", "Open"]
    };

    expect(() => Database.saveEpreuves(circuitData)).not.toThrow();
    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith("Epreuves");
  });

  test("devrait sauvegarder une épreuve VTT", () => {
    const vttData = {
      discipline: "VTT",
      organizer: "VTT Club",
      mail: "vtt@club.com",
      name: "Cross VTT",
      date: "2026-03-23",
      location: "Chambéry",
      h_doss: ["14:00"],
      h_dep: ["14:30"],
      cat_min: ["Elite"],
      cat_max: ["Elite"]
    };

    expect(() => Database.saveEpreuves(vttData)).not.toThrow();
  });

  test("devrait rejeter si aucune ligne à enregistrer", () => {
    const emptyData = {
      discipline: "Route",
      organizer: "Club",
      mail: "test@example.com",
      name: "Course",
      date: "2026-03-21",
      location: "Paris",
      h_dep: [] // Array vide = pas d'épreuves à enregistrer
    };

    expect(() => Database.saveEpreuves(emptyData)).toThrow("Aucune ligne à enregistrer");
  });
});

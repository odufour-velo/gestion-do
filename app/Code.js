function doGet() {
  return HtmlService.createHtmlOutputFromFile('Formulaire')
      .setTitle('Saisie des Épreuves')
      .setWidth(850)
      .setHeight(700);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Gestion Épreuves')
      .addItem('Ouvrir le formulaire', 'showForm')
      .addToUi();
}

function showForm() {
  const html = HtmlService.createHtmlOutputFromFile('Formulaire')
      .setWidth(850)
      .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'Saisie de nouvelles épreuves');
}

function processForm(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Epreuves");
  
  data.epreuves.forEach(ep => {
    sheet.appendRow([
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
    ]);
  });
  return "Succès";
}
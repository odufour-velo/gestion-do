/**
 * Create the menu when sheet is opened
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Gestion Épreuves')
      .addItem('Ouvrir le formulaire', 'showForm')
      .addToUi();
}

/**
 * Configure and display the form in a modal dialog
 */
function showForm() {
    
  const html = HtmlService.createTemplateFromFile('Web/Form');
  
  const interface = html.evaluate()
      .setWidth(850)
      .setHeight(750)
      .setTitle('Saisie de nouvelles épreuves');
      
  SpreadsheetApp.getUi().showModalDialog(interface, ' ');
}
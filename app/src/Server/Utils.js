/**
 * Include HTML files (JS or CSS) in the main file
 * @param {string} filename File name with its path (ex: 'Web/FormCSS')
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Generate unique identifier for an event
 * @param {string} nomEpreuve Name of the event
 * @returns {string} Unique identifier for the event
 */
function generateUniqueID(nomEpreuve) {
  const prefix = nomEpreuve.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear().toString().substring(2);
  const random = Math.floor(Math.random() * 900) + 100;
  return `${prefix}${year}-${random}`;
}
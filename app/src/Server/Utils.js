/**
 * Include HTML files (JS or CSS) in the main file
 * @param {string} filename File name with its path (ex: 'Web/FormCSS')
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

 // Cleanup the text by removing special characters
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')                   // Separate accents from letters
    .replace(/[\u0300-\u036f]/g, '')    // Delete accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')                // Delete spaces
    .replace(/[^\w-]+/g, '')            // Delete all non-word chars
    .substring(0, 10);                  // Limit length
}

function generateUUID(data) {

  const datePart = data.date.replace(/-/g, ''); // 2026-01-17 -> 20260117
  const orgaPart = slugify(data.organizer).toUpperCase();
  const locPart  = slugify(data.location).toUpperCase();
  
  // Add a random 3-char hash to ensure uniqueness
  //const hash = Math.random().toString(36).substring(2, 5).toUpperCase();

  // Do not add hash for now
  return `${datePart}-${locPart}-${orgaPart}`;

}
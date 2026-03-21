/**
 * Local Express server to test the form UI
 * Simulates Google Apps Script environment locally
 * 
 * Usage: node server.js
 * Then open http://localhost:3000 in your browser
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from app/src/Web
app.use(express.static(path.join(__dirname, 'app/src/Web')));

/**
 * Mock google.script.run functions
 */
const mockGAS = {
  // Mock function to process form data
  processForm: function(data) {
    console.log('📝 Form data received:', JSON.stringify(data, null, 2));
    
    // Validate basic fields
    const requiredFields = ['discipline', 'organizer', 'mail', 'name', 'date', 'location'];
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push(`Champ requis manquant : ${field}`);
      }
    });
    
    // Email validation
    const mailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.mail && !mailPattern.test(data.mail)) {
      errors.push("Adresse email invalide");
    }
    
    // Date validation
    if (data.date) {
      const dateValue = new Date(data.date);
      if (isNaN(dateValue.getTime())) {
        errors.push("Date invalide");
      }
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    return { 
      success: true, 
      message: "✅ Données enregistrées avec succès !",
      uuid: `TEST-${Date.now()}`
    };
  },
  
  // Mock function to get disciplines
  getDisciplines: function() {
    return ["Route", "VTT", "Cyclo-cross", "Piste"];
  },
  
  // Mock function to get categories
  getCategories: function() {
    return [
      "Elite",
      "U23",
      "Open 1",
      "Open 2",
      "Open 3",
      "Access 1",
      "Access 2",
      "Access 3",
      "Access 4",
      "Junior",
      "Cadet"
    ];
  }
};

/**
 * Read and include HTML files (similar to GAS include() function)
 */
function loadHtmlFile(filename) {
  try {
    const filepath = path.join(__dirname, 'app/src', filename + '.html');
    return fs.readFileSync(filepath, 'utf-8');
  } catch (err) {
    console.error(`Error loading ${filename}:`, err.message);
    return '';
  }
}

/**
 * Inject mock google.script.run into HTML
 */
function injectMockGAS(html) {
  const mockScript = `
    <script>
      // Mock google.script.run for local testing
      window.google = window.google || {};
      window.google.script = window.google.script || {};
      window.google.script.run = {
        processForm: function(data) {
          console.log('Client-side mock: processForm called');
          return this;
        },
        getDisciplines: function() {
          console.log('Client-side mock: getDisciplines called');
          return this;
        },
        getCategories: function() {
          console.log('Client-side mock: getCategories called');
          return this;
        },
        withSuccessHandler: function(callback) {
          console.log('Client-side mock: withSuccessHandler');
          this._successCallback = callback;
          return this;
        },
        withFailureHandler: function(callback) {
          console.log('Client-side mock: withFailureHandler');
          this._failureCallback = callback;
          return this;
        }
      };
      
      // Override fetch to intercept API calls
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        if (url === '/api/processForm') {
          const data = JSON.parse(options.body);
          return fetch('/api/processForm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
            .then(r => r.json())
            .then(result => {
              if (result.success && window.google.script.run._successCallback) {
                window.google.script.run._successCallback();
              } else if (!result.success && window.google.script.run._failureCallback) {
                window.google.script.run._failureHandler({ message: result.errors.join('; ') });
              }
              return new Response(JSON.stringify(result));
            });
        }
        return originalFetch.apply(this, arguments);
      };
    </script>
  `;
  return html + mockScript;
}

/**
 * Route: GET / - Serve the main form
 */
app.get('/', (req, res) => {
  let html = loadHtmlFile('Web/Form');
  
  // Replace template includes with actual content
  html = html.replace("<?!= include('Web/FormCSS.html') ?>", loadHtmlFile('Web/FormCSS'));
  html = html.replace("<?!= include('Web/FormJS.html') ?>", loadHtmlFile('Web/FormJS'));
  
  // Inject mock GAS
  html = injectMockGAS(html);
  
  res.send(html);
});

/**
 * Route: POST /api/processForm - Handle form submission
 */
app.post('/api/processForm', (req, res) => {
  const data = req.body;
  const result = mockGAS.processForm(data);
  res.json(result);
});

/**
 * Route: GET /api/disciplines - Fetch disciplines
 */
app.get('/api/disciplines', (req, res) => {
  res.json(mockGAS.getDisciplines());
});

/**
 * Route: GET /api/categories - Fetch categories
 */
app.get('/api/categories', (req, res) => {
  res.json(mockGAS.getCategories());
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🧪 Local GAS Testing Server                             ║
╚════════════════════════════════════════════════════════════╝

  📍 Open: http://localhost:${PORT}
  
  Available endpoints:
  - GET  /                  → Form UI
  - POST /api/processForm   → Submit form data
  - GET  /api/disciplines   → Get disciplines list
  - GET  /api/categories    → Get categories list
  
  Tips:
  - Open DevTools (F12) to see console logs
  - Test form validation locally before deploying to GAS
  - Check Network tab to see API requests
  
  Press Ctrl+C to stop server
`);
});

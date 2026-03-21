# DO Course

Google Apps Script application for managing cycling event declarations. Built with **Clasp**, **Docker**, and **Jest** for local development and testing before deployment to Google Apps Script.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Workflow](#local-development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## Overview

**DO Course** is a Web-based form application for cycling organizations to declare cycling events. It integrates with Google Sheets for data storage and is deployed as a Google Apps Script Web App.

### Key Features

- Dynamic form UI with multi-discipline support (Route, VTT, Cyclo-cross)
- Multiple event types and categories
- Real-time client-side validation
- Server-side data validation & bulk inserts
- Local testing environment with mock GAS APIs
- Automated unit tests with Jest
- Docker-based development & deployment

---

## Project Structure

```
.
├── Dockerfile                 # Multi-stage Docker build (base, test, dev, release)
├── Makefile                   # Development convenience commands
├── package.json               # Node.js dependencies & npm scripts
├── README.md                  # This file
├── server.js                  # Local Express dev server (mock GAS environment)
├── __tests__/
│   └── Database.test.js      # Unit tests for Database module
└── app/
    ├── .clasp.json            # Clasp configuration (scriptId, push order)
    ├── .claspignore           # Files to ignore on clasp push/pull
    └── src/
        ├── App.js             # Main entry point & Google Sheets menu
        ├── appsscript.json    # GAS manifest (runtimeVersion, webapp config)
        ├── Server/
        │   ├── Database.js    # Sheets operations & validation
        │   └── Utils.js       # Helper functions (UUID, slugify, include)
        └── Web/
            ├── Form.html      # Main form layout
            ├── FormCSS.html   # Embedded stylesheet
            └── FormJS.html    # Client-side logic & google.script.run calls
```

---

## Prerequisites

### For Local Development

- **Node.js** (v18+) with npm
- **Docker** (optional, but recommended)
- **Git**

### For Google Apps Script Deployment

- Google Account with access to Google Drive
- Script ID from `app/.clasp.json`
- Google authentication via `clasp login`

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd DOcourse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build Docker images (optional):**
   ```bash
   make build        # Full Docker images
   make build-dev    # Dev server image only
   ```

---

## Local Development Workflow

### Recommended Development Cycle

#### 1. **Start with Unit Tests**

Run Jest tests to validate core logic before UI testing:

```bash
# Run tests locally (requires Node.js)
make test-unit

# Or with Docker (no local Node needed)
make test-docker

# Watch mode for continuous testing
make test-unit-watch

# Coverage report
make test-unit-coverage
```

#### 2. **Test the Form UI Locally**

Launch a mock GAS environment with Express server:

```bash
# Start server on http://localhost:3000
make server-dev-docker
```

Or without Docker:
```bash
make server
```

- Open http://localhost:3000 in your browser
- Fill out the form to test client-side validation
- Submit to see server-side validation responses
- Open DevTools (F12) to inspect network requests and console logs

#### 3. **Pull Latest Changes from GAS**

If collaborators made changes in Google Apps Script directly:

```bash
make pull
```

This syncs changes from your deployed GAS script back to your local repo.

#### 4. **Push to Google Apps Script**

Once testing passes, deploy your changes:

```bash
# Push code to GAS (does not deploy Web App)
make push

# Deploy to test Web App endpoint
make deploy-test

# For production deployment, use Google Apps Script Editor manually
# or create a new deployment with full access
```

---

## Testing

### Unit Tests (Jest)

Tests cover validation logic and data insertion:

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage:**
- `validateEpreuve()` - Validates required fields, email format, date validity, array consistency
- `saveEpreuves()` - Tests bulk insert logic for Route (line race), circuit, and VTT disciplines
- Mock Google Sheets API for isolated testing

### UI Testing (Local Server)

The Express server (`server.js`) provides:

- **Mock `google.script.run`** - Simulates GAS client-server communication
- **Form rendering** - Loads HTML/CSS/JS from `app/src/Web/`
- **API endpoints:**
  - `GET /` - Serves the form
  - `POST /api/processForm` - Processes form submission
  - `GET /api/disciplines` - Returns discipline list
  - `GET /api/categories` - Returns category list

**Tips:**
- Test all form paths: Route/Circuit, VTT, Cyclo-cross
- Verify dynamic field rendering based on discipline selection
- Check validation error messages
- Inspect network requests in DevTools Network tab

---

## Deployment

### Development Workflow

```bash
# 1. Make code changes
# app/src/Server/Database.js, app/src/App.js, etc.

# 2. Run tests
make test-unit

# 3. Test UI locally
make server-dev-docker

# 4. Push to GAS
make push

# 5. Deploy to test endpoint
make deploy-test

# 6. Test in actual Google Sheet (if available)
```

### Google Apps Script Console Access

Once deployed, access your script via:
- Google Apps Script Editor: https://script.google.com/
- Web App URL: Check `TEST_DEPLOYMENT_ID` in Makefile or GAS Editor

### Environment Configuration

- **Script ID**: `app/.clasp.json` → `scriptId`
- **Push Order**: `app/.clasp.json` → `filePushOrder` (Server/Utils.js → App.js)
- **Runtime**: `app/src/appsscript.json` → `runtimeVersion: "V8"`
- **Logging**: `app/src/appsscript.json` → `exceptionLogging: "STACKDRIVER"`

---

## API Documentation

### Server-Side Functions (GAS)

#### `processForm(data)`
Main handler called by client form submission.

**Parameters:**
```javascript
{
  discipline: string,           // "Route", "VTT", "Cyclo-cross"
  type_route?: string,          // "course_ligne" or "circuit" (if Route)
  organizer: string,            // Required
  mail: string,                 // Email address
  tel?: string,                 // Phone number
  name: string,                 // Event name
  date: string,                 // YYYY-MM-DD format
  location: string,             // City/location
  distance_circuit?: number,    // Circuit distance in km
  h_doss?: string[],           // Dossard times
  h_dep: string[],             // Departure times
  tours?: number[],            // Number of laps (circuit)
  dist_totale?: string[],      // Total distance per lap
  dist?: number[],             // Distance per stage (route)
  v_dep?: string[],            // Departure city (route)
  v_arr?: string[],            // Arrival city (route)
  cat_min: string[],           // Min category per event
  cat_max: string[],           // Max category per event
  prix_engag?: number[],       // Entry fee per category
  grille_prix?: string[],      // Price grid
  engagement?: number,          // General entry fee
  grid?: string,               // General price grid
  infos?: string               // Additional info
}
```

**Returns:**
```javascript
{ success: boolean, message?: string, uuid?: string }
```

#### `getDisciplines()`
Returns list of available disciplines from "Discipline" sheet.

**Returns:** `["Route", "VTT", "Cyclo-cross", ...]`

#### `getCategories()`
Returns list of available categories from "Categories" sheet.

**Returns:** `["Elite", "U23", "Open 1", ..., "Cadet"]`

### Client-Side Functions (FormJS.html)

#### `handleFormSubmit(event)`
Form submission handler with validation and error handling.

#### `loadDisciplines()`
Fetches and populates discipline dropdown on page load.

#### `loadCategories()`
Fetches and populates category selects on page load.

#### `renderEpreuves()`
Dynamically renders event details form based on discipline selection.

#### `addEpreuveRow()`
Adds a new event row to the form.

#### `calculerDistLigne(inputTours)` & `calculerToutesDistances()`
Calculates total distance based on circuit distance × number of laps.

---

## Makefile Commands

Quick reference for common development tasks:

```bash
make build              # Build Docker image (clasp + release)
make build-dev         # Build dev server image
make test              # Run tests in Docker
make test-unit         # Run Jest locally
make test-unit-watch   # Jest watch mode
make test-unit-coverage # Jest coverage report
make test-docker       # Tests in Docker
make server            # Start Express server locally
make server-dev-docker # Start Express in Docker
make login             # Verify clasp credentials
make clone             # Clone GAS project (first setup)
make pull              # Pull code from GAS
make push              # Push code to GAS
make deploy-test       # Deploy test version
make help              # Show all available commands
```

---

## Contributing

### Code Style

- **JavaScript (GAS):**
  - Use JSDoc comments for all functions
  - Handle errors with try/catch
  - Validate inputs server-side

- **JavaScript (Client):**
  - Use camelCase for variables/functions
  - Keep DOM manipulation localized
  - Rely on `google.script.run` for server calls

### Testing Requirements

Before pushing code:

1. **Run unit tests:**
   ```bash
   make test-unit
   ```

2. **Test UI locally:**
   ```bash
   make server-dev-docker
   ```

3. **Verify no console errors** in DevTools

4. **Pull latest changes:**
   ```bash
   make pull
   ```

5. **Push and test deployment:**
   ```bash
   make push
   make deploy-test
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, test, commit
git add .
git commit -m "feat: describe your change"

# Push to repository
git push origin feature/my-feature

# Create Pull Request for review
```

---

## Troubleshooting

### Port Already in Use (3000)

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 make server
```

### Docker Build Issues

```bash
# Clear Docker cache
docker system prune -a --volumes

# Rebuild without cache
make build-dev
```

### Clasp Authentication

```bash
# First-time setup with redirect port
make 1st-login

# Verify credentials
make login
```

### Form Not Loading on Server

1. Check if Express is running: `curl http://localhost:3000`
2. Check server logs: `docker logs <container-id>`
3. Verify `app/src/Web/` files exist
4. Check file paths in `server.js` match your structure

---

## License

Proprietary - Comité Auvergne-Rhône-Alpes de Cyclisme

## Support

For issues or questions, contact the development team or create an issue in the repository.




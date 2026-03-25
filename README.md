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
- [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
  - [Overview](#overview-1)
  - [Environments](#environments)
  - [Versioning Strategy](#versioning-strategy)
  - [GitHub Actions Workflows](#github-actions-workflows)
  - [GitHub Secrets Configuration](#github-secrets-configuration)
  - [Workflow Execution Flow](#workflow-execution-flow)
  - [Release Management](#release-management)
- [Troubleshooting](#troubleshooting)

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

2. **Build Docker images (optional):**
   ```bash
   make build        # Full Docker images
   make build-dev    # Dev server image only
   ```

3. **Setup the GAS credentials**
  ```bash
  make update-credentials
  ```

4. **Simulate Continuous Integration (GitHub) pipeline**
  
  Create a file *.docker/test/.env* for environment variables (*CLASP_TOKEN_JSON*, *TEST_SCRIPT_ID*, *TEST_DEPLOYMENT_ID*, *DEPLOYMENT_SHA*)
  - *DEPLOYMENT_SHA* is a random string
  - *TEST_SCRIPT_ID*, *TEST_DEPLOYMENT_ID* can be found in Google App Script settings
  - *CLASP_TOKEN_JSON* is the content of the file *.clasprc.json* created with `make update-credentials` command

  ```bash
  make deploy-test-as-ci
  ```

---

## Local Development Workflow

### Recommended Development Cycle

#### 1. **Start with Unit Tests**

Run Jest tests to validate core logic before UI testing:

```bash
# Run tests locally (requires Docker)
make test-unit

# Coverage report
make test-unit-coverage
```

#### 2. **Test the Form UI Locally**

Launch a mock GAS environment with Express server:

```bash
# Start server on http://localhost:3000
make server-dev
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
make server-dev

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

## CI/CD Pipeline (GitHub Actions)

### Overview

Automated testing and deployment pipeline using GitHub Actions ensures code quality and consistent deployments across development (test) and production environments with automatic release management.

**Pipeline Strategy:**

```
Feature Branch / Pull Request
    ↓
[Stage 1] Run Unit Tests (Jest)
    ↓
[Stage 2] If PR → Hold for review
    ↓ (if merged to main)
[Stage 3] Deploy to TEST environment
    ↓
[Stage 4] Manual approval (optional)
    ↓
[Stage 5] Deploy to PRODUCTION + Create GitHub Release + Auto-Changelog
```

### Environments

#### Development/Test Environment

**Purpose:** First deployment target for all changes.  
**Script ID:** `TEST_DEPLOYMENT_ID` (preview deployment, safe to redeploy)  
**Access:** Internal team only  
**Deployment:** Automatic on merge to `main` or `develop` branch

**Characteristics:**
- Uses test deployment endpoint
- No production data
- Can be redeployed without breaking user access
- Good for smoke testing

#### Production Environment

**Purpose:** Live environment for end users.  
**Script ID:** `PROD_DEPLOYMENT_ID` (full production deployment)  
**Access:** Authorized domain users only  
**Deployment:** Manual trigger via GitHub Actions (requires approval)

**Characteristics:**
- Uses production deployment
- Connected to live Google Sheet
- Versioned deployments for rollback capability
- Creates GitHub Release automatically
- Requires successful test deployment first

### Versioning Strategy

This project follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

- **MAJOR** (e.g., 1.0.0 → 2.0.0): Breaking changes, major features
- **MINOR** (e.g., 1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (e.g., 1.0.0 → 1.0.1): Bug fixes, improvements

**Commit Message Convention (Conventional Commits):**

Use prefixes in commit messages for automatic changelog generation:

```
feat: Add new discipline type           # MINOR version bump
fix: Correct validation error           # PATCH version bump
docs: Update README                     # No version bump
chore: Update dependencies              # No version bump
refactor: Simplify Database module      # PATCH version bump
perf: Optimize bulk insert logic        # PATCH version bump
```

**Release Naming:**
- Releases are tagged as `v1.2.3` in Git
- GitHub Release notes include commit history
- Deployment description includes version + commit hash

### GitHub Actions Workflows

#### Proposed Workflow Files

Create these files in `.github/workflows/`:

##### 1. **`.github/workflows/test.yml`** - Run Tests on Every Push/PR

```yaml
name: Tests

on:
  push:
    branches: [main, develop, feature/**]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run Jest tests
        run: npm test
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
          verbose: true
      
      - name: Comment PR with test results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `✅ Tests passed for commit ${context.payload.pull_request.head.sha.substring(0, 7)}`
            })
```

##### 2. **`.github/workflows/deploy-test.yml`** - Deploy to Test Environment

```yaml
name: Deploy to TEST

on:
  push:
    branches: [main, develop]
  workflow_run:
    workflows: [Tests]
    types: [completed]
    branches: [main, develop]

jobs:
  deploy-test:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success' || github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # For better commit history
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install tools
        run: |
          npm install
          npm install -g @google/clasp
      
      - name: Authenticate with Google
        run: |
          echo "${{ secrets.CLASP_TOKEN }}" > ~/.clasprc.json
          chmod 600 ~/.clasprc.json
      
      - name: Push code to GAS
        run: |
          cd app
          clasp push --force
      
      - name: Deploy to TEST endpoint
        run: |
          cd app
          clasp deploy --deploymentId ${{ secrets.TEST_DEPLOYMENT_ID }} \
                       --description "Test Deploy - Commit: ${{ github.sha }} - Branch: ${{ github.ref_name }}"
      
      - name: Comment PR with deployment info
        if: github.event_name == 'pull_request' || github.event.workflow_run.event == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Deployed to TEST environment\n\n**Test URL:** https://script.google.com/macros/d/${{ secrets.TEST_SCRIPT_ID }}/usercache\n\n**Deployment ID:** \`${{ secrets.TEST_DEPLOYMENT_ID }}\`\n\n**Commit:** \`${{ github.sha }}\``
            })
```

##### 3. **`.github/workflows/deploy-prod.yml`** - Deploy to Production + Create Release

```yaml
name: Deploy to PRODUCTION

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Semantic version (format: major.minor.patch, e.g. 1.2.3)'
        required: true
        type: string
      release_notes:
        description: 'Release notes (optional, auto-generated from commits if empty)'
        required: false
        type: string

jobs:
  validate-and-deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires approval in GitHub
    permissions:
      contents: write
      pull-requests: read
      issues: read
    
    outputs:
      release_url: ${{ steps.create-release.outputs.html_url }}
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for changelog
      
      - name: Validate version format
        run: |
          if ! [[ "${{ github.event.inputs.version }}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "❌ Invalid version format. Use semantic versioning (e.g., 1.2.3)"
            exit 1
          fi
      
      - name: Check if tag already exists
        run: |
          if git rev-parse "v${{ github.event.inputs.version }}" >/dev/null 2>&1; then
            echo "❌ Tag v${{ github.event.inputs.version }} already exists"
            exit 1
          fi
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install tools
        run: |
          npm install
          npm install -g @google/clasp
      
      - name: Authenticate with Google
        run: |
          echo "${{ secrets.CLASP_TOKEN }}" > ~/.clasprc.json
          chmod 600 ~/.clasprc.json
      
      - name: Push code to GAS
        run: |
          cd app
          clasp push --force
      
      - name: Deploy to PRODUCTION
        id: deploy
        run: |
          cd app
          clasp deploy --description "Production Release v${{ github.event.inputs.version }} - Commit: ${{ github.sha }}"
          echo "deployment_success=true" >> $GITHUB_OUTPUT
      
      - name: Generate changelog
        id: changelog
        run: |
          # Get commits since last tag
          LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
          
          if [ -z "$LAST_TAG" ]; then
            COMMIT_LOG=$(git log --oneline --format="- %h: %s" | head -20)
          else
            COMMIT_LOG=$(git log ${LAST_TAG}..HEAD --oneline --format="- %h: %s")
          fi
          
          # Build changelog content
          BODY="## Release v${{ github.event.inputs.version }}"
          BODY+=$'\n\n**Production Deployment**'
          BODY+=$'\n'
          BODY+=$'\n### 📋 Changes'
          BODY+=$'\n'
          BODY+=$'\n'"${COMMIT_LOG}"
          BODY+=$'\n\n### 🔗 Links'
          BODY+=$'\n- [Production URL](https://script.google.com/macros/d/${{ secrets.PROD_SCRIPT_ID }}/usercache)'
          BODY+=$'\n- [Commit](https://github.com/${{ github.repository }}/commit/${{ github.sha }})'
          BODY+=$'\n- [Deployer](${{ github.server_url }}/${{ github.actor }})'
          BODY+=$'\n\n### ℹ️ Deployment Info'
          BODY+=$'\n- **Deployed by:** ${{ github.actor }}'
          BODY+=$'\n- **Timestamp:** $(date -u +'%Y-%m-%dT%H:%M:%SZ')'
          BODY+=$'\n- **Commit:** ${{ github.sha }}'
          
          # Save to file for next step
          echo "$BODY" > /tmp/release_body.txt
          cat /tmp/release_body.txt
      
      - name: Create Git tag
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git tag -a "v${{ github.event.inputs.version }}" -m "Production Release v${{ github.event.inputs.version }}"
          git push origin "v${{ github.event.inputs.version }}"
      
      - name: Create GitHub Release
        id: create-release
        uses: ncipollo/release-action@v1
        with:
          tag: v${{ github.event.inputs.version }}
          name: Release v${{ github.event.inputs.version }}
          bodyFile: /tmp/release_body.txt
          draft: false
          prerelease: false
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Notify deployment success
        if: success()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.repos.createCommitComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              commit_sha: context.sha,
              body: `✅ **Production Release v${{ github.event.inputs.version }}** deployed successfully!\n\n🔗 [View Release](https://github.com/${{ github.repository }}/releases/tag/v${{ github.event.inputs.version }})\n\n📍 [Production URL](https://script.google.com/macros/d/${{ secrets.PROD_SCRIPT_ID }}/usercache)`
            })
      
      - name: Notify deployment failure
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.repos.createCommitComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              commit_sha: context.sha,
              body: `❌ **Production Release v${{ github.event.inputs.version }}** failed!\n\n[View logs](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})`
            })
```

### GitHub Secrets Configuration

Configure these secrets in GitHub repository settings (Settings → Secrets and Variables → Actions):

| Secret Name | Value | Notes |
|---|---|---|
| `CLASP_TOKEN` | Content of `~/.clasprc.json` | Run `clasp login` locally, copy token |
| `TEST_SCRIPT_ID` | Script ID from GAS Editor | For TEST deployment preview URL |
| `TEST_DEPLOYMENT_ID` | Deployment ID from GAS | For TEST preview endpoint |
| `PROD_SCRIPT_ID` | Script ID from GAS (prod) | For PRODUCTION URL in release notes |
| `PROD_DEPLOYMENT_ID` | Deployment ID from GAS (prod) | For PRODUCTION versioned deploy |

**How to Get Secrets:**

1. **CLASP_TOKEN:**
   ```bash
   clasp login
   cat ~/.clasprc.json
   # Copy entire JSON content as secret
   ```

2. **Script IDs & Deployment IDs:**
   - Go to Google Apps Script Editor
   - Project Settings → View Script ID (for PROD/TEST_SCRIPT_ID)
   - Deploy → Manage Deployments → Copy Deployment ID (for PROD/TEST_DEPLOYMENT_ID)

### Production Environment Protection

Lock production deployments with GitHub Environment Rules:

**Settings → Environments → production:**

1. ✅ **Required reviewers** - At least 1 trusted approver
2. ✅ **Deployment branches** - `main` only
3. ✅ **Protection rules** - Require status checks to pass

### Workflow Execution Flow

#### Scenario 1: Feature Branch PR

```
1. Push to feature branch
   ↓
2. GitHub Actions runs Jest tests
   ↓
3. If tests PASS → "Deploy to TEST" runs automatically
   ↓
4. Comment added to PR with test URL + deployment info
   ↓
5. Code review + approval
   ↓
6. Merge to main
```

#### Scenario 2: Merge to Main

```
1. PR merged to main
   ↓
2. Tests run automatically
   ↓
3. If tests pass → Deploy to TEST environment
   ↓
4. Ready for manual production approval
```

#### Scenario 3: Production Release

```
1. Manual trigger: Actions → "Deploy to PRODUCTION" → Run Workflow
   ↓
2. Enter version (e.g., "1.2.3") + optional release notes
   ↓
3. GitHub checks version format validity
   ↓
4. Requires production environment approval (1+ reviewer)
   ↓
5. Deploy to production GAS
   ↓
6. Git tag created: v1.2.3
   ↓
7. GitHub Release created with:
    - Auto-generated changelog (commits since last release)
    - Links to production URL
    - Deployer info & timestamp
   ↓
8. Commit comment posted with release link
```

### Release Management

#### Manual Production Deployments

**When to Deploy to Production:**

- All tests passing
- Code reviewed and approved
- Changes tested in TEST environment
- Release notes prepared (optional)

**How to Trigger:**

1. Go to your GitHub repo
2. Click **Actions** tab
3. Select **Deploy to PRODUCTION** workflow
4. Click **Run workflow**
5. Enter version (e.g., `1.2.3`)
6. Optionally add custom release notes
7. Click **Run workflow**
8. Wait for environment approval (if configured)
9. Approve in the workflow run page if prompted

**Result:**
- ✅ Code deployed to Google Apps Script (production)
- ✅ Git tag `v1.2.3` created
- ✅ GitHub Release created with changelog
- ✅ Deployment tracked in release history

#### Viewing Releases

1. Go to repo → **Releases** tab
2. View all production deployments with changelogs
3. Click release to see deployment details & commits
4. Download release assets if needed

#### Rollback Strategy

If production has issues:

1. **Quick Rollback (via GAS Editor):**
   - Go to Google Apps Script Editor
   - Deployments → Select previous working deployment
   - Redeploy manually

2. **Versioned Rollback (via GitHub Actions):**
   - Revert problematic commit: `git revert <commit>`
   - Create new release version (e.g., `1.2.4`)
   - Run production deployment workflow
   - New deployment will be created, old version stays in history

### Secrets & Security Best Practices

1. **CLASP_TOKEN:**
   - Never share or commit to repo
   - Rotate periodically (logout from clasp, re-authenticate)
   - Use separate credentials per environment if possible

2. **Deployment IDs:**
   - Can be rotated by creating new deployments in GAS Editor
   - Update secrets after rotation

3. **Access Control:**
   - Use GitHub environment approvals for production
   - Limit production signers to core team members

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




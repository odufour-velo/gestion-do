# GitHub Actions & CI/CD Setup Guide

This guide helps you set up the automated testing and deployment pipeline using GitHub Actions.

## 📋 Prerequisites

- GitHub repository connected to your project
- Google Apps Script project with Clasp configured
- Google Account with appropriate permissions

## 🔑 Step 1: Collect Required Secrets

Before adding secrets to GitHub, gather the following information:

### 1.1 Get `CLASP_TOKEN`

```bash
# Follow the Clasp authentication flow
clasp login

# Extract token from the credentials file
cat ~/.clasprc.json

# Output will look like:
# {
#   "token": "1/XXXXXXXXXXXXXXXXXXXXX",
#   "type": "authorized_user",
#   ...
# }

# Copy the entire JSON content
```

### 1.2 Get Script IDs & Deployment IDs

#### For TEST Environment:

1. Go to **Google Apps Script Editor** (https://script.google.com/)
2. Select your **TEST** script (or create one)
3. Click **Project Settings** (gear icon)
4. Copy **Script ID** → This is `TEST_SCRIPT_ID`
5. Click **Deploy** button
6. Click **Manage Deployments**
7. Find or create a **Preview** deployment
8. Copy the **Deployment ID** → This is `TEST_DEPLOYMENT_ID`

#### For PRODUCTION Environment:

Repeat the same steps for your PRODUCTION script:
- Script ID → `PROD_SCRIPT_ID`
- Production Deployment ID → `PROD_DEPLOYMENT_ID`

**Example Deployment IDs:**
- Test: `AKfycbwDcFNWfIRDqyVyTV3_FNeWxRECAvGY81XL1bivDaWZrQxjsGV_ojbbaAVLuwBVbwbEhw`
- Prod: `AKfycb...` (different ID)

---

## 🔒 Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these 5 secrets one by one:

| Secret Name | Value | Where to Find |
|---|---|---|
| `CLASP_TOKEN` | Full JSON from `~/.clasprc.json` | From step 1.1 |
| `TEST_SCRIPT_ID` | Script ID of test project | GAS Editor → Project Settings |
| `TEST_DEPLOYMENT_ID` | Deployment ID of test preview | GAS Editor → Deployments |
| `PROD_SCRIPT_ID` | Script ID of production project | GAS Editor → Project Settings |
| `PROD_DEPLOYMENT_ID` | Deployment ID of production deploy | GAS Editor → Deployments |

### Example Secret Content for CLASP_TOKEN:

```json
{"token":"1/XXXXXXXXXXXXXXXXXXX","type":"authorized_user","client_id":"XXXXX.apps.googleusercontent.com","client_secret":"XXXXXX","refresh_token":"1//XXXXXXXXXXXXXXXX"}
```

---

## 🌳 Step 3: Configure Branch Protection (Optional but Recommended)

Protect the `main` branch to prevent accidental deployments:

1. Go to **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Enter `main` as the branch name pattern
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Select `Tests` workflow
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Include administrators

---

## 🔐 Step 4: Configure Production Environment

Add approval workflow for production deployments:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it `production`
4. Under **Deployment branches**, select `main` only
5. Under **Required reviewers**, add at least 1 trusted team member
6. Click **Save protection rules**

Now every production deployment requires approval from the chosen reviewer(s).

---

## 🚀 Step 5: Test the Workflows

### Test the Test Workflow:

1. Create a feature branch: `git checkout -b feature/test-ci`
2. Make a minor change to any file
3. Push: `git push origin feature/test-ci`
4. Create a Pull Request
5. Watch the **Actions** tab:
   - ✅ Tests should run
   - ✅ If passing, TEST deployment should trigger
   - ✅ Comment should appear on PR with test URL

### Test Production Workflow:

1. Merge a PR to `main`
2. Go to **Actions** tab
3. Click **Deploy to PRODUCTION** workflow
4. Click **Run workflow**
5. Enter a version (e.g., `1.0.0`)
6. Optional: Add release notes
7. Click **Run workflow**
8. If production environment is configured, approve the deployment
9. Check:
   - ✅ Code deployed to production GAS
   - ✅ Git tag `v1.0.0` created
   - ✅ GitHub Release created with changelog
   - ✅ Commit comment posted with release link

---

## 📊 Monitoring Workflows

### View Workflow Status

1. Go to your repo → **Actions** tab
2. See all workflows and their status
3. Click on a workflow to see detailed logs
4. Click on a job to see step-by-step execution

### Troubleshooting Common Issues

#### ❌ "Invalid CLASP_TOKEN"

**Solution:**
```bash
# Re-authenticate locally
clasp logout
clasp login

# Extract new token
cat ~/.clasprc.json

# Update the CLASP_TOKEN secret in GitHub
```

#### ❌ "Deployment ID not found"

**Solution:**
- Verify the Deployment ID exists in GAS Editor
- Check for typos in the secret value
- Confirm you're using the deployment endpoint (not the active deployment)

#### ❌ "Tests failed, deployment skipped"

**Solution:**
- Fix the failing tests locally: `make test-unit`
- Commit and push
- Workflow will retry automatically

#### ❌ "Permission denied"

**Solution:**
- Verify CLASP_TOKEN has full Google Drive and Apps Script permissions
- Re-authenticate and update token

---

## 📝 Using GitHub Releases

After a production deployment:

1. Go to repo → **Releases** tab
2. View all production deployments
3. Each release includes:
   - Version number (v1.2.3)
   - Full changelog (commits since last release)
   - Deployment date and deployer
   - Links to production URL
   - GitHub Actions logs

## 🔄 Rollback Strategy

If production has issues:

### Quick Rollback:

1. Go to Google Apps Script Editor
2. Click **Deployments**
3. Find the previous working version
4. Click the 3-dot menu → **Manage**
5. Click the version number to redeploy

### Full Rollback with Versioning:

1. Revert the problematic commit: `git revert <commit-hash>`
2. Push to main
3. Go to **Actions** → **Deploy to PRODUCTION**
4. Enter a new patch version (e.g., `1.2.4`)
5. Run the workflow
6. New deployment created, previous version remains in history

---

## 🎯 Best Practices

1. **Always test locally first:**
   ```bash
   make test-unit
   make server-dev-docker
   ```

2. **Use semantic versioning:** `major.minor.patch`

3. **Write descriptive commit messages:**
   ```
   feat: Add new event category field
   fix: Correct date validation logic
   ```

4. **Use production environment approvals** to prevent accidental deployments

5. **Review release notes** before deploying to production

6. **Keep CLASP_TOKEN secure** - never commit it or share it

7. **Rotate secrets periodically** - re-authenticate every 3 months

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Google Apps Script Clasp](https://developers.google.com/apps-script/guides/clasp)

---

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs: repo → **Actions** → click failed workflow
2. Read error messages carefully
3. Search for similar issues in repository issues
4. Contact the development team

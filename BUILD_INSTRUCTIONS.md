# Build & Release Instructions

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update package.json with your GitHub repo:**
   - Replace `YOUR_USERNAME` with your GitHub username
   - Replace `YOUR_REPO_NAME` with your repository name

## Building the Installer

### For local testing:
```bash
npm run build:win
```

This creates an installer in `dist/` folder.

### For publishing updates to GitHub:
```bash
npm run publish
```

This builds and uploads the release to GitHub.

## GitHub Setup for Auto-Updates

1. **Create a GitHub repository** for your app

2. **Create a GitHub Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Copy the token

3. **Set environment variable:**
   ```bash
   # Windows PowerShell:
   $env:GH_TOKEN="your_github_token_here"
   
   # Or add to system environment variables permanently
   ```

4. **Create first release:**
   ```bash
   npm run publish
   ```

## How Auto-Update Works

1. App checks for updates on startup (after 3 seconds)
2. If update is available, it downloads automatically in background
3. User sees notification with download progress
4. When download completes, user can click "Install Now" or it will install on next restart
5. Next time they open the app, it will be the latest version

## Version Updates

To release a new version:

1. Update version in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. Commit and push changes to GitHub

3. Build and publish:
   ```bash
   npm run publish
   ```

4. This creates a new GitHub release with the installer
5. All users will be notified and can update automatically

## File Structure

- `dist/` - Built installers (gitignored)
- `assets/icon.png` - App icon (256x256 PNG)
- `main.js` - Electron main process with auto-updater
- `package.json` - Build configuration

## Notes

- Users need to install the app from the first release manually
- After that, all updates are automatic
- Updates download silently in the background
- Installation requires app restart (automatic on quit)

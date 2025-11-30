# 🚀 Quick Start Guide - Publishing & Auto-Updates

## How It Works

### First Install (One Time Only)
1. You build the installer: `npm run publish`
2. Download `BLRPC-Control-Room-Setup-1.0.0.exe` from GitHub Releases
3. Send this `.exe` file to your users (Discord, Google Drive, etc.)
4. Users run the installer once - that's it!

### Every Update After (Automatic!)
1. You make changes to the code
2. Update version in `package.json` (e.g., 1.0.0 → 1.0.1)
3. Run `npm run publish`
4. **Users get the update automatically** - no reinstall needed!
   - App checks for updates on startup
   - Downloads silently in background
   - Shows "Update Ready" notification
   - One click to install
   - App restarts with new version

**Users never need to reinstall or download another .exe file!**


Edit `package.json` and replace these placeholders:
- Line 15: `"url": "https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"`
- Line 30: `"owner": "YOUR_USERNAME"`
- Line 31: `"repo": "YOUR_REPO_NAME"`
- Line 51: `"owner": "YOUR_USERNAME"`
- Line 52: `"repo": "YOUR_REPO_NAME"`

Example:
```json
"url": "https://github.com/jamie123/BLRPC-CAD.git"
"owner": "jamie123"
"repo": "BLRPC-CAD"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Name your repository (e.g., "BLRPC-CAD")
3. Choose **Public** or **Private** (both work!)
4. Don't initialize with README (we already have one)
5. Click "Create repository"

**Note:** Private repos work perfectly with the GitHub token for auto-updates!

## Step 3: Get GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it "BLRPC CAD Releases"
4. Check the `repo` scope (full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

## Step 4: Set up Git locally

Open PowerShell in your project folder:

```powershell
# Set your GitHub token as environment variable (replace with YOUR token)
$env:GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - BLRPC Control Room CAD System v1.0.0"

# Add your GitHub repo as remote (replace with YOUR details)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 5: Build and Publish First Release

```powershell
# Make sure GH_TOKEN is still set
$env:GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# Build and publish
npm run publish
```

This will:
- Build the Windows installer
- Create a GitHub release tagged "v1.0.0"
- Upload the installer file
- Users can download from the Releases page

## Step 6: Share with Users

Your installer will be available at:
```
https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/releases
```

Users download and run `BLRPC-Control-Room-Setup-1.0.0.exe`

## Releasing Updates

When you make changes:

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Commit changes**:
   ```powershell
   git add .
   git commit -m "Update to v1.0.1 - Bug fixes and improvements"
   git push
   ```

3. **Publish new release**:
   ```powershell
   $env:GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
   npm run publish
   ```

4. **All users get notified automatically!**
   - App checks for updates on startup
   - Downloads in background
   - Shows "Update ready" notification
   - One-click install

## What's Been Set Up

✅ **Auto-updater** - Checks GitHub for new releases  
✅ **Installer** - NSIS-based Windows installer  
✅ **Update notifications** - In-app update alerts  
✅ **Background downloads** - Silent update downloads  
✅ **One-click install** - Easy update installation  
✅ **Version display** - Shows current version on login screen  
✅ **GitHub releases** - Automatic release creation  

## Troubleshooting

**Error: "GH_TOKEN is not set"**
```powershell
$env:GH_TOKEN="your_token_here"
```

**Error: "Repository not found"**
- Check your GitHub token has `repo` scope
- Check owner/repo names in package.json
- Make sure token hasn't expired

**Error: "Permission denied"**
- Check your GitHub token has `repo` scope
- Generate a new token if needed

## Files Added/Modified

- ✅ `package.json` - Build configuration
- ✅ `main.js` - Auto-updater logic
- ✅ `index.html` - Update notification UI
- ✅ `app.js` - Update event handlers
- ✅ `BUILD_INSTRUCTIONS.md` - Detailed build guide
- ✅ `.gitignore` - Updated for builds

## Important Notes

⚠️ **Token Security**: Never commit your GH_TOKEN to git  
⚠️ **Private Repos**: Work perfectly! Token provides access  
⚠️ **First Install**: Users must manually install v1.0.0  
⚠️ **After That**: All updates are automatic!  

## Need Help?

See `BUILD_INSTRUCTIONS.md` for detailed information.

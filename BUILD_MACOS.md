# Building macOS Installer

## Requirements
- macOS computer (Intel or Apple Silicon)
- Node.js installed

## Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ABailey2004/BLRPC_EOC.git
   cd BLRPC_EOC
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the macOS installer:**
   ```bash
   npm run build:mac
   ```

4. **Find the installer:**
   The installer files will be in the `dist` folder:
   - `BLRPC Control Room-1.0.0.dmg` - Main installer
   - `BLRPC Control Room-1.0.0-mac.zip` - For auto-updates
   - `*.blockmap` files - For auto-updates

5. **Send these files back:**
   - Send the `.dmg` and `.zip` files back to Jamie
   - These will be uploaded to the GitHub release

## Notes
- The build takes a few minutes
- The `.dmg` is what Mac users download and install
- The `.zip` is used by the auto-updater
- Both Intel (x64) and Apple Silicon (arm64) versions are included

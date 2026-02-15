# Character Stats & Growth Extension - Installation & Setup Guide

## Table of Contents
1. [Installation Methods](#installation-methods)
2. [First-Time Setup](#first-time-setup)
3. [Verification Steps](#verification-steps)
4. [Troubleshooting](#troubleshooting)

## Installation Methods

### Method 1: Git Clone (Recommended for Updates)
```bash
# Navigate to your SillyTavern extensions directory
# Windows:
cd "path\to\SillyTavern\public\scripts\extensions\third-party"

# Linux/Mac:
cd ~/path/to/SillyTavern/public/scripts/extensions/third-party

# Clone the repository
git clone https://github.com/yourusername/character-stats-extension.git
cd character-stats-extension
npm install
```

### Method 2: Manual File Installation
1. **Download the files** - Download all files from the repository
2. **Create folder** - Create a new folder:
   - `SillyTavern/public/scripts/extensions/third-party/character-stats-extension/`
3. **Place files** in that folder:
   ```
   character-stats-extension/
   ├── manifest.json
   ├── index.js
   ├── styles.css
   ├── settings.html
   ├── README.md
   └── INSTALL.md
   ```
4. **Restart SillyTavern**

### Method 3: Package Manager (When Available)
```bash
# If SillyTavern adds package management:
st install character-stats-extension
```

## First-Time Setup

### Step 1: Verify Installation
1. Open SillyTavern
2. Click on **Extensions** (icon on top toolbar)
3. Look for "Character Stats & Growth" in the list
4. Should show as "loaded" (green indicator)

### Step 2: Enable the Extension
1. Navigate to any character chat
2. Look for the **Character Stats** panel in the **bottom-right corner**
3. Verify panel shows these buttons:
   - ☑ Enable Stats (checkbox)
   - + Stat
   - Grow Stats
   - Scale Compare
   - Reset

### Step 3: Configure Settings (Optional)
1. Go to **Extensions** menu
2. Click **Settings**
3. Scroll to find "Character Stats & Growth Settings"
4. Review the features and options
5. Settings are pre-configured; no changes needed to start

### Step 4: Add Your First Stat
1. In the Stats panel, click **Enable Stats**
2. Click **+ Stat**
3. Enter stat name: `height`
4. Enter value: `5.8` (in feet)
5. Press OK
6. Stat appears in the panel under "Physical" category

### Step 5: Test Prompt Injection
1. Add a few stats (height, strength, health)
2. Send a message in chat
3. The AI will include stats in its response context
4. Verify the AI acknowledges the stats

## Verification Steps

### Checklist for Successful Installation

- [ ] Extension appears in Extensions menu
- [ ] Stats panel visible in bottom-right corner
- [ ] Can enable/disable stats checkbox
- [ ] Can add a stat without errors
- [ ] Stats appear in correct category
- [ ] Can grow numeric stats
- [ ] Can compare height scale
- [ ] Closing browser doesn't delete stats
- [ ] Switching characters shows different stats
- [ ] AI references stats in responses

### Console Check (For Debugging)
1. Open Developer Tools: Press `F12`
2. Go to **Console** tab
3. You should see: `"Character Stats & Growth Extension loaded"`
4. No red errors should appear

## File Structure

After installation, your structure should look like:
```
SillyTavern/
├── public/
│   └── scripts/
│       └── extensions/
│           └── third-party/
│               └── character-stats-extension/
│                   ├── manifest.json         (Configuration)
│                   ├── index.js              (Main extension logic)
│                   ├── styles.css            (Styling)
│                   ├── settings.html         (Settings page)
│                   ├── README.md             (Documentation)
│                   ├── INSTALL.md            (This file)
│                   └── package.json          (Development config)
```

## System Requirements

- **SillyTavern**: Version 1.10.0 or higher
- **Browser**: Chrome/Chromium, Firefox, Edge (modern versions)
- **Storage**: ~50KB per character for stats
- **No external dependencies**: Uses vanilla JavaScript

## Network/API Requirements

The extension needs:
- Access to `/api/settings/extension-settings` endpoint (for saving)
- SillyTavern's event system (`eventSource`)
- SillyTavern's context API (`SillyTavern.getContext()`)

These are all standard SillyTavern APIs that every extension uses.

## Troubleshooting Installation

### Issue: Panel Doesn't Appear

**Solution 1: Reload Page**
```
Press F5 (or Cmd+R on Mac)
Wait 5 seconds for page to fully load
Check bottom-right corner
```

**Solution 2: Check Console**
```
Press F12 to open Developer Tools
Go to Console tab
Look for "Character Stats & Growth Extension loaded"
If not there, check for red errors
```

**Solution 3: Verify File Placement**
```
Check that all 4 main files are present:
- manifest.json (required)
- index.js (required)
- styles.css (required)
- settings.html (optional but recommended)
```

**Solution 4: Clear Browser Cache**
```
Close SillyTavern completely
Clear browser cache and cookies (Ctrl+Shift+Delete)
Reopen SillyTavern
Hard refresh (Ctrl+F5)
```

### Issue: Stats Not Saving

**Possible Causes:**
1. Browser storage quota exceeded
2. SillyTavern data folder not writable
3. Browser privacy settings blocking storage

**Solutions:**
```
1. Check available storage:
   Press F12 → Application → Storage → Check quota

2. Verify SillyTavern permissions:
   Windows: Right-click folder → Properties → Uncheck "Read-only"
   Linux/Mac: chmod 755 on folder

3. Check browser settings:
   Privacy → Cookies → Allow local storage for SillyTavern URL
```

### Issue: Stats Panel Overlaps Chat

**Solution: Move Panel**
```
If panel covers input:
1. Drag panel header to move it
2. Or collapse with the − button
3. Or resize browser window
```

### Issue: Growth Calculation Wrong

**Verify numeric format:**
```
✓ Correct: 6.5, 18, 100.5
✗ Wrong: "6 ft", "6.5 feet", "100 HP"

Must be pure numbers for growth to work!
```

## Update Instructions

### If Using Git Clone
```bash
cd character-stats-extension
git pull origin main
# Or git pull origin master (depending on default branch)
Reload SillyTavern (F5)
```

### If Using Manual Installation
1. Backup your current stats (optional):
   ```
   Press F12 → Console
   copy(JSON.stringify(extension_settings['character-stats']))
   Paste into text file
   ```
2. Download new version files
3. Replace old files with new ones
4. Reload SillyTavern (F5)

## Uninstallation

### To Remove Extension

**Method 1: Folder Deletion**
```bash
# Navigate to extensions folder
# Delete character-stats-extension folder
# Restart SillyTavern
```

**Method 2: Disable in Settings**
```
1. Go to Extensions
2. Find Character Stats & Growth
3. Click Disable/Unload button
4. Stats will be preserved if you re-enable later
```

**Note:** Uninstalling preserves your stats data. They'll reappear if you reinstall.

## Backing Up Your Stats

### Automatic Backup (SillyTavern)
SillyTavern automatically backs up extension data. Check:
- Windows: `%APPDATA%/SillyTavern/`
- Linux: `~/.config/SillyTavern/`
- Mac: `~/Library/Application Support/SillyTavern/`

### Manual Backup
```javascript
// In browser console (F12):
copy(JSON.stringify(extension_settings['character-stats']))
// Paste into a text file and save
```

### Restoring Backup
```javascript
// In browser console (F12):
extension_settings['character-stats'] = YOUR_BACKUP_JSON_HERE
// Press Enter
// Reload page
```

## Next Steps

After installation:
1. **Read Quick Start** in README.md
2. **Try a test character** - add some stats
3. **Experiment with growth** - try 5% growth
4. **Test scale comparison** - compare character height
5. **Join Discord** - get support and share feedback

## Support

If you encounter issues:

1. **Check Logs**: F12 → Console → Look for errors
2. **Verify Installation**: Follow Verification Steps above
3. **Review Troubleshooting**: See Troubleshooting section
4. **Post on Discord**: SillyTavern #extensions channel
5. **GitHub Issues**: Create an issue with details

## System Information to Provide for Support

When asking for help, include:
```
- OS: Windows/Linux/Mac
- SillyTavern version: (Check bottom-left corner)
- Browser: Chrome/Firefox/Edge (+ version)
- Console error (if any): (F12 → Console)
- Steps to reproduce issue
```

---

**Installation Complete!** Enjoy tracking your character stats! 🎲

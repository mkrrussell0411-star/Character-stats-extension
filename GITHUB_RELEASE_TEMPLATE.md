# Character Stats & Growth Extension v3.1.0

## 🎯 Summary
Major feature release adding **AI-powered automatic stats updates**. The extension now intelligently parses structured stats from AI responses and automatically updates or creates character stats.

## ✨ Features Added

### 🤖 AI Auto-Update System
- AI automatically outputs stats in structured code blocks
- Extension parses and applies stats automatically
- Creates new stats if they don't exist
- Preserves units (ft, lbs, %, etc.)
- Toggle-able in settings (enabled by default)

### 📊 Enhanced Parsing
- Case-insensitive stat matching
- Filters out example lines automatically
- Extracts numeric values and units intelligently
- Handles various text formats

## 📝 Technical Changes

### New Functions
- `refreshStatsFromChat()` - Main auto-update entry point
- `getLatestStatsUpdateBlock()` - DOM scanning for stats blocks
- `parseStatsCodeblock()` - Key:value pair extraction
- `applyStatsFromCodeblock()` - Stat update/creation logic
- `looksLikeStatsUpdate()` - Block validation

### Modified Files
- `index.js` - Added parsing logic, prompt injection
- `manifest.json` - Version bumped to 3.1.0
- `settings.html` - New UI toggle
- `README.md` - Updated documentation
- **NEW** `CHANGELOG.md` - Full version history
- **NEW** `RELEASE_NOTES.md` - Detailed release info

## 🔄 Breaking Changes
**None.** This is a fully backward-compatible update.

## 🐛 Fixes & Improvements
- More efficient MutationObserver handling
- Better error logging for debugging
- Cleaner console output (removed spam logs)
- Improved prompt instruction clarity

## 📦 Installation
- **New Users**: Follow standard install in README.md
- **Existing Users**: Pull latest and reload SillyTavern

## 🧪 Testing
Recommended test scenario:
1. Create a character with initial "Height: 6 ft"
2. Ask AI: "Make me 10 feet tall"
3. AI should output stats update block
4. Extension auto-updates Height stat
5. Create new "Weight: 1000 lbs" stat if AI mentions it

## 📚 Documentation
- See `README.md` for usage instructions
- See `CHANGELOG.md` for full version history
- See `RELEASE_NOTES.md` for detailed feature overview

## ❤️ Credits
Built with ❤️ for the SillyTavern community

---

**To use this release:**
1. Download/update to v3.1.0
2. Reload SillyTavern
3. Optional: Enable "Auto-update stats from AI" in Settings
4. Enjoy automatic stat tracking!

For issues, questions, or suggestions: Open a GitHub issue or visit the SillyTavern Discord.

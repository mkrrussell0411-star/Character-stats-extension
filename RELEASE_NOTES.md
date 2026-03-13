# Character Stats & Growth Extension v3.1.0 Release Notes

## 🎉 What's New

### AI-Powered Automatic Stats Updates
The extension now intelligently requests the AI to output structured stats updates, which are automatically parsed and applied to your character tracker. This creates a seamless feedback loop where:

1. **Prompt Injection**: Extension asks AI to output stats in code blocks
2. **AI Response**: AI includes `<stats_update>` block with current character stats
3. **Auto-Parse**: Extension extracts stats from the block
4. **Auto-Apply**: Stats are updated or new ones are created automatically

### Key Features
✨ **Auto-Create Stats**: The extension creates new stats if they don't exist
📊 **Smart Parsing**: Handles various formats, preserves units (ft, lbs, etc.)
⚙️ **User Control**: Toggle "Auto-update from AI" in settings
🔍 **Case-Insensitive**: Works regardless of capitalization

## 📋 Installation

### For New Users
1. Follow the standard installation instructions in README.md
2. Add your first stat
3. Enable "Auto-update stats from AI" in Settings (optional, enabled by default)

### For Existing Users (Updating from 3.0.x)
1. Pull the latest changes: `git pull`
2. Reload SillyTavern
3. No database migration needed - all existing stats preserved
4. New setting is enabled by default

## 🚀 Quick Start with New Feature

1. **Add a stat**: Click "+ Stat" and create "Height: 6.5 ft"
2. **Generate a response**: Ask the AI something like "Make me 10 feet tall"
3. **Watch it update**: If enabled, stats auto-update from AI's response
4. **Manual refresh**: Or run `csRefreshStats()` in browser console

## 📝 What's Being Sent to the AI

The extension injects this prompt instruction:

```
IMPORTANT: After your reply, output a code block with ALL relevant character stats in this exact format:

```
<stats_update>
Height: 6.5 ft
Weight: 180 lbs
Strength: 18
</stats_update>
```

Include ONLY actual stats (not examples). One stat per line. Create new stats as needed.
```

## 🔧 Technical Details

### New Functions
- `refreshStatsFromChat()` - Main entry point for auto-update
- `getLatestStatsUpdateBlock()` - Scans DOM for stats blocks
- `parseStatsCodeblock()` - Extracts key:value pairs
- `applyStatsFromCodeblock()` - Updates or creates stats
- `looksLikeStatsUpdate()` - Validates code blocks

### New Settings
- `prefs.autoUpdateFromAI` (boolean, default: true)

### Modified Functions
- `wrapFetch()` - Now injects stats update prompt
- `setupChatMonitoring()` - Calls new parsing functions

## 🐛 Troubleshooting

**AI isn't outputting the stats block?**
- Check the AI model supports the instruction (GPT-4, Claude recommended)
- Manually ask: "Output your current stats in the format I specified"

**Stats not updating?**
- Enable "Auto-update stats from AI" in Settings
- Check browser console (F12) for `[character-stats]` logs
- Try manual refresh: `csRefreshStats()` in console

**New stats not being created?**
- Ensure the AI outputs the stat name exactly as intended
- Check the parsed data with `csRefreshStats()` logs

## 📦 Files Changed
- `index.js` - Main extension file (added parsing functions, prompt injection)
- `manifest.json` - Version bumped to 3.1.0
- `settings.html` - New UI toggle for auto-update feature
- `README.md` - Updated with new feature documentation
- `CHANGELOG.md` - Full version history (NEW)
- `RELEASE_NOTES.md` - This file (NEW)

## 🔄 Backward Compatibility
✅ **100% Compatible** - No breaking changes
✅ All existing stats preserved
✅ All existing features unchanged
✅ Feature is optional (can be disabled)

## 📈 Performance Impact
- Minimal: Only adds DOM scanning when chat updates
- Uses `requestAnimationFrame` for efficiency
- No additional API calls
- ~5-10ms overhead per chat update

## 🙏 Credits

Built with ❤️ for the SillyTavern community

## 📞 Support

- Report issues on GitHub
- Check Troubleshooting section in README.md
- Visit SillyTavern Discord #extensions channel

---

**Happy roleplaying!** 🎭

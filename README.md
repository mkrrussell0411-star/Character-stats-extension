# Character Stats & Growth Extension for SillyTavern

A powerful SillyTavern extension that enables comprehensive character stat tracking, growth mechanics, and real-world scale comparisons. Track character statistics, watch them grow, and automatically inject contextual information into your prompts.

## Features

### 📊 Stat Tracking
- Add unlimited custom stats for each character
- Stats are organized into four categories: Physical, Mental, Skills, and Other
- Support for both numeric and text values
- Remove stats individually as needed

### 📈 Growth Mechanics
- Grow all numeric stats by a percentage with a single click
- Flexible growth percentage (5%, 10%, 15%, custom)
- Automatic stat updates across all numeric values

### 📏 Real-World Scale Comparisons
- Compare character height to realistic references:
  - Average Human (5.8 ft / 177 cm)
  - Short Human (5.0 ft / 152 cm)
  - Tall Human (6.5 ft / 198 cm)
  - D&D Giant (10.0 ft / 304 cm)
  - D&D Dwarf (4.0 ft / 122 cm)
  - D&D Elf (5.5 ft / 168 cm)
- Prevent unrealistic power scaling (e.g., 6ft character isn't 3x taller than 8ft character)
- Display comparisons in both feet and centimeters
### Screenshot of Function
<img width="1659" height="794" alt="Screenshot 2026-02-15 172850" src="https://github.com/user-attachments/assets/4a4e88b6-5a7c-420e-b902-7a056d40f5ea" />

### Screenshot Of New Features
<img width="1659" height="794" alt="Image" src="https://github.com/user-attachments/assets/65847b1e-7d21-4482-84b8-a1c0946f1bdf" />

### 💬 Prompt Injection & AI Auto-Update
- Automatically inject stats into prompts when enabled
- Format: `[Character Stats: Height: 6.5 ft, Strength: 18, Health: 100 HP]`
- Inject scale comparison data for height context
- Seamless integration with SillyTavern's prompt system
- **Auto-update stats from AI responses**: AI can output structured stats updates that are automatically parsed and applied
  - AI outputs stats in code blocks with optional character routing: `<stats_update>Character: Name\nHeight: 6.5 ft\nWeight: 180 lbs</stats_update>`
  - Extension automatically updates existing stats or creates new ones
  - Multiple characters in one response: one `<stats_update>` block per character
  - Can be toggled on/off in settings

### 🎨 User Interface
- Floating stats panel (top-left corner, minimizable)
- **Per-character tabs**: View and edit stats for multiple characters in the same conversation (the main character, user, and any NPCs)
- Responsive design for mobile devices
- Light/dark mode support

## Installation

### Method 1: Direct Clone
```bash
cd /path/to/SillyTavern/public/scripts/extensions/third-party
git clone https://github.com/yourusername/character-stats-extension.git
cd character-stats-extension
npm install
```

### Method 2: Manual Installation
1. Download the extension files
2. Create a folder named `character-stats-extension` in:
   - Windows: `SillyTavern\public\scripts\extensions\third-party\`
   - Linux/Mac: `SillyTavern/public/scripts/extensions/third-party/`
3. Place the files in that folder:
   - `manifest.json`
   - `index.js`
   - `styles.css`
   - `settings.html`
   - `README.md`
   - `INSTALL.md`
4. Restart SillyTavern

### Method 3: Install From SillyTavern Extension Installer
- Open SillyTavern
- Go to Extensions → Install extension
- Put this in the box:
  ```
  https://github.com/mkrrussell0411-star/Character-stats-extension
  ```
- Click Install

**For official SillyTavern extension documentation, see:** https://docs.sillytavern.app/for-contributors/writing-extensions/

## Usage

### Quick Start
1. Open SillyTavern and select a character
2. Look for the **Character Stats** panel in the **top-left corner**
3. Click a **character tab** to view that character's stats (main character, User, or NPCs)
4. Click **+ Stat** to add your first stat to the selected tab
5. Enter stat name (e.g., "height", "strength")
6. Enter the value (e.g., 6, 18)

### Adding Stats
- Click a **character tab** to select which character gets the stat
- Click **+ Stat**
- Enter the stat name (spaces will be converted to underscores)
- Enter the value (can be a number or text)
- Enter Unit Of Measurment (optional)
- Stats are saved per-character and isolated from other characters' stats

### Growing Stats
1. Click **Grow Stats**
2. Enter growth percentage (e.g., 5 for 5% growth)
3. All numeric stats increase by that percentage
4. Text-based stats are unaffected

Example:
```
Before Growth:  Height: 6.0 ft, Strength: 16, Health: 100 HP
Growth: +5%
After Growth:   Height: 6.3 ft, Strength: 16.8, Health: 105 HP
```

### Scale Comparison
1. Click **Scale Compare**
2. A dialog shows how your character's height compares to references
3. Click **Inject into Prompt** to add the comparison to your prompts
4. The AI will reference the scale information when responding

Example output:
```
Your character is 6.5 ft tall

Average Human: 1.12x taller
Short Human: 1.30x taller
Tall Human: 1.00x the same height
Giant (D&D): 0.65x shorter
Dwarf (D&D): 1.63x taller
Elf (D&D): 1.18x taller
```

### Removing Stats
- Click the **✕** button next to any stat to remove it
- Stats are removed immediately and can be re-added

### Auto-Update Stats from AI
1. In Settings, enable **"Auto-update stats from AI `<stats_update>` blocks"**
2. When you generate a response, the extension instructs the AI to output stats in a structured format
3. The AI responds with stats in code blocks, one per character:
   ```
   <stats_update>
   Character: Emily
   Height: 6.5 ft
   Weight: 180 lbs
   Strength: 18
   </stats_update>

   <stats_update>
   Character: Bob
   Height: 5.8 ft
   Strength: 16
   </stats_update>
   ```
4. The extension automatically parses these blocks and:
   - **Routes stats to the correct character** based on the `Character: Name` line
   - **Updates existing stats** with new values
   - **Creates new stats** if they don't exist in the tracker
   - **Creates new character tabs** for NPCs mentioned in stats updates
   - Preserves units (ft, lbs, etc.)
   - If no `Character:` line is present, stats update the currently active SillyTavern character

Example:
```
AI Output:
<stats_update>
Character: Emily
Height: 7.0 ft
Weight: 200 lbs
</stats_update>

<stats_update>
Character: Bob
Height: 5.9 ft
Strength: 17
</stats_update>

Result:
- Emily's Height updated: 6.5 ft → 7.0 ft
- Emily's Weight updated: 180 lbs → 200 lbs
- Bob's Height created: 5.9 ft (new)
- Bob's Strength created: 17 (new)
- Two tabs appear: Emily and Bob
```

### Character Name Routing
The `Character: Name` line in `<stats_update>` blocks determines which character receives the stats:
- `Character: You`, `Character: Me`, `Character: Player`, or `Character: User` → User tab
- `Character: Emily`, `Character: Bob`, etc. → Creates/updates character-specific tabs
- No `Character:` line → Stats go to the current SillyTavern character

### Reset All Stats
- Click **Reset**
- Confirm the action
- **All character tabs are deleted** and reset to the global tab only
- All stats across all characters are cleared
- ⚠️ This action cannot be undone

## How Prompt Injection Works

### Automatic Stat Injection
When "Enable Stats" is checked, stats from all characters are automatically added to the prompt in labeled blocks:

```
[Character Stats — Emily: Height: 6.5 ft | Strength: 18 | Health: 100 HP]
[Character Stats — User: Intelligence: 14 | Wisdom: 16]
```

This helps the AI understand all characters' capabilities and appearance simultaneously.

### Scale Comparison Injection
When you click "Inject into Prompt" in the Scale Compare dialog:

```
[Character Physical Reference: This character is 6.5 feet tall. That is 1.12x the height of an Average Human. That is 1.30x the height of a Short Human. That is 1.00x the same height as a Tall Human. That is 0.65x the height of a Giant. That is 1.63x the height of a Dwarf. That is 1.18x the height of an Elf.]
```

This ensures consistent scaling in the AI's responses.

## Troubleshooting

### Stats Panel Not Appearing
- Check that the extension is enabled in Extensions menu
- Reload the page (F5 or Cmd+R)
- Check browser console (F12) for errors

### Stats Not Being Injected
- Verify "Enable Stats" is checked
- Ensure stats are actually added (panel shows stats)
- Check that you're using a compatible API (OpenAI-compatible APIs work best)
- See official docs: https://docs.sillytavern.app/usage/prompts/

### Height Comparison Not Working
- Height stat must be a number (e.g., 6.5, not "6 foot 5 inches")
- Use decimal format (5.8 for 5'10")
- Ensure stat is named "height" or contains "height"

### Stats Lost After Reload
- Check browser's local storage is enabled
- Ensure SillyTavern can write to its data folder
- Try exporting stats before troubleshooting

### AI Auto-Update Not Working
- Verify "Auto-update stats from AI" is enabled in Settings
- Check that the AI is actually outputting the `<stats_update>` blocks in its response
- Ensure each block includes a `Character: Name` line (or at least the first line after `<stats_update>`)
- Ensure stats are named consistently with what the AI outputs
- Open browser console (F12) and look for `[character-stats]` logs
- The AI model must support the prompt instruction (GPT-4, Claude, etc. work best)
- Try manually calling `csRefreshStats()` in browser console to test parsing
- If multiple characters aren't creating separate tabs, check that each has its own `<stats_update>` block

## Contributing

Found a bug? Have a feature idea? Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support & Contact

- **Official SillyTavern Docs**: https://docs.sillytavern.app/
- **Discord**: SillyTavern Discord #extensions channel
- **Reddit**: r/SillyTavernAI
- **GitHub Issues**: Report bugs and feature requests

## License

This extension is released under the MIT License - see LICENSE file for details.

**Made with ❤️ for the SillyTavern community**

For official SillyTavern extension documentation: https://docs.sillytavern.app/for-contributors/writing-extensions/
For SillyTavern documentation repo: https://github.com/SillyTavern/SillyTavern-Docs


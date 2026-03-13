# Changelog

All notable changes to the Character Stats & Growth Extension will be documented in this file.

## [3.1.0] - 2026-03-13

### Added
- **AI Auto-Update Feature**: Extension now instructs the AI to output structured stats updates
  - AI outputs stats in code blocks: `<stats_update>StatName: Value Unit</stats_update>`
  - Extension automatically parses and applies stats from AI responses
  - Automatically creates new stats if they don't exist in the tracker
  - Preserves units when updating numeric stats
  - Toggle-able setting in extension settings panel

- **Enhanced Stat Parsing**
  - Case-insensitive stat name matching
  - Automatic stat creation from AI outputs
  - Smart unit extraction and preservation
  - Filters out example lines from parsed data

### Changed
- Updated prompt injection to include stats update instructions
- Improved chat monitoring with MutationObserver
- Better error handling and validation

### Technical
- Added `refreshStatsFromChat()` function for structured parsing
- Added `parseStatsCodeblock()` for key:value extraction
- Added `applyStatsFromCodeblock()` for stat application and creation
- Added `getLatestStatsUpdateBlock()` for DOM scanning
- Added `looksLikeStatsUpdate()` for block validation
- Preference `autoUpdateFromAI` added (default: true)

## [3.0.8] - Previous Release

### Features
- Track unlimited custom stats per character
- Stat organization (Physical, Mental, Skills, Other)
- Percentage-based growth mechanics
- Real-world height scale comparisons
- Prompt injection system
- Character-specific stat persistence
- Floating UI panel with minimization

---

## Installation & Setup

### Updating from 3.0.x to 3.1.0
1. Pull the latest version from GitHub
2. Reload SillyTavern
3. Optional: Enable "Auto-update stats from AI" in settings

### Compatibility
- Requires SillyTavern v1.10.0 or later
- Compatible with OpenAI-compatible APIs
- Best results with advanced AI models (GPT-4, Claude, etc.)

## Known Issues

None at this time. Please report bugs on GitHub.

## Future Plans

- [ ] CSV export/import for stats
- [ ] Stat visualization/charts
- [ ] Multi-character comparison
- [ ] Custom stat formulas
- [ ] Integration with other SillyTavern extensions

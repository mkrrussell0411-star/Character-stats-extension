/**
 * Character Stats & Growth Extension v3.0.8
 * Inline input form under stats list
 */

(() => {
  "use strict";

  console.log("[character-stats] 🚀 Extension initializing...");

  const STORAGE_PREFS = "char_stats_prefs";
  const STORAGE_CACHE = "char_stats_data";
  const STATS_MARKER = "<!--STATS-->";

  let prefs = {
    enabled: true,
    autoInject: true,
    injectRole: "system",
    autoUpdateFromAI: true,
  };

  let statsData = {};
  let currentCharKey = "global";
  let fetchWrapped = false;
  let showingAddInput = false;
  let showingGrowInput = false;

  // ========================= STORAGE =========================
  function loadData() {
    try {
      const p = localStorage.getItem(STORAGE_PREFS);
      if (p) {
        prefs = Object.assign(prefs, JSON.parse(p));
        console.log("[character-stats] ✅ Loaded prefs");
      }
      const s = localStorage.getItem(STORAGE_CACHE);
      if (s) {
        statsData = JSON.parse(s);
        console.log("[character-stats] ✅ Loaded stats");
      }
    } catch (e) {
      console.error("[character-stats] ❌ Storage error:", e);
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_PREFS, JSON.stringify(prefs));
    } catch (e) {
      console.error("[character-stats] ❌ Save prefs error:", e);
    }
  }

  function saveStats() {
    try {
      localStorage.setItem(STORAGE_CACHE, JSON.stringify(statsData));
    } catch (e) {
      console.error("[character-stats] ❌ Save stats error:", e);
    }
  }

  function getCurrentCharKey() {
    try {
      if (window?.characters && window?.this_chid !== undefined) {
        const ch = window.characters[window.this_chid];
        if (ch) {
          const key = `char_${ch.name || ch.avatar || window.this_chid}`;
          if (key !== currentCharKey) {
            console.log("[character-stats] 🎭 Character changed");
            currentCharKey = key;
            if (!statsData[key]) {
              statsData[key] = {};
            }
            updateDisplay();
          }
          return key;
        }
      }
    } catch (e) {
      console.warn("[character-stats] ⚠️ Error detecting character");
    }
    return "global";
  }

  // ========================= STATS =========================
  function getCharStats() {
    currentCharKey = getCurrentCharKey();
    if (!statsData[currentCharKey]) {
      statsData[currentCharKey] = {};
    }
    return statsData[currentCharKey];
  }

  function deriveCharKey(rawName) {
    const USER_ALIASES = ["user", "you", "me", "player"];
    const normalized = rawName.trim().toLowerCase().replace(/\s+/g, "_");
    if (USER_ALIASES.includes(normalized)) return "user";
    return "char_" + normalized;
  }

  function buildStatsText() {
    const allKeys = Object.keys(statsData);
    const blocks = [];
    for (const key of allKeys) {
      const bucket = statsData[key];
      if (!bucket || Object.keys(bucket).length === 0) continue;
      const label = key === "global" ? "Global" : key === "user" ? "User" : key.replace(/^char_/, "");
      const parts = [];
      for (const [k, v] of Object.entries(bucket)) {
        const isObj  = typeof v === "object";
        const name   = isObj ? v.name : k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const value  = isObj ? v.value : v;
        const unit   = isObj ? v.unit : "";
        const val    = typeof value === "number" ? value.toFixed(2) + unit : value + unit;
        parts.push(name + ": " + val);
      }
      if (parts.length > 0) blocks.push(`[Character Stats — ${label}: ${parts.join(" | ")}]`);
    }
    return blocks.length > 0 ? blocks.join("\n") : null;
  }

  // ========================= STATS CODEBLOCK PARSING =========================
  function looksLikeStatsUpdate(codeEl) {
    // Check if parent structure contains <stats_update>
    const parent = codeEl.closest?.("stats_update") ||
      codeEl.parentElement?.closest?.("[data-tag='stats_update']");
    if (parent) {
      console.log("[character-stats] 🔍 Found stats update block by parent tag");
      return true;
    }

    // Check if the codeblock text contains known stat keys
    const text = (codeEl.textContent || "").trim();
    const stats = getCharStats();
    const knownKeys = Object.values(stats).map(v =>
      (typeof v === "object" ? v.name : "").toLowerCase()
    ).filter(Boolean);
    if (knownKeys.length === 0) {
      console.log("[character-stats] 🔍 No known stats to match against");
      return false;
    }
    const hits = knownKeys.filter(k => new RegExp(`^${k}:`, "i").test(text));
    if (hits.length >= 1) {
      console.log("[character-stats] 🔍 Found stats update block by pattern match:", hits);
      return true;
    }
    console.log("[character-stats] 🔍 Code block doesn't look like stats update");
    return false;
  }

  function parseStatsCodeblock(text) {
    const updates = {};
    const lines = text.split("\n");

    // Skip lines that are clearly examples or instructions
    const examplePatterns = [
      /^StatName/i,
      /^example/i,
      /^e\.g\./i,
      /^\(/,
      /^\[/,
    ];

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // Skip if matches example pattern
      if (examplePatterns.some(pattern => pattern.test(line))) continue;

      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (!key || !val) continue;

      updates[key] = val;
    }
    console.log("[character-stats] 📝 Parsed stats codeblock:", updates);
    return updates;
  }

  function applyStatsFromCodeblock(data) {
    // Route to the character named in the block, or fall back to currentCharKey
    const charKeyRaw = Object.keys(data).find(k => k.trim().toLowerCase() === "character");
    let targetKey;
    if (charKeyRaw) {
      const charName = data[charKeyRaw];
      delete data[charKeyRaw];           // remove before stat loop
      targetKey = deriveCharKey(charName);
    } else {
      targetKey = currentCharKey;
    }
    if (!statsData[targetKey]) statsData[targetKey] = {};
    const stats = statsData[targetKey];
    let changed = false;
    const appliedUpdates = [];

    for (const [parsedKey, parsedVal] of Object.entries(data)) {
      let found = false;

      // Try to find matching stat by name (case-insensitive)
      for (const [statKey, statEntry] of Object.entries(stats)) {
        const statName = typeof statEntry === "object" ? statEntry.name : statKey.replace(/_/g, " ");
        if (statName.toLowerCase() !== parsedKey.toLowerCase()) continue;

        found = true;
        // Extract numeric value
        const numMatch = String(parsedVal).match(/^([+-]?\d+\.?\d*)/);
        const oldValue = typeof statEntry === "object" ? statEntry.value : statEntry;

        if (numMatch && typeof statEntry === "object" && typeof statEntry.value === "number") {
          const newValue = parseFloat(numMatch[1]);
          statEntry.value = newValue;
          appliedUpdates.push(`${statName}: ${oldValue} → ${newValue}`);
          changed = true;
        } else if (typeof statEntry !== "object") {
          stats[statKey] = parsedVal;
          appliedUpdates.push(`${statName}: ${oldValue} → ${parsedVal}`);
          changed = true;
        }
        break;
      }

      // If stat doesn't exist, create a new one
      if (!found) {
        const statKey = parsedKey.toLowerCase().replace(/\s+/g, "_");
        const numMatch = String(parsedVal).match(/^([+-]?\d+\.?\d*)/);

        if (numMatch) {
          // Create numeric stat
          stats[statKey] = {
            value: parseFloat(numMatch[1]),
            unit: parsedVal.replace(/^[+-]?\d+\.?\d*/, "").trim(),
            name: parsedKey,
          };
          appliedUpdates.push(`${parsedKey}: (new) = ${parsedVal}`);
        } else {
          // Create text stat
          stats[statKey] = {
            value: parsedVal,
            unit: "",
            name: parsedKey,
          };
          appliedUpdates.push(`${parsedKey}: (new) = ${parsedVal}`);
        }
        changed = true;
      }
    }

    if (changed) {
      console.log("[character-stats] 🎯 Applying AI codeblock updates:", appliedUpdates);
      saveStats();
      saveToCharacterCard();
      updateDisplay();
      console.log("[character-stats] ✅ Stats updated and saved from AI codeblock");
    } else {
      console.log("[character-stats] ℹ️ No changes needed in stats");
    }
  }

  function getAllStatsUpdateBlocks() {
    const codes = Array.from(document.querySelectorAll(".mes pre code"));
    const results = [];

    for (let i = codes.length - 1; i >= 0; i--) {
      const codeEl = codes[i];
      const codeText = (codeEl.textContent || "").trim();
      if (!codeText.includes("<stats_update>") && !codeText.includes("&lt;stats_update&gt;") && !codeText.includes("stats_update")) continue;

      const startIdx = codeText.indexOf("<stats_update>");
      const endIdx   = codeText.indexOf("</stats_update>");
      if (startIdx !== -1 && endIdx !== -1) {
        results.push({ textContent: codeText.substring(startIdx + 14, endIdx).trim() });
      } else if (looksLikeStatsUpdate(codeEl)) {
        results.push(codeEl);
      }
    }
    return results;  // may be empty array
  }

  function refreshStatsFromChat() {
    if (!prefs.autoUpdateFromAI) return;
    const blocks = getAllStatsUpdateBlocks();
    for (const block of blocks) {
      const text = (block.textContent || "").trim();
      if (!text) continue;
      const data = parseStatsCodeblock(text);
      if (Object.keys(data).length > 0) {
        applyStatsFromCodeblock(data);
      }
    }
  }

  // Export for manual testing
  window.csRefreshStats = refreshStatsFromChat;

  // ========================= FETCH WRAPPER =========================
  function wrapFetch() {
    if (fetchWrapped) return;
    fetchWrapped = true;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      try {
        const url = String(typeof input === "string" ? input : input?.url || "");
        const method = (init?.method || "GET").toUpperCase();

        const isGeneration =
          method === "POST" &&
          url.includes("/api/") &&
          (url.includes("generate") || url.includes("completion")) &&
          !url.includes("settings") &&
          !url.includes("/chats/save");

        if (isGeneration) {
          console.log("[character-stats] 🌐 Generation request detected:", url);
          console.log("[character-stats] 📊 Prefs state - enabled:", prefs.enabled, ", autoInject:", prefs.autoInject);
        }

        if (!isGeneration) return originalFetch(input, init);

        let body = init?.body;
        if (!body && typeof input !== "string" && input instanceof Request) {
          const cloned = input.clone();
          body = await cloned.text();
          init = Object.assign({}, init || {});
          init.headers = new Headers(input.headers);
          init.method = method;
        }

        if (!body || typeof body !== "string") {
          console.log("[character-stats] ⚠️ No body or invalid body type");
          return originalFetch(input, init);
        }

        let payload;
        try {
          payload = JSON.parse(body);
        } catch (e) {
          console.log("[character-stats] ⚠️ Failed to parse payload:", e.message);
          return originalFetch(input, init);
        }

        if (prefs.enabled && prefs.autoInject) {
          const statsText = buildStatsText();
          if (statsText) {
            console.log("[character-stats] 📤 Preparing to inject stats into generation request");
            const role = prefs.injectRole === "user" ? "user" : "system";
            const statsUpdatePrompt = `<!--STATS_UPDATE_PROMPT-->
IMPORTANT: After your reply, output a code block with ALL relevant character stats in this exact format:

\`\`\`
<stats_update>
Character: Name
Height: 6.5 ft
Weight: 180 lbs
Strength: 18
</stats_update>
\`\`\`

If multiple characters have stats, output one <stats_update> block per character.
Include ONLY actual stats (not examples). One stat per line. Create new stats as needed.`;

            if (Array.isArray(payload.messages)) {
              const hasStats = payload.messages.some((m) => (m?.content || "").includes(STATS_MARKER));
              if (!hasStats) {
                const injectedContent = STATS_MARKER + "\n" + statsText + "\n\n" + statsUpdatePrompt;
                payload.messages.push({ role, content: injectedContent });
                init.body = JSON.stringify(payload);
                console.log("[character-stats] ✅ Injected stats + update prompt into messages");
                console.log("[character-stats] 📨 Injected content preview:", injectedContent.substring(0, 200) + "...");
              } else {
                console.log("[character-stats] ℹ️ Stats already in messages, skipping injection");
              }
            } else if (typeof payload.prompt === "string") {
              if (!payload.prompt.includes(STATS_MARKER)) {
                payload.prompt += "\n\n" + STATS_MARKER + "\n" + statsText + "\n\n" + statsUpdatePrompt;
                console.log("[character-stats] ✅ Injected stats + update prompt into prompt");
                init.body = JSON.stringify(payload);
              } else {
                console.log("[character-stats] ℹ️ Stats already in prompt, skipping injection");
              }
            } else {
              console.log("[character-stats] ⚠️ Payload format not recognized (no messages or prompt)");
            }
          } else {
            console.log("[character-stats] ℹ️ No stats to inject (no stats defined yet)");
          }
        } else {
          console.log("[character-stats] ℹ️ Stats injection disabled (enabled:", prefs.enabled, ", autoInject:", prefs.autoInject, ")");
        }

        return originalFetch(input, init);
      } catch (err) {
        console.error("[character-stats] 💥 Fetch error:", err);
        return originalFetch(input, init);
      }
    };

    console.log("[character-stats] ✅ Fetch wrapper installed");
  }

  // ========================= DEFAULT STATS =========================
  const DEFAULT_STATS = [
    { name: "Height", unit: " ft" },
    { name: "Weight", unit: " lbs" },
  ];

  function addDefaultStat(name, unit) {
    const stats = getCharStats();
    const key = name.toLowerCase().replace(/\s+/g, "_");

    if (!stats[key]) {
      stats[key] = {
        value: 0,
        unit: unit,
        name: name,
      };
      saveStats();
      saveToCharacterCard();
      updateDisplay();
      console.log("[character-stats] ➕ Added default stat:", name);
    }
  }

  // ========================= CHARACTER CARD SAVE =========================
  function saveToCharacterCard() {
    try {
      if (!window?.characters || window?.this_chid === undefined) {
        console.log("[character-stats] ⚠️ No character loaded");
        return;
      }

      const char = window.characters[window.this_chid];
      if (!char) return;

      const stats = getCharStats();
      let statsText = "";

      for (const [k, v] of Object.entries(stats)) {
        const isObj = typeof v === "object";
        const name = isObj ? v.name : k;
        const value = isObj ? v.value : v;
        const unit = isObj ? v.unit : "";
        const val = typeof value === "number" ? value.toFixed(2) + unit : value + unit;
        statsText += `${name}: ${val}\n`;
      }

      if (statsText) {
        // Try to save to character data
        if (!char.data) char.data = {};
        char.data.character_stats = statsText;

        // Also try localStorage backup
        localStorage.setItem(`char_card_stats_${currentCharKey}`, statsText);

        console.log("[character-stats] 💾 Saved stats to character card");
      }
    } catch (e) {
      console.error("[character-stats] ❌ Error saving to character card:", e);
    }
  }

  // ========================= COMPARISON SYSTEM =========================
  const COMPARISON_ITEMS = [
    { name: "Human (average)", cm: 170 },
    { name: "Basketball", cm: 24 },
    { name: "Baseball", cm: 7.3 },
    { name: "Golf ball", cm: 4.3 },
    { name: "Ping pong ball", cm: 4 },
    { name: "Sugar cube", cm: 1.3 },
    { name: "Grain of rice", cm: 0.7 },
    { name: "Bacterium", cm: 0.001 },
    { name: "Virus", cm: 0.00001 },
    { name: "Atom", cm: 0.0000001 },
    { name: "Elephant", cm: 300 },
    { name: "Giraffe", cm: 550 },
    { name: "Blue whale", cm: 3000 },
    { name: "Brachiosaurus", cm: 2500 },
    { name: "Tyrannosaurus Rex", cm: 1200 },
    { name: "Great white shark", cm: 600 },
    { name: "Grizzly bear", cm: 250 },
    { name: "Lion", cm: 250 },
    { name: "Horse", cm: 150 },
    { name: "Dog (large)", cm: 80 },
    { name: "Cat", cm: 30 },
    { name: "Mouse", cm: 10 },
    { name: "Ant", cm: 0.5 },
    { name: "Ladybug", cm: 0.8 },
    { name: "Bee", cm: 1.5 },
    { name: "Butterfly", cm: 3 },
    { name: "Dragonfly", cm: 7 },
    { name: "Hummingbird", cm: 10 },
    { name: "Sparrow", cm: 16 },
    { name: "Eagle", cm: 90 },
    { name: "Ostrich", cm: 220 },
    { name: "Penny", cm: 1.91 },
    { name: "Dime", cm: 1.77 },
    { name: "Quarter", cm: 2.43 },
    { name: "Apple", cm: 7.5 },
    { name: "Orange", cm: 8 },
    { name: "Watermelon", cm: 25 },
    { name: "Pumpkin", cm: 30 },
    { name: "Soda can", cm: 12 },
    { name: "Wine bottle", cm: 30 },
    { name: "Champagne bottle", cm: 33 },
    { name: "Toilet paper roll", cm: 12 },
    { name: "Paperclip", cm: 3.3 },
    { name: "Pencil", cm: 19 },
    { name: "Smartphone", cm: 15 },
    { name: "Laptop", cm: 35 },
    { name: "Dinner plate", cm: 27 },
    { name: "Pizza (large)", cm: 35 },
    { name: "Car", cm: 450 },
    { name: "Bus", cm: 1000 },
    { name: "Train car", cm: 2600 },
    { name: "Airplane (747)", cm: 7000 },
    { name: "Statue of Liberty", cm: 9300 },
    { name: "Empire State Building", cm: 38100 },
    { name: "Mount Everest", cm: 884000 },
    { name: "Earth", cm: 1275600000 },
    { name: "Moon", cm: 347600000 },
    { name: "Sun", cm: 1391000000000 },
    { name: "Jupiter", cm: 13982000000000 },
    { name: "Saturn", cm: 11738000000000 },
    { name: "Milky Way (diameter)", cm: 1000000000000000000000 },
  ];

  function findClosestMatches(statValue, unit) {
    // Normalize unit to lowercase and trim
    const normalizedUnit = unit.toLowerCase().trim();
    
    // Convert to cm as base unit
    let valueCm = statValue;
    
    // Handle various unit formats
    if (normalizedUnit.includes("mm")) {
      valueCm = statValue / 10;  // 1mm = 0.1cm
    } else if (normalizedUnit.includes("cm")) {
      valueCm = statValue;  // 1cm = 1cm
    } else if (normalizedUnit.includes("m") && !normalizedUnit.includes("mm") && !normalizedUnit.includes("mi")) {
      valueCm = statValue * 100;  // 1m = 100cm
    } else if (normalizedUnit.includes("km")) {
      valueCm = statValue * 100000;  // 1km = 100,000cm
    } else if (normalizedUnit.includes("in")) {
      valueCm = statValue * 2.54;  // 1 inch = 2.54cm
    } else if (normalizedUnit.includes("ft")) {
      valueCm = statValue * 30.48;  // 1 ft = 30.48cm
    } else if (normalizedUnit.includes("mi")) {
      valueCm = statValue * 160934;  // 1 mile = 160,934cm
    } else {
      // If no unit recognized, assume cm
      valueCm = statValue;
    }

    if (!valueCm || valueCm <= 0) return [];

    // Calculate ratios
    const matches = COMPARISON_ITEMS.map(item => ({
      ...item,
      ratio: valueCm / item.cm,
    }));

    // Sort by closest ratio (closest to 1)
    matches.sort((a, b) => {
      const ratioA = Math.abs(Math.log(a.ratio));
      const ratioB = Math.abs(Math.log(b.ratio));
      return ratioA - ratioB;
    });

    return matches.slice(0, 5);
  }

  function openComparisonDialog() {
    const stats = getCharStats();
    if (Object.keys(stats).length === 0) {
      alert("⚠️ No stats to compare!");
      return;
    }

    // Get first numeric stat
    let statToCompare = null;
    let statKey = null;

    for (const [k, v] of Object.entries(stats)) {
      const value = typeof v === "object" ? v.value : v;
      if (typeof value === "number" && value > 0) {
        statToCompare = v;
        statKey = k;
        break;
      }
    }

    if (!statToCompare) {
      alert("⚠️ No numeric stats to compare!");
      return;
    }

    const statValue = typeof statToCompare === "object" ? statToCompare.value : statToCompare;
    const statUnit = typeof statToCompare === "object" ? statToCompare.unit : "";

    const matches = findClosestMatches(statValue, statUnit);

    // Convert stat value to cm for ratio calculation
    const normalizedUnit = statUnit.toLowerCase().trim();
    let valueCm = statValue;
    
    if (normalizedUnit.includes("mm")) {
      valueCm = statValue / 10;
    } else if (normalizedUnit.includes("cm")) {
      valueCm = statValue;
    } else if (normalizedUnit.includes("m") && !normalizedUnit.includes("mm") && !normalizedUnit.includes("mi")) {
      valueCm = statValue * 100;
    } else if (normalizedUnit.includes("km")) {
      valueCm = statValue * 100000;
    } else if (normalizedUnit.includes("in")) {
      valueCm = statValue * 2.54;
    } else if (normalizedUnit.includes("ft")) {
      valueCm = statValue * 30.48;
    } else if (normalizedUnit.includes("mi")) {
      valueCm = statValue * 160934;
    } else {
      valueCm = statValue;
    }

    let comparisonText = `📏 ${typeof statToCompare === "object" ? statToCompare.name : statKey} Comparisons:\n\n`;

    const charName = window?.characters?.[window?.this_chid]?.name || "Character";

    for (const match of matches) {
      const ratio = valueCm / match.cm;
      if (ratio > 1) {
        const times = ratio.toFixed(2);
        comparisonText += `${charName} is ${times}x bigger than ${match.name}\n`;
      } else {
        const times = (1 / ratio).toFixed(2);
        comparisonText += `${charName} is ${times}x smaller than ${match.name}\n`;
      }
    }

    alert(comparisonText);
    console.log("[character-stats] 📏 Comparisons shown");
  }
  function setupChatMonitoring() {
    // Watch for chat messages
    const observer = new MutationObserver(() => {
      try {
        requestAnimationFrame(() => {
          parseChatForStats();  // existing regex-based parsing
          refreshStatsFromChat();  // new structured codeblock parsing
        });
      } catch (e) {
        console.error("[character-stats] Error parsing chat:", e);
      }
    });

    // Observe chat container - try multiple selectors for different ST versions
    let chatContainer = document.querySelector('#chat') ||
                        document.querySelector('.chat-area') ||
                        document.querySelector('[data-type="chat"]') ||
                        document.querySelector('.mes_text') ||
                        document.body;

    console.log("[character-stats] 🔎 Looking for chat container...");
    console.log("[character-stats] 📍 Found container:", chatContainer?.className || chatContainer?.tagName, chatContainer?.id);

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    console.log("[character-stats] ✅ Chat monitoring started");
  }

  function parseChatForStats() {
    // Get all chat messages
    const messages = document.querySelectorAll('[class*="message"]') || document.querySelectorAll('[class*="mes"]') || [];
    
    for (const msg of messages) {
      const text = msg.textContent || msg.innerText || "";
      if (!text) continue;

      // Parse stat patterns like "X has grown Y", "X gained Y", "X's Y increased"
      parseStatChanges(text);
    }
  }

  function parseStatChanges(text) {
    const stats = getCharStats();
    let updated = false;

    // Pattern 1: "has grown a/an X" or "has X"
    // Example: "Alex has grown a penis" → adds penis stat
    const growthMatch = text.match(/has\s+grown\s+(?:a|an)?\s+([a-zA-Z\s]+?)(?:\.|,|$)/i);
    if (growthMatch) {
      const statName = growthMatch[1].trim().toLowerCase();
      if (statName && !stats[statName]) {
        stats[statName] = {
          value: 1,
          unit: "",
          name: statName.charAt(0).toUpperCase() + statName.slice(1),
        };
        updated = true;
        console.log("[character-stats] 📊 Auto-added stat from chat:", statName);
      }
    }

    // Pattern 2: "gained X"
    // Example: "gained strength" → adds strength stat
    const gainMatch = text.match(/gained\s+([a-zA-Z\s]+?)(?:\.|,|$)/i);
    if (gainMatch) {
      const statName = gainMatch[1].trim().toLowerCase();
      if (statName && !stats[statName]) {
        stats[statName] = {
          value: 1,
          unit: "",
          name: statName.charAt(0).toUpperCase() + statName.slice(1),
        };
        updated = true;
        console.log("[character-stats] 📊 Auto-added stat from chat:", statName);
      }
    }

    // Pattern 3: "X increased to Y" or "X increased by Y"
    // Example: "strength increased to 20" or "strength increased by 5"
    const increaseMatch = text.match(/([a-zA-Z\s]+?)\s+increased\s+(?:to|by)\s+(\d+(?:\.\d+)?)/i);
    if (increaseMatch) {
      const statName = increaseMatch[1].trim().toLowerCase();
      const value = parseFloat(increaseMatch[2]);
      
      if (statName) {
        if (!stats[statName]) {
          stats[statName] = {
            value: value,
            unit: "",
            name: statName.charAt(0).toUpperCase() + statName.slice(1),
          };
        } else if (typeof stats[statName] === "object") {
          stats[statName].value = value;
        } else {
          stats[statName] = value;
        }
        updated = true;
        console.log("[character-stats] 📊 Auto-updated stat from chat:", statName, "=", value);
      }
    }

    // Pattern 4: "X is now Y" or "X now Y"
    // Example: "height is now 7 feet" or "health now 150"
    const nowMatch = text.match(/([a-zA-Z\s]+?)\s+(?:is\s+)?now\s+(\d+(?:\.\d+)?)/i);
    if (nowMatch) {
      const statName = nowMatch[1].trim().toLowerCase();
      const value = parseFloat(nowMatch[2]);
      
      if (statName && !["it", "that", "this"].includes(statName)) {
        if (!stats[statName]) {
          stats[statName] = {
            value: value,
            unit: "",
            name: statName.charAt(0).toUpperCase() + statName.slice(1),
          };
        } else if (typeof stats[statName] === "object") {
          stats[statName].value = value;
        } else {
          stats[statName] = value;
        }
        updated = true;
        console.log("[character-stats] 📊 Auto-updated stat from chat:", statName, "=", value);
      }
    }

    if (updated) {
      saveStats();
      saveToCharacterCard();
      updateDisplay();
    }
  }
  function openAddStatDialog() {
    if (showingAddInput) return;
    showingAddInput = true;

    const statsList = document.getElementById("cs-stats-list");
    if (!statsList) return;

    // Create input container
    const inputContainer = document.createElement("div");
    inputContainer.id = "cs-add-input-container";
    inputContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
    `;

    // Name input
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Name";
    nameInput.style.cssText = `
      flex: 1;
      padding: 8px 10px;
      background: rgba(0,0,0,0.25);
      color: rgba(255,255,255,0.90);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      font-size: 11px;
      box-sizing: border-box;
    `;

    // Value input
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.placeholder = "Value";
    valueInput.style.cssText = `
      flex: 1;
      padding: 8px 10px;
      background: rgba(0,0,0,0.25);
      color: rgba(255,255,255,0.90);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      font-size: 11px;
      box-sizing: border-box;
    `;

    // Unit input (smaller)
    const unitInput = document.createElement("input");
    unitInput.type = "text";
    unitInput.placeholder = "Unit";
    unitInput.style.cssText = `
      width: 50px;
      padding: 8px 10px;
      background: rgba(0,0,0,0.25);
      color: rgba(255,255,255,0.90);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      font-size: 11px;
      box-sizing: border-box;
    `;

    // Save button
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.cssText = `
      padding: 8px 12px;
      background: rgba(74,163,255,0.22);
      color: rgba(74,163,255,0.92);
      border: 1px solid rgba(74,163,255,0.25);
      border-radius: 8px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
    `;

    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "✕";
    cancelBtn.style.cssText = `
      width: 32px;
      height: 32px;
      padding: 0;
      background: rgba(255,80,80,0.15);
      color: rgba(255,100,100,0.90);
      border: 1px solid rgba(255,80,80,0.25);
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
    `;

    inputContainer.appendChild(nameInput);
    inputContainer.appendChild(valueInput);
    inputContainer.appendChild(unitInput);
    inputContainer.appendChild(saveBtn);
    inputContainer.appendChild(cancelBtn);

    statsList.parentElement.insertBefore(inputContainer, statsList.nextSibling);

    nameInput.focus();

    // Save handler
    const handleSave = () => {
      const name = nameInput.value.trim();
      const value = valueInput.value.trim();
      const unit = unitInput.value.trim();

      if (!name || !value) {
        alert("❌ Name and value required!");
        return;
      }

      const displayUnit = unit ? ` ${unit}` : "";
      const storageKey = name.toLowerCase().replace(/\s+/g, "_");
      const numVal = parseFloat(value);

      // Add stat to the currently viewed character tab
      const stats = statsData[currentCharKey] || {};
      if (!statsData[currentCharKey]) {
        statsData[currentCharKey] = stats;
      }
      stats[storageKey] = {
        value: isNaN(numVal) ? value : numVal,
        unit: displayUnit,
        name: name,
      };

      saveStats();
      updateDisplay();
      saveToCharacterCard();
      console.log("[character-stats] ➕ Added stat");
      
      // Clear fields but keep form open
      nameInput.value = "";
      valueInput.value = "";
      unitInput.value = "";
      nameInput.focus();
    };

    saveBtn.addEventListener("click", handleSave);
    nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") valueInput.focus();
    });
    valueInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") unitInput.focus();
    });
    unitInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSave();
    });

    cancelBtn.addEventListener("click", () => {
      inputContainer.remove();
      showingAddInput = false;
    });
  }

  function openGrowDialog() {
    if (showingGrowInput) return;
    showingGrowInput = true;

    const resetBtn = document.getElementById("cs-reset");
    if (!resetBtn) return;

    // Create input container
    const inputContainer = document.createElement("div");
    inputContainer.id = "cs-grow-input-container";
    inputContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
    `;

    // Percentage input
    const percentInput = document.createElement("input");
    percentInput.type = "number";
    percentInput.placeholder = "Growth %";
    percentInput.value = "5";
    percentInput.style.cssText = `
      flex: 1;
      padding: 8px 10px;
      background: rgba(0,0,0,0.25);
      color: rgba(255,255,255,0.90);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      font-size: 11px;
      box-sizing: border-box;
    `;

    // Grow button
    const growBtn = document.createElement("button");
    growBtn.textContent = "Grow";
    growBtn.style.cssText = `
      padding: 8px 12px;
      background: rgba(255,100,100,0.15);
      color: rgba(255,120,120,0.92);
      border: 1px solid rgba(255,100,100,0.25);
      border-radius: 8px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
    `;

    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "✕";
    cancelBtn.style.cssText = `
      width: 32px;
      height: 32px;
      padding: 0;
      background: rgba(255,80,80,0.15);
      color: rgba(255,100,100,0.90);
      border: 1px solid rgba(255,80,80,0.25);
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
    `;

    inputContainer.appendChild(percentInput);
    inputContainer.appendChild(growBtn);
    inputContainer.appendChild(cancelBtn);

    resetBtn.parentElement.insertBefore(inputContainer, resetBtn.nextSibling);

    percentInput.focus();

    // Grow handler
    const handleGrow = () => {
      const percent = percentInput.value.trim();

      if (!percent) {
        alert("❌ Enter a percentage!");
        return;
      }

      const growth = parseFloat(percent);
      if (isNaN(growth) || growth === 0) {
        alert("❌ Invalid number!");
        return;
      }

      // Apply growth to the currently viewed character tab
      const stats = statsData[currentCharKey] || {};
      let count = 0;

      for (const key in stats) {
        const stat = stats[key];
        const val = typeof stat === "object" ? stat.value : stat;
        if (typeof val === "number") {
          const newVal = val * (1 + growth / 100);
          if (typeof stat === "object") {
            stat.value = newVal;
          } else {
            stats[key] = newVal;
          }
          count++;
        }
      }

      saveStats();
      inputContainer.remove();
      showingGrowInput = false;
      updateDisplay();
      saveToCharacterCard();
      console.log("[character-stats] 📈 Grew ${count} stats by ${growth}%");
    };

    growBtn.addEventListener("click", handleGrow);
    percentInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleGrow();
    });

    cancelBtn.addEventListener("click", () => {
      inputContainer.remove();
      showingGrowInput = false;
    });
  }

  function manualInjectStats() {
    const statsText = buildStatsText();
    if (!statsText) {
      alert("⚠️ No stats to copy!");
      return;
    }

    navigator.clipboard.writeText(statsText).then(() => {
      alert("✅ Copied!");
    }).catch(() => {
      alert("❌ Copy failed");
    });
  }

  function updateDisplay() {
    const list = document.getElementById("cs-stats-list");
    if (!list) return;

    updateCharacterTabs();

    // Use the stats for the currently selected character tab
    const stats = statsData[currentCharKey] || {};
    if (Object.keys(stats).length === 0) {
      list.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 11px;">No stats yet</div>';
      return;
    }

    list.innerHTML = "";
    
    for (const [k, v] of Object.entries(stats)) {
      const isObj = typeof v === "object";
      const name = isObj ? v.name : k;
      const value = isObj ? v.value : v;
      const unit = isObj ? v.unit : "";

      const statDiv = document.createElement("div");
      statDiv.className = "cs-stat-item";
      statDiv.dataset.key = k;
      statDiv.style.cssText = `
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 8px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;
      `;

      const contentDiv = document.createElement("div");
      contentDiv.style.cssText = "flex: 1;";
      contentDiv.innerHTML = `
        <div style="font-size: 11px; color: rgba(255,255,255,0.90);">${name}</div>
        <div style="font-size: 10px; color: rgba(255,255,255,0.62);">
          ${typeof value === "number" ? value.toFixed(2) : value}${unit}
        </div>
      `;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "cs-delete-btn";
      deleteBtn.dataset.key = k;
      deleteBtn.textContent = "✕";
      deleteBtn.style.cssText = `
        background: rgba(255,80,80,0.2);
        color: rgba(255,100,100,0.90);
        border: none;
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 10px;
        margin-left: 8px;
      `;

      statDiv.appendChild(contentDiv);
      statDiv.appendChild(deleteBtn);
      list.appendChild(statDiv);

      // Hover effects
      statDiv.addEventListener("mouseover", () => {
        statDiv.style.background = "rgba(255,255,255,0.08)";
      });
      statDiv.addEventListener("mouseout", () => {
        statDiv.style.background = "rgba(255,255,255,0.04)";
      });

      // Edit on click (only if not clicking delete button)
      statDiv.addEventListener("click", (e) => {
        if (!e.target.classList.contains("cs-delete-btn")) {
          window.csEditStat(k);
        }
      });

      // Delete on button click
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.csDeleteStat(k);
      });
    }
  }

  window.csEditStat = function(key) {
    // Edit stat for the currently selected character tab
    const stats = statsData[currentCharKey] || {};
    const stat = stats[key];
    if (!stat) return;

    const isObj = typeof stat === "object";
    const name = isObj ? stat.name : key;
    const value = isObj ? stat.value : stat;
    const unit = isObj ? stat.unit.trim() : "";

    // Create edit form
    const editContainer = document.createElement("div");
    editContainer.id = "cs-edit-container";
    editContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(16,16,16,0.95);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 16px;
      padding: 16px;
      z-index: 10000;
      min-width: 400px;
      box-shadow: 0 18px 60px rgba(0,0,0,0.65);
    `;

    editContainer.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.92);">Edit Stat</h3>
      
      <div style="
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      ">
        <input type="text" id="edit-name" placeholder="Name" value="${name}" style="
          flex: 1;
          padding: 8px 10px;
          background: rgba(0,0,0,0.25);
          color: rgba(255,255,255,0.90);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          font-size: 12px;
          box-sizing: border-box;
        ">
        
        <input type="text" id="edit-value" placeholder="Value" value="${value}" style="
          flex: 1;
          padding: 8px 10px;
          background: rgba(0,0,0,0.25);
          color: rgba(255,255,255,0.90);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          font-size: 12px;
          box-sizing: border-box;
        ">
        
        <input type="text" id="edit-unit" placeholder="Unit" value="${unit}" style="
          width: 50px;
          padding: 8px 10px;
          background: rgba(0,0,0,0.25);
          color: rgba(255,255,255,0.90);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          font-size: 12px;
          box-sizing: border-box;
        ">
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="edit-cancel" style="
          padding: 8px 12px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.86);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        ">Cancel</button>
        <button id="edit-save" style="
          padding: 8px 12px;
          background: rgba(74,163,255,0.22);
          color: rgba(74,163,255,0.92);
          border: 1px solid rgba(74,163,255,0.25);
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        ">Save</button>
      </div>
    `;

    document.body.appendChild(editContainer);

    const nameInput = document.getElementById("edit-name");
    const valueInput = document.getElementById("edit-value");
    const unitInput = document.getElementById("edit-unit");
    const saveBtn = document.getElementById("edit-save");
    const cancelBtn = document.getElementById("edit-cancel");

    nameInput.focus();
    nameInput.select();

    const handleSave = () => {
      const newName = nameInput.value.trim();
      const newValue = valueInput.value.trim();
      const newUnit = unitInput.value.trim();

      if (!newName || !newValue) {
        alert("❌ Name and value required!");
        return;
      }

      const numVal = parseFloat(newValue);

      // Update stat
      stat.name = newName;
      stat.value = isNaN(numVal) ? newValue : numVal;
      stat.unit = newUnit ? ` ${newUnit}` : "";

      saveStats();
      editContainer.remove();
      updateDisplay();
      saveToCharacterCard();
      console.log("[character-stats] ✏️ Edited stat:", newName);
    };

    saveBtn.addEventListener("click", handleSave);
    cancelBtn.addEventListener("click", () => {
      editContainer.remove();
    });

    nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") valueInput.focus();
    });
    valueInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") unitInput.focus();
    });
    unitInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSave();
    });

    // Close on outside click
    document.addEventListener("click", function closeOnOutside(e) {
      if (!editContainer.contains(e.target)) {
        editContainer.remove();
        document.removeEventListener("click", closeOnOutside);
      }
    });
  };

  let editModeActive = false;

  function openEditMode() {
    console.log("[character-stats] 🔧 Opening edit mode");
    if (editModeActive) {
      console.log("[character-stats] ⚠️ Edit mode already active");
      return;
    }
    editModeActive = true;

    // Edit stats for the currently selected character tab
    const stats = statsData[currentCharKey] || {};
    if (Object.keys(stats).length === 0) {
      alert("⚠️ No stats to edit!");
      editModeActive = false;
      return;
    }

    const statsList = document.getElementById("cs-stats-list");
    if (!statsList) {
      editModeActive = false;
      return;
    }

    // Hide all stat items
    const statItems = statsList.querySelectorAll("[data-key]");
    statItems.forEach(item => item.style.display = "none");

    // Create edit form for each stat
    for (const [k, v] of Object.entries(stats)) {
      const isObj = typeof v === "object";
      const name = isObj ? v.name : k;
      const value = isObj ? v.value : v;
      const unit = isObj ? v.unit.trim() : "";

      const editContainer = document.createElement("div");
      editContainer.className = "cs-edit-stat-row";
      editContainer.dataset.key = k;
      editContainer.style.cssText = "display:flex;gap:8px;margin-bottom:8px;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "cs-edit-name";
      nameInput.placeholder = "Name";
      nameInput.value = name;
      nameInput.style.cssText = "flex:1;padding:8px 10px;background:rgba(0,0,0,0.25);color:rgba(255,255,255,0.90);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:11px;box-sizing:border-box;";

      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.className = "cs-edit-value";
      valueInput.placeholder = "Value";
      valueInput.value = value;
      valueInput.style.cssText = "flex:1;padding:8px 10px;background:rgba(0,0,0,0.25);color:rgba(255,255,255,0.90);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:11px;box-sizing:border-box;";

      const unitInput = document.createElement("input");
      unitInput.type = "text";
      unitInput.className = "cs-edit-unit";
      unitInput.placeholder = "Unit";
      unitInput.value = unit;
      unitInput.style.cssText = "width:50px;padding:8px 10px;background:rgba(0,0,0,0.25);color:rgba(255,255,255,0.90);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:11px;box-sizing:border-box;";

      editContainer.appendChild(nameInput);
      editContainer.appendChild(valueInput);
      editContainer.appendChild(unitInput);
      statsList.appendChild(editContainer);
    }

    // Create Save and Cancel buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "cs-edit-buttons";
    buttonContainer.style.cssText = "display:flex;gap:8px;margin-top:12px;padding:10px;border-top:1px solid rgba(255,255,255,0.08);";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = "flex:1;padding:8px;background:rgba(255,80,80,0.15);color:rgba(255,100,100,0.90);border:1px solid rgba(255,80,80,0.25);border-radius:10px;cursor:pointer;font-weight:600;font-size:11px;";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "💾 Save";
    saveBtn.style.cssText = "flex:1;padding:8px;background:rgba(74,163,255,0.22);color:rgba(74,163,255,0.92);border:1px solid rgba(74,163,255,0.25);border-radius:10px;cursor:pointer;font-weight:600;font-size:11px;";

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    statsList.appendChild(buttonContainer);

    console.log("[character-stats] ✅ Edit mode activated");

    // Cancel handler
    cancelBtn.addEventListener("click", () => {
      const editRows = statsList.querySelectorAll(".cs-edit-stat-row");
      editRows.forEach(row => row.remove());
      buttonContainer.remove();
      statItems.forEach(item => item.style.display = "");
      editModeActive = false;
      console.log("[character-stats] 🔙 Edit cancelled");
    });

    // Save handler
    saveBtn.addEventListener("click", () => {
      console.log("[character-stats] 💾 Saving edited stats");
      const editRows = statsList.querySelectorAll(".cs-edit-stat-row");
      const currentStats = statsData[currentCharKey] || {};

      for (const row of editRows) {
        const key = row.dataset.key;
        const newName = row.querySelector(".cs-edit-name").value.trim();
        const newValue = row.querySelector(".cs-edit-value").value.trim();
        const newUnit = row.querySelector(".cs-edit-unit").value.trim();

        if (!newName || !newValue) {
          alert("❌ All stats need name and value!");
          return;
        }

        const stat = currentStats[key];
        if (stat) {
          stat.name = newName;
          stat.value = parseFloat(newValue) || newValue;
          stat.unit = newUnit ? ` ${newUnit}` : "";
        }
      }

      saveStats();
      saveToCharacterCard();
      updateDisplay();
      
      // Close edit mode after save
      editRows.forEach(row => row.remove());
      buttonContainer.remove();
      statItems.forEach(item => item.style.display = "");
      editModeActive = false;
      
      console.log("[character-stats] ✅ Stats saved and edit mode closed");
    });
  }

  window.csDeleteStat = function(key) {
    // Delete stat from the currently selected character tab
    const stats = statsData[currentCharKey] || {};
    delete stats[key];
    saveStats();
    saveToCharacterCard();
    updateDisplay();
    console.log("[character-stats] 🗑️ Deleted stat:", key);
  };

  function getAllCharacterKeys() {
    const keys = new Set();
    for (const key of Object.keys(statsData)) {
      keys.add(key);
    }
    // Add current character if not already present
    const currentKey = getCurrentCharKey();
    if (currentKey !== "global") {
      keys.add(currentKey);
    }
    return Array.from(keys).sort((a, b) => {
      const primary = currentCharKey;
      if (a === primary && a !== "global") return -1;
      if (b === primary && b !== "global") return 1;
      if (a === "user")  return -1;
      if (b === "user")  return 1;
      if (a === "global") return 1;
      if (b === "global") return -1;
      return a.localeCompare(b);
    });
  }

  function switchCharacterTab(charKey) {
    currentCharKey = charKey;
    updateDisplay();
    updateCharacterTabs();
  }

  function updateCharacterTabs() {
    const tabContainer = document.getElementById("cs-char-tabs");
    if (!tabContainer) return;

    const allKeys = getAllCharacterKeys();
    const currentKey = currentCharKey;

    tabContainer.innerHTML = "";
    allKeys.forEach((key) => {
      const tab = document.createElement("button");
      const charName = key === "global" ? "Global"
                     : key === "user"   ? "User"
                     : key.replace(/^char_/, "");
      tab.textContent = charName;
      tab.style.cssText = `
        padding: 6px 10px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
        white-space: nowrap;
        ${key === currentKey
          ? "background:rgba(100,180,255,0.25);color:rgba(150,200,255,0.95);border-color:rgba(100,180,255,0.4);"
          : "background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.65);"}
        transition: all 120ms ease;
      `;
      tab.addEventListener("click", () => switchCharacterTab(key));
      tabContainer.appendChild(tab);
    });
  }

  function buildUI() {
    console.log("[character-stats] 🎨 Building UI...");

    const root = document.createElement("div");
    root.id = "cs-root";
    root.style.cssText = "position:fixed;top:0;left:0;height:100vh;z-index:9999;pointer-events:none;";

    const toggle = document.createElement("button");
    toggle.id = "cs-toggle";
    toggle.style.cssText = "position:absolute;top:84px;left:12px;width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(20,20,20,0.60);backdrop-filter:blur(10px);color:rgba(255,255,255,0.9);font-size:16px;cursor:pointer;pointer-events:auto;";
    toggle.innerHTML = "⚔️";

    const panel = document.createElement("div");
    panel.id = "cs-panel";
    panel.style.cssText = "position:absolute;top:calc(72px + env(safe-area-inset-top,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));left:56px;width:330px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);background:rgba(16,16,16,0.78);backdrop-filter:blur(14px);box-shadow:0 14px 44px rgba(0,0,0,0.45);overflow:hidden;transform:translateX(-400px);opacity:0;transition:transform 160ms ease,opacity 160ms ease;pointer-events:auto;display:flex;flex-direction:column;";

    panel.innerHTML = `
      <div style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <h3 style="margin:0;font-size:13px;font-weight:650;letter-spacing:0.2px;color:rgba(255,255,255,0.92);">⚔️ Character Stats</h3>
      </div>
      <div id="cs-char-tabs" style="display:flex;gap:4px;padding:8px 12px;overflow-x:auto;border-bottom:1px solid rgba(255,255,255,0.06);"></div>
      <div style="padding:10px 12px 12px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:12px;">
        <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:10px;border:1px solid rgba(255,255,255,0.08);">
          <label style="display:flex;align-items:center;gap:10px;margin-bottom:8px;cursor:pointer;">
            <input type="checkbox" id="cs-enable" ${prefs.enabled ? "checked" : ""} style="cursor:pointer;">
            <span style="flex:1;font-size:11px;color:rgba(255,255,255,0.90);">✨ Enable</span>
          </label>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" id="cs-auto-inject" ${prefs.autoInject ? "checked" : ""} style="cursor:pointer;">
            <span style="flex:1;font-size:11px;color:rgba(255,255,255,0.90);">🔄 Auto Inject</span>
          </label>
        </div>
        <select id="cs-inject-role" style="width:100%;padding:8px;background:rgba(0,0,0,0.25);color:rgba(255,255,255,0.90);border:1px solid rgba(255,255,255,0.08);border-radius:10px;font-weight:600;cursor:pointer;font-size:11px;">
          <option value="system">🔧 System</option>
          <option value="user">👤 User</option>
        </select>
        <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;min-height:60px;max-height:160px;overflow-y:auto;">
          <div id="cs-stats-list" style="display:flex;flex-direction:column;gap:8px;"></div>
        </div>
        <select id="cs-default-stats" style="width:100%;padding:8px 10px;background:rgba(100,150,200,0.15);color:rgba(120,170,220,0.92);border:1px solid rgba(100,150,200,0.25);border-radius:10px;font-weight:600;cursor:pointer;font-size:11px;">
          <option value="">➕ Add Default Stat</option>
          <option value="height">Height</option>
          <option value="weight">Weight</option>
        </select>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <button id="cs-add" style="padding:8px;background:rgba(74,163,255,0.22);color:rgba(74,163,255,0.92);border:1px solid rgba(74,163,255,0.25);border-radius:10px;cursor:pointer;font-weight:600;font-size:10px;">➕ Add</button>
          <button id="cs-grow" style="padding:8px;background:rgba(255,100,100,0.15);color:rgba(255,120,120,0.92);border:1px solid rgba(255,100,100,0.25);border-radius:10px;cursor:pointer;font-weight:600;font-size:10px;">📈 Grow</button>
        </div>
        <button id="cs-edit-stats" style="width:100%;padding:8px;background:rgba(100,180,100,0.15);color:rgba(120,200,120,0.92);border:1px solid rgba(100,180,100,0.25);border-radius:10px;cursor:pointer;font-weight:600;font-size:10px;">✏️ Edit Stats</button>
        <button id="cs-compare" style="width:100%;padding:8px;background:rgba(200,150,100,0.15);color:rgba(220,170,120,0.92);border:1px solid rgba(200,150,100,0.25);border-radius:10px;cursor:pointer;font-weight:600;font-size:10px;">📏 Compare</button>
        <button id="cs-copy" style="width:100%;padding:8px;background:rgba(150,100,200,0.15);color:rgba(180,130,220,0.92);border:1px solid rgba(150,100,200,0.25);border-radius:10px;cursor:pointer;font-weight:600;font-size:10px;">📋 Copy</button>
        <button id="cs-inject" style="width:100%;padding:8px;background:rgba(100,200,100,0.15);color:rgba(120,220,120,0.92);border:1px solid rgba(100,200,100,0.25);border-radius:10px;cursor:pointer;font-weight:600;font-size:10px;">💉 Manual Inject</button>
        <button id="cs-reset" style="width:100%;padding:8px;background:rgba(255,80,80,0.12);color:rgba(255,100,100,0.92);border:1px solid rgba(255,80,80,0.20);border-radius:10px;cursor:pointer;font-weight:600;font-size:10px;">🔄 Reset</button>
      </div>
    `;

    root.appendChild(toggle);
    root.appendChild(panel);
    document.body.appendChild(root);

    toggle.addEventListener("click", () => {
      const isOpen = panel.style.transform === "translateX(0px)";
      panel.style.transform = isOpen ? "translateX(-400px)" : "translateX(0)";
      panel.style.opacity = isOpen ? "0" : "1";
    });

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target) && panel.style.opacity === "1") {
        panel.style.transform = "translateX(-400px)";
        panel.style.opacity = "0";
      }
    });

    document.getElementById("cs-enable").addEventListener("change", (e) => {
      prefs.enabled = e.target.checked;
      savePrefs();
    });

    document.getElementById("cs-auto-inject").addEventListener("change", (e) => {
      prefs.autoInject = e.target.checked;
      savePrefs();
    });

    document.getElementById("cs-inject-role").addEventListener("change", (e) => {
      prefs.injectRole = e.target.value;
      savePrefs();
    });

    const autoUpdateCheckbox = document.getElementById("autoUpdateFromAI");
    if (autoUpdateCheckbox) {
      autoUpdateCheckbox.checked = prefs.autoUpdateFromAI;
      autoUpdateCheckbox.addEventListener("change", (e) => {
        prefs.autoUpdateFromAI = e.target.checked;
        savePrefs();
      });
    }

    document.getElementById("cs-add").addEventListener("click", openAddStatDialog);
    document.getElementById("cs-grow").addEventListener("click", openGrowDialog);
    document.getElementById("cs-edit-stats").addEventListener("click", openEditMode);
    document.getElementById("cs-compare").addEventListener("click", openComparisonDialog);
    document.getElementById("cs-copy").addEventListener("click", manualInjectStats);
    document.getElementById("cs-inject").addEventListener("click", manualInjectStats);

    document.getElementById("cs-default-stats").addEventListener("change", (e) => {
      const value = e.target.value;
      if (value) {
        const stat = DEFAULT_STATS.find(s => s.name.toLowerCase().replace(/\s+/g, "_") === value);
        if (stat) {
          addDefaultStat(stat.name, stat.unit);
        }
      }
      e.target.value = "";
    });

    document.getElementById("cs-reset").addEventListener("click", () => {
      if (confirm("🗑️ Reset ALL character tabs? Only the global tab will remain.")) {
        // Clear all tabs except global
        for (const key of Object.keys(statsData)) {
          if (key !== "global") {
            delete statsData[key];
          } else {
            statsData[key] = {};
          }
        }
        // If current key was deleted, switch to global
        if (!statsData[currentCharKey]) {
          currentCharKey = "global";
        }
        saveStats();
        updateDisplay();
      }
    });

    console.log("[character-stats] 🎨 UI built");
    updateDisplay();
  }

  // ========================= BOOT =========================
  function boot() {
    console.log("[character-stats] 🚀 BOOT");
    loadData();
    currentCharKey = getCurrentCharKey();
    buildUI();
    wrapFetch();
    setupChatMonitoring();

    setInterval(() => {
      getCurrentCharKey();
    }, 1000);

    console.log("[character-stats] ✅ READY");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

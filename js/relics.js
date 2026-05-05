let RELICS_DB = [];

async function loadRelicsData() {
  try {
    const response = await fetch('data/relics.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    RELICS_DB = JSON.parse(text);
    console.log('Relics loaded:', RELICS_DB.length);
  } catch (e) {
    console.error('Failed to load relics data:', e);
  }
}

function createRelicInstance(relicId) {
  const template = RELICS_DB.find(r => r.id === relicId);
  if (!template) return null;
  return JSON.parse(JSON.stringify(template));
}

function getRandomRelic(rarityFilter = null) {
  const pool = rarityFilter 
    ? RELICS_DB.filter(r => r.rarity === rarityFilter)
    : RELICS_DB;
  if (pool.length === 0) return null;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return JSON.parse(JSON.stringify(template));
}

function applyRelicBonuses() {
  const bonuses = { strength: 0, dexterity: 0, extraMana: 0, extraDraw: 0, blockBonus: 0, damageMultiplier: 1 };
  for (const relic of GameState.relics) {
    if (relic.bonuses) {
      if (relic.bonuses.strength) bonuses.strength += relic.bonuses.strength;
      if (relic.bonuses.dexterity) bonuses.dexterity += relic.bonuses.dexterity;
      if (relic.bonuses.extraMana) bonuses.extraMana += relic.bonuses.extraMana;
      if (relic.bonuses.extraDraw) bonuses.extraDraw += relic.bonuses.extraDraw;
      if (relic.bonuses.blockBonus) bonuses.blockBonus += relic.bonuses.blockBonus;
      if (relic.bonuses.damageMultiplier) bonuses.damageMultiplier *= relic.bonuses.damageMultiplier;
    }
  }
  return bonuses;
}

function hasRelic(relicId) {
  return GameState.relics.some(r => r.id === relicId);
}
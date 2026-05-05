let CARDS_DB = [];

async function loadCardsData() {
  try {
    const response = await fetch('data/cards.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    CARDS_DB = JSON.parse(text);
    console.log('Cards loaded:', CARDS_DB.length);
  } catch (e) {
    console.error('Failed to load cards data:', e);
  }
}

function createCardInstance(cardId) {
  const template = CARDS_DB.find(c => c.id === cardId);
  if (!template) return null;
  return JSON.parse(JSON.stringify(template));
}

function getRandomCard(rarityFilter = null) {
  const pool = rarityFilter 
    ? CARDS_DB.filter(c => c.rarity === rarityFilter)
    : CARDS_DB;
  if (pool.length === 0) return null;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return JSON.parse(JSON.stringify(template));
}

function getCardChoices(count = 3) {
  const choices = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let rarity = 'common';
    if (roll < 0.1) rarity = 'rare';
    else if (roll < 0.3) rarity = 'uncommon';
    const card = getRandomCard(rarity);
    if (card) choices.push(card);
  }
  return choices;
}
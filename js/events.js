let EVENTS_DB = [];

async function loadEventsData() {
  try {
    const response = await fetch('data/events.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    EVENTS_DB = JSON.parse(text);
    console.log('Events loaded:', EVENTS_DB.length);
  } catch (e) {
    console.error('Failed to load events data:', e);
  }
}

function getRandomEvent() {
  if (EVENTS_DB.length === 0) return null;
  const idx = Math.floor(Math.random() * EVENTS_DB.length);
  return EVENTS_DB[idx];
}

function executeEventChoice(eventData, choiceIndex) {
  const choice = eventData.choices[choiceIndex];
  if (!choice) return;
  
  let resultText = choice.resultText;
  
  if (choice.goldCost) {
    GameState.player.gold = Math.max(0, GameState.player.gold - choice.goldCost);
  }
  
  if (choice.hpLoss) {
    GameState.player.hp = Math.max(0, GameState.player.hp - choice.hpLoss);
  }
  
  if (choice.reward) {
    const r = choice.reward;
    if (r.gold) GameState.player.gold += r.gold;
    if (r.heal) GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + r.heal);
    if (r.maxHp) {
      GameState.player.maxHp += r.maxHp;
      GameState.player.hp += r.maxHp;
    }
    if (r.strength) GameState.player.strength += r.strength;
    if (r.relic) {
      const relic = createRelicInstance(r.relic);
      if (relic) GameState.relics.push(relic);
    }
    if (r.randomRelic) {
      const relic = getRandomRelic();
      if (relic) GameState.relics.push(relic);
    }
    if (r.randomCard) {
      const card = getRandomCard(r.randomCard);
      if (card) GameState.deck.push(card);
    }
    if (r.poison) {
      GameState.player.poison = (GameState.player.poison || 0) + r.poison;
    }
  }
  
  return resultText;
}
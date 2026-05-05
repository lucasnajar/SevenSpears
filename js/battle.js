// battle.js - versão final com correção da Cursed Armor e outros ajustes

let battleState = null;

function startBattle(enemyData, deckManager) {
  battleState = {
    enemy: enemyData,
    deckManager: deckManager,
    playerHP: GameState.player.hp,
    playerMaxHP: GameState.player.maxHp,
    playerBlock: 0,
    playerStrength: GameState.player.strength,
    playerDexterity: GameState.player.dexterity,
    mana: 3,
    maxMana: 3,
    turnNumber: 1,
    playerStatusEffects: [],
    enemyStatusEffects: [],
    powersActive: [],
    firstCardPlayedThisTurn: false,
    deathSaveUsed: false,
    battleEnded: false
  };
  
  for (const relic of GameState.relics) {
    if (relic.effect === 'combatStart' && relic.bonuses.enemyWeakStart) {
      applyStatus(battleState.enemyStatusEffects, 'weak', relic.bonuses.enemyWeakStart);
    }
  }
  
  battleState.maxMana = 3 + applyRelicBonuses().extraMana;
  battleState.mana = battleState.maxMana;
  
  updateEnemyIntent();
  return battleState;
}

function applyStatus(statusArray, type, amount) {
  const existing = statusArray.find(s => s.type === type);
  if (existing) {
    existing.amount += amount;
  } else {
    statusArray.push({ type, amount });
  }
}

function getStatusAmount(statusArray, type) {
  const found = statusArray.find(s => s.type === type);
  return found ? found.amount : 0;
}

function updateEnemyIntent() {
  const intent = battleState.enemy.intent[battleState.enemy.intentIndex % battleState.enemy.intent.length];
  battleState.currentIntent = intent;
}

function calculatePlayerDamage(card) {
  let damage = card.damage || 0;
  damage += battleState.playerStrength;
  if (getStatusAmount(battleState.playerStatusEffects, 'weak') > 0) {
    damage = Math.floor(damage * 0.75);
  }
  if (getStatusAmount(battleState.enemyStatusEffects, 'vulnerable') > 0) {
    damage = Math.floor(damage * 1.5);
  }
  if (card.id === 'shadow_strike' && getStatusAmount(battleState.enemyStatusEffects, 'vulnerable') > 0) {
    damage += (card.vulnerableBonus || 5);
  }
  const relicBonuses = applyRelicBonuses();
  damage = Math.floor(damage * relicBonuses.damageMultiplier);
  return damage;
}

function calculatePlayerBlock(card) {
  let block = card.block || 0;
  block += battleState.playerDexterity;
  const relicBonuses = applyRelicBonuses();
  block += relicBonuses.blockBonus;
  return block;
}

function playCard(cardIndex) {
  if (battleState.battleEnded) return false;
  const card = battleState.deckManager.hand[cardIndex];
  if (!card) return false;
  
  let cost = card.cost;
  if (!battleState.firstCardPlayedThisTurn && hasRelic('shadow_cloak')) {
    cost = Math.max(0, cost - 1);
  }
  
  if (battleState.mana < cost) return false;
  
  battleState.mana -= cost;
  battleState.firstCardPlayedThisTurn = true;
  
  if (card.damage > 0 || card.type === 'attack') {
    let dmg = calculatePlayerDamage(card);
    dealDamageToEnemy(dmg);
  }
  if (card.block > 0 || card.type === 'defense') {
    let blk = calculatePlayerBlock(card);
    battleState.playerBlock += blk;
    AudioSystem.shieldBlock();
  }
  if (card.poison) applyStatus(battleState.enemyStatusEffects, 'poison', card.poison);
  if (card.burn) applyStatus(battleState.enemyStatusEffects, 'burn', card.burn);
  if (card.strengthGain) battleState.playerStrength += card.strengthGain;
  if (card.dexterityGain) battleState.playerDexterity += card.dexterityGain;
  if (card.healAmount) {
    battleState.playerHP = Math.min(battleState.playerMaxHP, battleState.playerHP + card.healAmount);
    AudioSystem.playTone(1000, 0.1, 'sine', 0.08);
  }
  if (card.drawCards) {
    battleState.deckManager.drawCards(card.drawCards);
  }
  if (card.hpLoss) {
    battleState.playerHP = Math.max(0, battleState.playerHP - card.hpLoss);
  }
  if (card.passiveDamage) {
    battleState.powersActive.push({ type: 'darkAura', value: card.passiveDamage });
  }
  if (card.passiveBlock) {
    battleState.powersActive.push({ type: 'cursedArmor', value: card.passiveBlock });
  }
  
  if (card.type === 'attack' && hasRelic('blood_amulet')) {
    battleState.playerHP = Math.min(battleState.playerMaxHP, battleState.playerHP + 2);
  }
  
  battleState.deckManager.removeCardFromHand(cardIndex);
  AudioSystem.cardPlay();
  
  if (battleState.enemy.currentHp <= 0) {
    endBattle(true);
    return true;
  }
  
  return true;
}

function dealDamageToEnemy(amount) {
  if (battleState.enemy.block > 0) {
    const blocked = Math.min(battleState.enemy.block, amount);
    battleState.enemy.block -= blocked;
    amount -= blocked;
  }
  battleState.enemy.currentHp = Math.max(0, battleState.enemy.currentHp - amount);
  AudioSystem.enemyHit();
  if (typeof UI !== 'undefined' && UI.showDamageNumber) {
    UI.showDamageNumber(amount, 'enemy');
  }
}

function endPlayerTurn() {
  if (battleState.battleEnded) return;
  
  // CORREÇÃO: Zera o block do jogador ANTES de aplicar os poderes passivos
  // O block do turno anterior já foi usado, agora preparamos o block para o próximo turno
  battleState.playerBlock = 0;
  
  // Aplica poderes passivos (Dark Aura causa dano, Cursed Armor gera block)
  for (const power of battleState.powersActive) {
    if (power.type === 'darkAura') {
      dealDamageToEnemy(power.value);
    }
    if (power.type === 'cursedArmor') {
      battleState.playerBlock += power.value;
    }
  }
  
  // Processa a intenção do inimigo (ataque, defesa, debuff)
  const intent = battleState.currentIntent;
  if (intent.action === 'attack') {
    let dmg = intent.value;
    if (battleState.playerBlock > 0) {
      const blocked = Math.min(battleState.playerBlock, dmg);
      battleState.playerBlock -= blocked;
      dmg -= blocked;
    }
    if (dmg > 0) {
      battleState.playerHP = Math.max(0, battleState.playerHP - dmg);
      if (typeof UI !== 'undefined' && UI.showDamageNumber) {
        UI.showDamageNumber(dmg, 'player');
      }
      AudioSystem.playerHit();
    }
  } else if (intent.action === 'defend') {
    battleState.enemy.block += intent.value;
  } else if (intent.action === 'vulnerable') {
    applyStatus(battleState.playerStatusEffects, 'vulnerable', intent.value);
  } else if (intent.action === 'weak') {
    applyStatus(battleState.playerStatusEffects, 'weak', intent.value);
  }
  
  // Processa efeitos de status (poison, burn) no jogador e inimigo
  processStatusEffects(battleState.playerStatusEffects, 'player');
  processStatusEffects(battleState.enemyStatusEffects, 'enemy');
  
  // Verifica morte do jogador (com relíquia Demon Heart)
  if (battleState.playerHP <= 0) {
    if (hasRelic('demon_heart') && !battleState.deathSaveUsed) {
      battleState.deathSaveUsed = true;
      battleState.playerHP = 1;
    } else {
      endBattle(false);
      return;
    }
  }
  if (battleState.enemy.currentHp <= 0) {
    endBattle(true);
    return;
  }
  
  // Prepara próximo turno
  battleState.turnNumber++;
  battleState.enemy.intentIndex++;
  updateEnemyIntent();
  battleState.mana = battleState.maxMana;
  // NÃO zerar playerBlock novamente aqui (já foi zerado no início)
  battleState.firstCardPlayedThisTurn = false;
  
  // Compra de cartas e efeitos de relíquia
  let drawCount = 5;
  const relicBonuses = applyRelicBonuses();
  drawCount += relicBonuses.extraDraw;
  if (hasRelic('lucky_charm') && Math.random() < 0.1) drawCount++;
  battleState.deckManager.discardHand();
  battleState.deckManager.drawCards(drawCount);
  
  // Força atualização da UI para mostrar o novo estado (inclusive block)
  if (typeof UI !== 'undefined' && UI.renderBattle) {
    UI.renderBattle(battleState);
  }
}

function processStatusEffects(statusArray, target) {
  for (const status of statusArray) {
    if (status.type === 'poison' && status.amount > 0) {
      if (target === 'player') {
        battleState.playerHP = Math.max(0, battleState.playerHP - status.amount);
      } else {
        dealDamageToEnemy(status.amount);
      }
    }
    if (status.type === 'burn' && status.amount > 0) {
      if (target === 'player') {
        battleState.playerHP = Math.max(0, battleState.playerHP - status.amount * 2);
      } else {
        dealDamageToEnemy(status.amount * 2);
      }
    }
    status.amount = Math.max(0, status.amount - 1);
  }
}

function endBattle(victory) {
  battleState.battleEnded = true;
  GameState.player.hp = battleState.playerHP;
  GameState.player.strength = 0;
  GameState.player.dexterity = 0;
  battleState.deckManager.discardHand();
  const allCards = [...battleState.deckManager.drawPile, ...battleState.deckManager.discardPile];
  GameState.deck = allCards;
  
  if (victory) {
    AudioSystem.victory();
    const reward = battleState.enemy.reward;
    GameState.player.gold += reward.gold;
    if (typeof UI !== 'undefined' && UI.showVictoryScreen) {
      UI.showVictoryScreen(battleState.enemy, reward);
    }
  } else {
    AudioSystem.defeat();
    if (typeof UI !== 'undefined' && UI.showGameOverScreen) {
      UI.showGameOverScreen();
    }
  }
}

function showDamageNumber(amount, target) {
  if (typeof UI !== 'undefined' && UI.showDamageNumber) {
    UI.showDamageNumber(amount, target);
  }
}
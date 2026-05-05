const UI = {
  currentScreen: null,

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
      this.currentScreen = screenId;
    }
  },

  showMenu() {
    this.showScreen('menu-screen');
    document.getElementById('load-game-btn').style.display = GameState.hasSave() ? 'inline-block' : 'none';
  },

  showMap() {
    this.showScreen('map-screen');
    this.updateRelicsUI();               // <-- NOVO: atualiza relíquias ao mostrar mapa
    setTimeout(() => {
      if (this.currentScreen === 'map-screen') {
        this.renderMap();
        this.updateMapHeader();
      }
    }, 20);
  },

  renderMap() {
    const map = GameState.mapData;
    if (!map) return;

    let container = document.getElementById('map-container');
    let svg = document.getElementById('map-connections');

    if (!container || !svg) {
      const mapScreen = document.getElementById('map-screen');
      if (!mapScreen) return;
      const oldContainer = mapScreen.querySelector('#map-container');
      if (oldContainer) oldContainer.remove();
      const oldSvg = mapScreen.querySelector('#map-connections');
      if (oldSvg) oldSvg.remove();

      container = document.createElement('div');
      container.id = 'map-container';
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'map-connections';
      container.appendChild(svg);
      mapScreen.appendChild(container);
    }

    container.innerHTML = '';
    container.appendChild(svg);
    svg.innerHTML = '';

    if (map.connections && map.connections.length) {
      map.connections.forEach(conn => {
        const from = conn.from;
        const to = conn.to;
        const fromX = from.x + (from.type === 'boss' ? 40 : 30);
        const fromY = from.y + (from.type === 'boss' ? 40 : 30);
        const toX = to.x + (to.type === 'boss' ? 40 : 30);
        const toY = to.y + (to.type === 'boss' ? 40 : 30);

        const cp1x = fromX + (toX - fromX) * 0.4;
        const cp1y = fromY - 20;
        const cp2x = toX - (toX - fromX) * 0.4;
        const cp2y = toY - 20;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`);
        path.setAttribute('stroke', (from.visited || to.visited) ? '#d4a547' : '#444');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
      });
    }

    map.nodes.forEach(node => {
      const div = document.createElement('div');
      div.className = `map-node ${node.type} ${node.visited ? 'visited' : ''} ${node.available ? 'available' : ''} ${node.current ? 'current' : ''}`;
      div.style.left = node.x + 'px';
      div.style.top = node.y + 'px';

      const iconMap = {
        combat: '⚔️',
        elite: '💀',
        shop: '🛒',
        campfire: '🔥',
        event: '❓',
        boss: '👑',
        start: '🏁'
      };
      div.innerHTML = `<span class="node-icon">${iconMap[node.type] || '?'}</span>`;

      if (node.available) {
        div.addEventListener('click', (function(id) {
          return function() {
            if (moveToNode(id)) {
              UI.handleNodeEntry(map.nodes.find(n => n.id === id));
            }
          };
        })(node.id));
      }
      container.appendChild(div);
    });
  },

  handleNodeEntry(node) {
    switch (node.type) {
      case 'combat':
      case 'elite':
      case 'boss':
        this.startCombat(node);
        break;
      case 'shop':
        this.showShop();
        break;
      case 'campfire':
        this.showCampfire();
        break;
      case 'event':
        this.showEvent();
        break;
    }
  },

  startCombat(node) {
    let enemy;
    if (node.type === 'boss') {
      enemy = createEnemyInstance('castle_lord');
    } else if (node.type === 'elite') {
      const elites = ['cursed_golem', 'shadow_lord'];
      enemy = createEnemyInstance(elites[Math.floor(Math.random() * elites.length)]);
    } else {
      enemy = getRandomEnemy('normal');
    }
    const dm = new DeckManager(GameState.deck);
    dm.drawCards(5);
    const battle = startBattle(enemy, dm);
    this.renderBattle(battle);
    this.showScreen('battle-screen');
  },

  renderBattle(battle) {
    document.getElementById('player-hp').textContent = `${battle.playerHP}/${battle.playerMaxHP}`;
    document.getElementById('player-hp-bar').style.width = (battle.playerHP / battle.playerMaxHP * 100) + '%';
    document.getElementById('player-block').textContent = battle.playerBlock > 0 ? `🛡️ ${battle.playerBlock}` : '';
    document.getElementById('player-strength').textContent = battle.playerStrength > 0 ? `💪 ${battle.playerStrength}` : '';
    document.getElementById('player-dexterity').textContent = battle.playerDexterity > 0 ? `👟 ${battle.playerDexterity}` : '';

    document.getElementById('enemy-name').textContent = battle.enemy.name;
    document.getElementById('enemy-sprite').textContent = battle.enemy.sprite || '👹';
    document.getElementById('enemy-hp').textContent = `${battle.enemy.currentHp}/${battle.enemy.maxHp}`;
    document.getElementById('enemy-hp-bar').style.width = (battle.enemy.currentHp / battle.enemy.maxHp * 100) + '%';
    document.getElementById('enemy-block').textContent = battle.enemy.block > 0 ? `🛡️ ${battle.enemy.block}` : '';
    document.getElementById('enemy-intent').textContent = `${battle.currentIntent.action}: ${battle.currentIntent.value}`;

    this.renderMana(battle.mana, battle.maxMana);
    this.renderHand(battle.deckManager.hand);
    this.updateRelicsUI();               // <-- NOVO: atualiza relíquias na batalha

    document.getElementById('end-turn-btn').disabled = false;
  },

  renderMana(current, max) {
    const container = document.getElementById('mana-display');
    container.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const gem = document.createElement('div');
      gem.className = 'mana-gem' + (i >= current ? ' empty' : '');
      container.appendChild(gem);
    }
  },

  renderHand(hand) {
    const container = document.getElementById('hand-container');
    container.innerHTML = '';
    hand.forEach((card, index) => {
      const div = document.createElement('div');
      div.className = `card card-${card.type} ${card.rarity === 'rare' ? 'card-rare' : ''} ${battleState.mana < card.cost ? 'unaffordable' : ''}`;
      div.innerHTML = `
        <div class="card-cost">${card.cost}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-type">${card.type}</div>
        <div class="card-description">${card.description}</div>
        ${card.upgraded ? '<div class="card-upgraded">UPGRADED</div>' : ''}
      `;
      div.addEventListener('click', () => {
        if (playCard(index)) {
          this.renderBattle(battleState);
          if (battleState.battleEnded) return;
        }
      });
      container.appendChild(div);
    });
  },

  showDamageNumber(amount, target) {
    const container = document.getElementById('damage-numbers-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `damage-number ${target === 'player' ? 'damage' : 'damage'}`;
    div.textContent = '-' + amount;
    div.style.left = (target === 'player' ? '20%' : '70%');
    div.style.top = '40%';
    container.appendChild(div);
    setTimeout(() => div.remove(), 1000);
  },

  showEvent() {
    const event = getRandomEvent();
    if (!event) return;
    this.showScreen('event-screen');
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-text').textContent = event.text;
    const choicesDiv = document.getElementById('event-choices');
    choicesDiv.innerHTML = '';
    const resultP = document.getElementById('event-result');
    const continueBtn = document.getElementById('event-continue');
    resultP.style.display = 'none';
    continueBtn.style.display = 'none';

    event.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'event-choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        const result = executeEventChoice(event, i);
        resultP.textContent = result;
        resultP.style.display = 'block';
        continueBtn.style.display = 'inline-block';
        choicesDiv.querySelectorAll('button').forEach(b => b.disabled = true);
        this.updateMapHeader();
        this.updateRelicsUI();          // <-- NOVO: após ganhar relic em evento
      });
      choicesDiv.appendChild(btn);
    });

    continueBtn.onclick = () => {
      this.showMap();
    };
  },

  showShop() {
    this.showScreen('shop-screen');
    document.getElementById('shop-gold').textContent = GameState.player.gold;
    const container = document.getElementById('shop-items');
    container.innerHTML = '';

    const items = [];
    const cards = getCardChoices(2);
    cards.forEach(c => items.push({ type: 'card', data: c, price: c.rarity === 'rare' ? 75 : c.rarity === 'uncommon' ? 50 : 30 }));
    const relic = getRandomRelic();
    if (relic) items.push({ type: 'relic', data: relic, price: relic.rarity === 'rare' ? 120 : relic.rarity === 'uncommon' ? 80 : 50 });

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = `shop-item ${item.type === 'relic' ? 'relic-' + item.data.rarity : ''}`;
      div.innerHTML = `
        <div class="shop-item-name">${item.data.name}</div>
        <div class="shop-item-desc">${item.data.description || item.data.effect}</div>
        <div class="shop-item-price">${item.price} Gold</div>
      `;
      div.addEventListener('click', () => {
        if (GameState.player.gold >= item.price) {
          GameState.player.gold -= item.price;
          if (item.type === 'card') {
            GameState.deck.push(item.data);
          } else {
            GameState.relics.push(item.data);
            UI.updateRelicsUI();          // <-- NOVO: atualiza ao comprar relic
          }
          document.getElementById('shop-gold').textContent = GameState.player.gold;
          div.style.opacity = '0.5';
          div.style.pointerEvents = 'none';
        }
      });
      container.appendChild(div);
    });

    document.getElementById('shop-leave').onclick = () => this.showMap();
  },

  showCampfire() {
    this.showScreen('campfire-screen');
    document.getElementById('campfire-rest').onclick = () => {
      const healAmount = Math.floor(GameState.player.maxHp * 0.3);
      GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + healAmount);
      this.updateMapHeader();
      this.showMap();
    };
    document.getElementById('campfire-smith').onclick = () => {
      if (GameState.deck.length > 0) {
        const upgradable = GameState.deck.filter(c => c && !c.upgraded);
        if (upgradable.length > 0) {
          const card = upgradable[Math.floor(Math.random() * upgradable.length)];
          card.upgraded = true;
          if (card.damage) card.damage += (card.upgradeBonus || 3);
          if (card.block) card.block += (card.upgradeBonus || 2);
          card.name += '+';
        }
      }
      this.showMap();
    };
  },

  showVictoryScreen(enemy, reward) {
    this.showScreen('victory-screen');
    const rewardsDiv = document.getElementById('victory-rewards');
    rewardsDiv.innerHTML = `<p>Gold: +${reward.gold}</p>`;
    if (reward.relic) {
      const relic = getRandomRelic();
      if (relic) {
        GameState.relics.push(relic);
        rewardsDiv.innerHTML += `<p class="relic-reward">Relic: ${relic.name}</p>`;
        this.updateRelicsUI();          // <-- NOVO: atualiza relic
      }
    }
    document.getElementById('continue-btn').onclick = () => {
      if (enemy.type === 'boss') {
        GameState.player.currentFloor++;
        if (GameState.player.currentFloor > 3) {
          alert('You have conquered the Cursed Castle! Congratulations!');
          location.reload();
          return;
        }
        GameState.mapData = generateMap(GameState.player.currentFloor);
        const startNode = GameState.mapData.nodes.find(n => n.current === true);
        if (startNode) GameState.currentNodeId = startNode.id;
        GameState.visitedNodes = [];
      }
      this.showCardReward(reward);
    };
  },

  showCardReward(reward) {
    this.showScreen('card-reward-screen');
    const container = document.getElementById('card-reward-container');
    container.innerHTML = '';
    const choices = getCardChoices(reward.cardChoices || 3);
    choices.forEach(card => {
      const div = document.createElement('div');
      div.className = 'reward-card';
      div.innerHTML = `
        <div class="reward-card-cost">${card.cost}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-type">${card.type}</div>
        <div class="card-description">${card.description}</div>
      `;
      div.addEventListener('click', () => {
        GameState.deck.push(card);
        this.showMap();
      });
      container.appendChild(div);
    });
    document.getElementById('card-reward-skip').onclick = () => this.showMap();
  },

  showGameOverScreen() {
    this.showScreen('game-over-screen');
  },

  updateMapHeader() {
    document.getElementById('current-floor').textContent = `Floor ${GameState.player.currentFloor}`;
    document.getElementById('map-player-hp').textContent = `${GameState.player.hp}/${GameState.player.maxHp} HP`;
    document.getElementById('map-player-gold').textContent = `${GameState.player.gold} Gold`;
  },

  // ========== NOVOS MÉTODOS PARA RELÍQUIAS ==========
  updateRelicsUI() {
    const containers = [
      document.getElementById('map-relics-container'),
      document.getElementById('battle-relics-container')
    ];
    containers.forEach(container => {
      if (!container) return;
      container.innerHTML = '';
      if (!GameState.relics || GameState.relics.length === 0) {
        const emptySpan = document.createElement('span');
        emptySpan.textContent = 'Nenhuma';
        emptySpan.style.color = 'var(--text-muted)';
        container.appendChild(emptySpan);
        return;
      }
      GameState.relics.forEach(relic => {
        const relicDiv = document.createElement('div');
        relicDiv.className = 'relic-icon';
        const icon = this.getRelicIcon(relic.id);
        relicDiv.innerHTML = `
          <span style="font-size: 1.2rem;">${icon}</span>
          <span class="relic-tooltip">${relic.name}: ${relic.description}</span>
        `;
        container.appendChild(relicDiv);
      });
    });
  },

  getRelicIcon(relicId) {
    const icons = {
      'cursed_ring': '💍',
      'tarnished_shield': '🛡️',
      'lucky_charm': '🍀',
      'blood_amulet': '🩸',
      'void_stone': '⚫',
      'ancient_tome': '📖',
      'shadow_cloak': '👻',
      'demon_heart': '❤️‍🔥',
      'crown_of_shadows': '👑',
      'soul_cage': '🔮'
    };
    return icons[relicId] || '✨';
  }
};
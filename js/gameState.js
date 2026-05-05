const GameState = {
  player: {
    hp: 75,
    maxHp: 75,
    gold: 50,
    currentFloor: 1,
    strength: 0,
    dexterity: 0,
    block: 0
  },
  deck: [],
  relics: [],
  mapData: null,
  currentNodeId: null,
  visitedNodes: [],
  inBattle: false,
  currentClass: 'knight',      // ← NOVO: guarda a classe ativa

  reset() {
    this.player.hp = 75;
    this.player.maxHp = 75;
    this.player.gold = 50;
    this.player.currentFloor = 1;
    this.player.strength = 0;
    this.player.dexterity = 0;
    this.player.block = 0;
    this.deck = [];
    this.relics = [];
    this.mapData = null;
    this.currentNodeId = null;
    this.visitedNodes = [];
    this.inBattle = false;
    this.currentClass = 'knight';
  },

  // NOVO: inicializa o estado com base na classe escolhida
  initFromClass(className) {
    this.currentClass = className;
    const classData = CLASS_DATA[className];
    if (!classData) return;

    this.player.hp = classData.hp;
    this.player.maxHp = classData.hp;
    this.player.gold = classData.gold;
    this.player.strength = classData.strength;
    this.player.dexterity = classData.dexterity;

    // Deck inicial da classe
    this.deck = classData.starterDeck();

    // Relíquia inicial (se houver)
    this.relics = [];
    if (classData.starterRelic) {
      const relic = createRelicInstance(classData.starterRelic);
      if (relic) this.relics.push(relic);
    }
  },

  save() {
    const saveData = {
      player: { ...this.player },
      deck: this.deck.map(c => ({ ...c })),
      relics: this.relics.map(r => ({ ...r })),
      mapData: this.mapData,
      currentNodeId: this.currentNodeId,
      visitedNodes: [...this.visitedNodes],
      currentClass: this.currentClass    // ← salva a classe
    };
    localStorage.setItem('cursedCastleSave', JSON.stringify(saveData));
    return true;
  },

  load() {
    const raw = localStorage.getItem('cursedCastleSave');
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      this.player = data.player;
      this.deck = data.deck.filter(c => c != null);
      this.relics = data.relics;
      this.mapData = data.mapData;
      this.currentNodeId = data.currentNodeId;
      this.visitedNodes = data.visitedNodes || [];
      this.currentClass = data.currentClass || 'knight'; // compatibilidade com saves antigos
      return true;
    } catch (e) {
      return false;
    }
  },

  hasSave() {
    return !!localStorage.getItem('cursedCastleSave');
  }
};

// ================== DEFINIÇÃO DAS CLASSES ==================
const CLASS_DATA = {
  knight: {
    name: 'Cursed Knight',
    hp: 75,
    gold: 50,
    strength: 0,
    dexterity: 0,
    starterRelic: null,
    starterDeck: () => {
      const deck = [];
      for (let i = 0; i < 5; i++) deck.push(createCardInstance('strike'));
      for (let i = 0; i < 3; i++) deck.push(createCardInstance('defend'));
      deck.push(createCardInstance('heavy_strike'));
      deck.push(createCardInstance('iron_wall'));
      return deck;
    }
  },
  rogue: {
    name: 'Shadow Rogue',
    hp: 60,
    gold: 60,
    strength: 1,
    dexterity: 2,
    starterRelic: 'shadow_cloak',
    starterDeck: () => {
      const deck = [];
      for (let i = 0; i < 4; i++) deck.push(createCardInstance('strike'));
      for (let i = 0; i < 3; i++) deck.push(createCardInstance('defend'));
      deck.push(createCardInstance('shadow_strike'));
      deck.push(createCardInstance('cursed_slash'));
      deck.push(createCardInstance('vampiric_touch'));
      return deck;
    }
  },
  mage: {
    name: 'Cursed Mage',
    hp: 50,
    gold: 40,
    strength: 0,
    dexterity: 0,
    starterRelic: 'void_stone',
    starterDeck: () => {
      const deck = [];
      for (let i = 0; i < 3; i++) deck.push(createCardInstance('strike'));
      for (let i = 0; i < 2; i++) deck.push(createCardInstance('defend'));
      deck.push(createCardInstance('cursed_slash'));
      deck.push(createCardInstance('dark_aura'));
      deck.push(createCardInstance('corruption'));
      return deck;
    }
  }
};
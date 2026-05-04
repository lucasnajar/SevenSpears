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
  currentNodeIndex: 0,
  visitedNodes: [],
  inBattle: false,
  
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
    this.currentNodeIndex = 0;
    this.visitedNodes = [];
    this.inBattle = false;
  },
  
  save() {
    const saveData = {
      player: { ...this.player },
      deck: this.deck.map(c => ({ ...c })),
      relics: this.relics.map(r => ({ ...r })),
      mapData: this.mapData,
      currentNodeIndex: this.currentNodeIndex,
      visitedNodes: [...this.visitedNodes]
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
      this.currentNodeIndex = data.currentNodeIndex;
      this.visitedNodes = data.visitedNodes;
      return true;
    } catch (e) {
      return false;
    }
  },
  
  hasSave() {
    return !!localStorage.getItem('cursedCastleSave');
  }
};
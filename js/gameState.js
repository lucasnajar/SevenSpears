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
  currentNodeId: null,        // ← mudou de currentNodeIndex para currentNodeId
  visitedNodes: [],           // agora guarda strings (IDs), não números
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
    this.currentNodeId = null;      // ← antigo currentNodeIndex
    this.visitedNodes = [];         // ← array vazio
    this.inBattle = false;
  },
  
  save() {
    const saveData = {
      player: { ...this.player },
      deck: this.deck.map(c => ({ ...c })),
      relics: this.relics.map(r => ({ ...r })),
      mapData: this.mapData,
      currentNodeId: this.currentNodeId,   // ← salva o ID (string)
      visitedNodes: [...this.visitedNodes] // ← array de strings
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
      this.currentNodeId = data.currentNodeId;      // ← carrega o ID
      this.visitedNodes = data.visitedNodes || [];  // ← fallback para array vazio
      return true;
    } catch (e) {
      return false;
    }
  },
  
  hasSave() {
    return !!localStorage.getItem('cursedCastleSave');
  }
};
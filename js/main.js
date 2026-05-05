document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadCardsData(),
    loadEnemiesData(),
    loadRelicsData(),
    loadEventsData()
  ]);
  
  document.getElementById('new-game-btn').addEventListener('click', startNewGame);
  document.getElementById('load-game-btn').addEventListener('click', loadGame);
  document.getElementById('end-turn-btn').addEventListener('click', () => {
    if (battleState && !battleState.battleEnded) {
      endPlayerTurn();
      UI.renderBattle(battleState);
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'e' || e.key === 'E') {
      if (battleState && !battleState.battleEnded) {
        endPlayerTurn();
        UI.renderBattle(battleState);
      }
    }
    if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      if (battleState && !battleState.battleEnded && index < battleState.deckManager.hand.length) {
        if (playCard(index)) {
          UI.renderBattle(battleState);
        }
      }
    }
  });
  
  UI.showMenu();
});

function startNewGame() {
  AudioSystem.init();
  GameState.reset();
  GameState.deck = initStartingDeck();
  GameState.mapData = generateMap(1);
  // Localiza o nó inicial e guarda seu ID
  const startNode = GameState.mapData.nodes.find(n => n.current === true);
  if (startNode) GameState.currentNodeId = startNode.id;
  UI.updateMapHeader();
  UI.showMap();
}

function loadGame() {
  if (GameState.load()) {
    AudioSystem.init();
    UI.updateMapHeader();
    UI.showMap();
  }
}
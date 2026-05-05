// Variável global para armazenar a classe selecionada no menu
let selectedClass = 'knight';

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadCardsData(),
    loadEnemiesData(),
    loadRelicsData(),
    loadEventsData()
  ]);

  // --- Configurar seletor de classes (com verificação) ---
  const classCards = document.querySelectorAll('.class-card');
  console.log('Cards encontrados:', classCards.length); // deve ser 3

  if (classCards.length === 0) {
    console.error('Nenhum card de classe encontrado! Verifique o HTML.');
  }

  classCards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove a classe 'selected' de todos
      classCards.forEach(c => c.classList.remove('selected'));
      // Adiciona a classe 'selected' no card clicado
      card.classList.add('selected');
      // Atualiza a variável global com o data-class
      selectedClass = card.getAttribute('data-class');
      console.log('Classe selecionada:', selectedClass);
    });
  });

  // Garantir que a classe padrão (knight) fique visualmente selecionada
  const defaultCard = document.querySelector('.class-card[data-class="knight"]');
  if (defaultCard) {
    defaultCard.classList.add('selected');
    selectedClass = 'knight';
  }

  // Botões principais
  document.getElementById('new-game-btn').addEventListener('click', startNewGame);
  document.getElementById('load-game-btn').addEventListener('click', loadGame);

  // Botão de fim de turno (batalha)
  document.getElementById('end-turn-btn').addEventListener('click', () => {
    if (battleState && !battleState.battleEnded) {
      endPlayerTurn();
      UI.renderBattle(battleState);
    }
  });

  // Teclas de atalho
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
  console.log('Iniciando novo jogo com classe:', selectedClass);
  AudioSystem.init();
  GameState.reset();
  GameState.initFromClass(selectedClass);
  GameState.mapData = generateMap(1);
  const startNode = GameState.mapData.nodes.find(n => n.current === true);
  if (startNode) GameState.currentNodeId = startNode.id;
  UI.updateRelicsUI();
  UI.updateMapHeader();
  UI.showMap();
}

function loadGame() {
  if (GameState.load()) {
    AudioSystem.init();
    UI.updateRelicsUI();
    UI.updateMapHeader();
    UI.showMap();
  }
}
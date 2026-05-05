// map.js - Versão final com ramificações, conexões curvas e navegação por ID

// Gera o mapa procedural com base no andar (floor)
function generateMap(floor) {
  const columns = 8;          // número de colunas (profundidade do mapa)
  const rows = 3;             // até 3 caminhos paralelos
  const nodes = [];

  // 1. Cria os nós (posições) coluna por coluna
  for (let col = 0; col < columns; col++) {
    // Quantos nós nesta coluna? (primeira e última sempre 1 nó)
    let rowCount = 1;
    if (col !== 0 && col !== columns - 1) {
      const r = Math.random();
      if (r < 0.5) rowCount = 2;
      else if (r < 0.7) rowCount = 3;
      else rowCount = 1;
    }

    // Seleciona linhas distintas (0,1,2) para os nós
    const availableRows = [0, 1, 2];
    const selectedRows = [];
    for (let i = 0; i < rowCount; i++) {
      const idx = Math.floor(Math.random() * availableRows.length);
      const row = availableRows[idx];
      selectedRows.push(row);
      availableRows.splice(idx, 1);
    }
    selectedRows.sort((a, b) => a - b);

    // Cria os nós
    for (const row of selectedRows) {
      const nodeType = getNodeType(col, columns);
      nodes.push({
        id: `node_${col}_${row}`,
        col: col,
        row: row,
        type: nodeType,
        x: 80 + col * (800 / (columns - 1)),
        y: 80 + row * 150,
        visited: false,
        available: false,
        current: false
      });
    }
  }

  // Ordena os nós para garantir a ordem (por coluna, depois linha)
  nodes.sort((a, b) => a.col - b.col || a.row - b.row);

  // Marca o primeiro nó (col 0) como atual e disponível
  const startNode = nodes.find(n => n.col === 0);
  if (startNode) {
    startNode.available = true;
    startNode.current = true;
  }

  // 2. Constrói as conexões entre nós de colunas adjacentes
  const connections = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.col === columns - 1) continue; // última coluna sem saída
    const nextColNodes = nodes.filter(n => n.col === node.col + 1);
    for (const next of nextColNodes) {
      // Conecta se a diferença de linha for 0 ou 1 (diagonais permitidas)
      if (Math.abs(next.row - node.row) <= 1) {
        connections.push({ from: node, to: next });
      }
    }
  }

  return { floor, nodes, connections };
}

// Decide o tipo do nó com base na coluna e probabilidades
function getNodeType(col, totalCols) {
  if (col === 0) return 'combat';            // primeiro nó sempre combate
  if (col === totalCols - 1) return 'boss'; // último nó sempre boss

  const roll = Math.random() * 100;
  // Penúltima coluna: chance maior de elite
  if (col === totalCols - 2) {
    if (roll < 40) return 'elite';
    if (roll < 70) return 'combat';
    return 'event';
  }
  // Colunas intermediárias
  if (roll < 45) return 'combat';
  if (roll < 60) return 'elite';
  if (roll < 70) return 'shop';
  if (roll < 80) return 'campfire';
  return 'event';
}

// Move o jogador para o nó de destino (identificado pelo ID)
function moveToNode(targetNodeId) {
  const map = GameState.mapData;
  if (!map) return false;

  const targetNode = map.nodes.find(n => n.id === targetNodeId);
  if (!targetNode || !targetNode.available) return false;

  // Marca o nó atual como visitado e remove 'current'
  const currentNode = map.nodes.find(n => n.current === true);
  if (currentNode) {
    currentNode.current = false;
    currentNode.visited = true;
  }

  // Define o novo nó como atual e visitado
  targetNode.current = true;
  targetNode.visited = true;
  GameState.currentNodeId = targetNode.id;

  // Adiciona à lista de nós visitados (se não estiver)
  if (!GameState.visitedNodes.includes(targetNode.id)) {
    GameState.visitedNodes.push(targetNode.id);
  }

  // Libera os próximos nós alcançáveis
  // Primeiro, reseta 'available' de todos os não visitados
  map.nodes.forEach(n => {
    if (!n.visited) n.available = false;
  });

  // Encontra todos os nós alcançáveis a partir do atual (usando conexões)
  const reachable = getReachableNodes(map, targetNode);
  reachable.forEach(n => {
    if (!n.visited) n.available = true;
  });

  return true;
}

// Função auxiliar: retorna todos os nós que podem ser alcançados a partir de 'fromNode'
function getReachableNodes(map, fromNode) {
  const reachable = [];
  const queue = [fromNode];
  const visitedIds = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visitedIds.has(current.id)) continue;
    visitedIds.add(current.id);
    if (current !== fromNode) reachable.push(current);

    // Busca conexões saindo do nó atual
    const outgoing = map.connections.filter(conn => conn.from.id === current.id);
    for (const conn of outgoing) {
      if (!visitedIds.has(conn.to.id)) {
        queue.push(conn.to);
      }
    }
  }
  return reachable;
}
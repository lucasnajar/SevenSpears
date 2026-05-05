// map.js - versão final com garantia total de conectividade (sem dead ends)

// Gera o mapa procedural
function generateMap(floor) {
  const columns = 8;
  const rows = 3;
  const nodes = [];

  // 1. Cria nós por coluna
  for (let col = 0; col < columns; col++) {
    let rowCount = 1;
    if (col !== 0 && col !== columns - 1) {
      const r = Math.random();
      if (r < 0.5) rowCount = 2;
      else if (r < 0.7) rowCount = 3;
      else rowCount = 1;
    }
    const availableRows = [0, 1, 2];
    const selectedRows = [];
    for (let i = 0; i < rowCount; i++) {
      const idx = Math.floor(Math.random() * availableRows.length);
      const row = availableRows[idx];
      selectedRows.push(row);
      availableRows.splice(idx, 1);
    }
    selectedRows.sort((a, b) => a - b);
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

  nodes.sort((a, b) => a.col - b.col || a.row - b.row);
  const nodesByCol = {};
  nodes.forEach(n => {
    if (!nodesByCol[n.col]) nodesByCol[n.col] = [];
    nodesByCol[n.col].push(n);
  });

  // 2. Constrói conexões garantindo que TODO NÓ (exceto última coluna) tenha SAÍDA
  const connections = [];

  // Primeiro, garante que cada nó tenha pelo menos uma conexão para a próxima coluna
  for (let col = 0; col < columns - 1; col++) {
    const currentColNodes = nodesByCol[col];
    const nextColNodes = nodesByCol[col + 1];
    for (const node of currentColNodes) {
      // Verifica se já tem alguma conexão de saída para a próxima coluna
      const hasOutgoing = connections.some(conn => conn.from === node && conn.to.col === col + 1);
      if (!hasOutgoing) {
        // Escolhe um nó da próxima coluna com diferença de linha <= 1
        let candidates = nextColNodes.filter(next => Math.abs(next.row - node.row) <= 1);
        if (candidates.length === 0) candidates = nextColNodes; // fallback
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        connections.push({ from: node, to: target });
      }
    }
  }

  // 3. Garante que cada nó (exceto primeira coluna) tenha pelo menos uma CONEXÃO DE ENTRADA
  for (let col = 1; col < columns; col++) {
    for (const node of nodesByCol[col]) {
      const hasIncoming = connections.some(conn => conn.to === node);
      if (!hasIncoming) {
        const prevColNodes = nodesByCol[col - 1];
        let candidates = prevColNodes.filter(prev => Math.abs(prev.row - node.row) <= 1);
        if (candidates.length === 0) candidates = prevColNodes;
        const fromNode = candidates[Math.floor(Math.random() * candidates.length)];
        connections.push({ from: fromNode, to: node });
      }
    }
  }

  // 4. Adiciona ramificações extras (opcionais) para aumentar variedade
  for (let col = 0; col < columns - 1; col++) {
    const currentColNodes = nodesByCol[col];
    const nextColNodes = nodesByCol[col + 1];
    for (const node of currentColNodes) {
      for (const next of nextColNodes) {
        if (connections.some(conn => conn.from === node && conn.to === next)) continue;
        if (Math.abs(next.row - node.row) <= 1 && Math.random() < 0.3) {
          connections.push({ from: node, to: next });
        }
      }
    }
  }

  // 5. Verifica acessibilidade total via BFS a partir do nó inicial
  const startNode = nodes.find(n => n.col === 0);
  if (!startNode) return { floor, nodes: [], connections: [] };

  const reachable = new Set();
  const queue = [startNode];
  while (queue.length) {
    const current = queue.shift();
    if (reachable.has(current)) continue;
    reachable.add(current);
    const outgoing = connections.filter(conn => conn.from === current);
    for (const conn of outgoing) {
      if (!reachable.has(conn.to)) queue.push(conn.to);
    }
  }

  // Se algum nó não for alcançável, adiciona conexões da coluna anterior para ele
  for (let col = 1; col < columns; col++) {
    for (const node of nodesByCol[col]) {
      if (!reachable.has(node)) {
        console.warn(`Nó ${node.id} não alcançável - conectando`);
        const prevColNodes = nodesByCol[col - 1].filter(prev => reachable.has(prev));
        if (prevColNodes.length) {
          const fromNode = prevColNodes[Math.floor(Math.random() * prevColNodes.length)];
          connections.push({ from: fromNode, to: node });
          reachable.add(node);
        }
      }
    }
  }

  // Marca nó inicial como disponível e atual
  startNode.available = true;
  startNode.current = true;

  return { floor, nodes, connections };
}

// Define o tipo do nó com base na coluna
function getNodeType(col, totalCols) {
  if (col === 0) return 'combat';
  if (col === totalCols - 1) return 'boss';
  const roll = Math.random() * 100;
  if (col === totalCols - 2) {
    if (roll < 40) return 'elite';
    if (roll < 70) return 'combat';
    return 'event';
  }
  if (roll < 45) return 'combat';
  if (roll < 60) return 'elite';
  if (roll < 70) return 'shop';
  if (roll < 80) return 'campfire';
  return 'event';
}

// Move o jogador para um nó pelo ID
function moveToNode(targetNodeId) {
  const map = GameState.mapData;
  if (!map) return false;

  const targetNode = map.nodes.find(n => n.id === targetNodeId);
  if (!targetNode || !targetNode.available) return false;

  const currentNode = map.nodes.find(n => n.current === true);
  if (currentNode) {
    currentNode.current = false;
    currentNode.visited = true;
  }

  targetNode.current = true;
  targetNode.visited = true;
  GameState.currentNodeId = targetNode.id;

  if (!GameState.visitedNodes.includes(targetNode.id)) {
    GameState.visitedNodes.push(targetNode.id);
  }

  // Libera os nós alcançáveis a partir deste nó (reseta available)
  map.nodes.forEach(n => {
    if (!n.visited) n.available = false;
  });

  const reachable = getReachableNodes(map, targetNode);
  reachable.forEach(n => {
    if (!n.visited) n.available = true;
  });

  return true;
}

// Retorna todos os nós alcançáveis a partir de fromNode
function getReachableNodes(map, fromNode) {
  const reachable = [];
  const queue = [fromNode];
  const visitedIds = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visitedIds.has(current.id)) continue;
    visitedIds.add(current.id);
    if (current !== fromNode) reachable.push(current);

    const outgoing = map.connections.filter(conn => conn.from.id === current.id);
    for (const conn of outgoing) {
      if (!visitedIds.has(conn.to.id)) {
        queue.push(conn.to);
      }
    }
  }
  return reachable;
}
function generateMap(floor) {
  const nodeCount = 6 + Math.floor(Math.random() * 3);
  const nodes = [];
  const nodeTypes = [
    { type: 'combat', weight: 45 },
    { type: 'elite', weight: 15 },
    { type: 'shop', weight: 10 },
    { type: 'campfire', weight: 10 },
    { type: 'event', weight: 20 }
  ];
  
  for (let i = 0; i < nodeCount; i++) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let nodeType = 'combat';
    for (const nt of nodeTypes) {
      cumulative += nt.weight;
      if (roll < cumulative) {
        nodeType = nt.type;
        break;
      }
    }
    nodes.push({
      id: `node_${i}`,
      type: nodeType,
      x: 0,
      y: 0,
      visited: false,
      available: false,
      current: false
    });
  }
  
  nodes.push({
    id: 'boss',
    type: 'boss',
    x: 0,
    y: 0,
    visited: false,
    available: false,
    current: false
  });
  
  const containerWidth = 800;
  const containerHeight = 500;
  const stepX = containerWidth / (nodes.length - 1);
  
  nodes.forEach((node, i) => {
    node.x = 80 + i * stepX + (Math.random() - 0.5) * 60;
    node.y = 250 + Math.sin(i * 0.8) * 150 + (Math.random() - 0.5) * 80;
  });
  
  nodes[0].available = true;
  nodes[0].current = true;
  
  return {
    floor,
    nodes,
    connections: []
  };
}

function moveToNode(nodeIndex) {
  const map = GameState.mapData;
  if (!map || nodeIndex < 0 || nodeIndex >= map.nodes.length) return false;
  const node = map.nodes[nodeIndex];
  if (!node.available) return false;
  
  map.nodes.forEach(n => {
    if (n.current) {
      n.current = false;
      n.visited = true;
    }
  });
  node.current = true;
  node.visited = true;
  GameState.currentNodeIndex = nodeIndex;
  GameState.visitedNodes.push(nodeIndex);
  
  if (nodeIndex + 1 < map.nodes.length) {
    map.nodes[nodeIndex + 1].available = true;
  }
  if (nodeIndex + 2 < map.nodes.length && node.type === 'event') {
    map.nodes[nodeIndex + 2].available = true;
  }
  
  return true;
}
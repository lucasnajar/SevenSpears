let ENEMIES_DB = [];

async function loadEnemiesData() {
  try {
    const response = await fetch('data/enemies.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    ENEMIES_DB = JSON.parse(text);
    console.log('Enemies loaded:', ENEMIES_DB.length);
  } catch (e) {
    console.error('Failed to load enemies data:', e);
  }
}

function createEnemyInstance(enemyId) {
  const template = ENEMIES_DB.find(e => e.id === enemyId);
  if (!template) return null;
  const enemy = JSON.parse(JSON.stringify(template));
  enemy.currentHp = enemy.hp;
  enemy.maxHp = enemy.hp;
  enemy.block = 0;
  enemy.intentIndex = 0;
  enemy.statusEffects = [];
  return enemy;
}

function getRandomEnemy(type = 'normal') {
  const pool = ENEMIES_DB.filter(e => e.type === type);
  if (pool.length === 0) return null;
  return createEnemyInstance(pool[Math.floor(Math.random() * pool.length)].id);
}
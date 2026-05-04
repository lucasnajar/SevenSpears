const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8080';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════');
  console.log('  CURSED CASTLE - TEST SUITE');
  console.log('═══════════════════════════════════════\n');

  // Test 1: Server responding
  console.log('[1] Server Connection');
  try {
    const res = await fetchText(BASE);
    assert(res.status === 200, 'Server responds with 200');
    assert(res.data.includes('CURSED CASTLE'), 'HTML contains game title');
    assert(res.data.includes('new-game-btn'), 'New Game button exists');
  } catch (e) {
    assert(false, `Server error: ${e.message}`);
  }

  // Test 2: CSS loads
  console.log('\n[2] Stylesheet');
  try {
    const res = await fetchText(BASE + '/style.css');
    assert(res.status === 200, 'CSS file loads (200)');
    assert(res.data.includes('MedievalSharp'), 'MedievalSharp font imported');
    assert(res.data.includes('.card'), 'Card styles defined');
    assert(res.data.includes('.map-node'), 'Map node styles defined');
  } catch (e) {
    assert(false, `CSS error: ${e.message}`);
  }

  // Test 3: All JS files load
  console.log('\n[3] JavaScript Files');
  const jsFiles = ['gameState', 'cards', 'enemies', 'relics', 'events', 'audio', 'deck', 'map', 'battle', 'ui', 'main'];
  for (const file of jsFiles) {
    try {
      const res = await fetchText(BASE + `/js/${file}.js`);
      assert(res.status === 200, `${file}.js loads (200)`);
      assert(res.data.length > 100, `${file}.js has content (${res.data.length} bytes)`);
    } catch (e) {
      assert(false, `${file}.js failed: ${e.message}`);
    }
  }

  // Test 4: JSON data files
  console.log('\n[4] Data Files (JSON)');
  
  // Cards
  try {
    const res = await fetchJSON(BASE + '/data/cards.json');
    assert(res.status === 200, 'cards.json loads (200)');
    assert(Array.isArray(res.data), 'cards.json is an array');
    assert(res.data.length === 15, `15 cards defined (found ${res.data.length})`);
    
    const attacks = res.data.filter(c => c.type === 'attack').length;
    const defenses = res.data.filter(c => c.type === 'defense').length;
    const skills = res.data.filter(c => c.type === 'skill').length;
    const powers = res.data.filter(c => c.type === 'power').length;
    assert(attacks === 6, `6 attack cards (found ${attacks})`);
    assert(defenses === 4, `4 defense cards (found ${defenses})`);
    assert(skills === 3, `3 skill cards (found ${skills})`);
    assert(powers === 2, `2 power cards (found ${powers})`);
    
    const commons = res.data.filter(c => c.rarity === 'common').length;
    const uncommons = res.data.filter(c => c.rarity === 'uncommon').length;
    const rares = res.data.filter(c => c.rarity === 'rare').length;
    assert(commons >= 6, `At least 6 common cards (found ${commons})`);
    assert(uncommons >= 4, `At least 4 uncommon cards (found ${uncommons})`);
    assert(rares >= 4, `At least 4 rare cards (found ${rares})`);
  } catch (e) {
    assert(false, `cards.json error: ${e.message}`);
  }

  // Enemies
  try {
    const res = await fetchJSON(BASE + '/data/enemies.json');
    assert(res.status === 200, 'enemies.json loads (200)');
    assert(res.data.length === 5, `5 enemies defined (found ${res.data.length})`);
    
    const normals = res.data.filter(e => e.type === 'normal').length;
    const elites = res.data.filter(e => e.type === 'elite').length;
    const bosses = res.data.filter(e => e.type === 'boss').length;
    assert(normals === 2, `2 normal enemies (found ${normals})`);
    assert(elites === 2, `2 elite enemies (found ${elites})`);
    assert(bosses === 1, `1 boss (found ${bosses})`);
    
    res.data.forEach(e => {
      assert(e.intent && e.intent.length > 0, `${e.name} has intent pattern`);
      assert(e.reward && e.reward.gold, `${e.name} has gold reward`);
    });
  } catch (e) {
    assert(false, `enemies.json error: ${e.message}`);
  }

  // Relics
  try {
    const res = await fetchJSON(BASE + '/data/relics.json');
    assert(res.status === 200, 'relics.json loads (200)');
    assert(res.data.length === 10, `10 relics defined (found ${res.data.length})`);
    
    const commons = res.data.filter(r => r.rarity === 'common').length;
    const uncommons = res.data.filter(r => r.rarity === 'uncommon').length;
    const rares = res.data.filter(r => r.rarity === 'rare').length;
    assert(commons === 3, `3 common relics (found ${commons})`);
    assert(uncommons === 4, `4 uncommon relics (found ${uncommons})`);
    assert(rares === 3, `3 rare relics (found ${rares})`);
    
    res.data.forEach(r => {
      assert(r.effect, `${r.name} has effect`);
      assert(r.bonuses, `${r.name} has bonuses`);
    });
  } catch (e) {
    assert(false, `relics.json error: ${e.message}`);
  }

  // Events
  try {
    const res = await fetchJSON(BASE + '/data/events.json');
    assert(res.status === 200, 'events.json loads (200)');
    assert(res.data.length === 8, `8 events defined (found ${res.data.length})`);
    
    res.data.forEach(e => {
      assert(e.title, `${e.id} has title`);
      assert(e.text, `${e.id} has text`);
      assert(e.choices && e.choices.length >= 2, `${e.id} has at least 2 choices`);
      e.choices.forEach((c, i) => {
        assert(c.text, `${e.id} choice ${i+1} has text`);
        assert(c.resultText, `${e.id} choice ${i+1} has resultText`);
      });
    });
  } catch (e) {
    assert(false, `events.json error: ${e.message}`);
  }

  // Test 5: HTML structure completeness
  console.log('\n[5] HTML Structure');
  try {
    const res = await fetchText(BASE + '/index.html');
    const requiredScreens = [
      'menu-screen', 'map-screen', 'battle-screen', 
      'event-screen', 'shop-screen', 'campfire-screen',
      'victory-screen', 'game-over-screen', 'card-reward-screen'
    ];
    requiredScreens.forEach(id => {
      assert(res.data.includes(id), `Screen "${id}" exists in HTML`);
    });
    
    const requiredScripts = [
      'gameState.js', 'cards.js', 'enemies.js', 'relics.js',
      'events.js', 'audio.js', 'deck.js', 'map.js', 'battle.js',
      'ui.js', 'main.js'
    ];
    requiredScripts.forEach(src => {
      assert(res.data.includes(src), `Script "${src}" included`);
    });
  } catch (e) {
    assert(false, `HTML structure error: ${e.message}`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════');
  
  if (failed === 0) {
    console.log('\n🎮 ALL TESTS PASSED - Game is ready!');
    console.log('   Open: http://localhost:8080\n');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review above.\n`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error(`\n❌ Fatal error: ${e.message}`);
  process.exit(1);
});

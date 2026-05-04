# 🏰 Cursed Castle - Roguelike Deckbuilder

A dark fantasy roguelike deckbuilder where a cursed knight battles through a corrupted castle to break an ancient curse.

## 🎮 How to Play

### Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Local server (for loading JSON data files)

### Running Locally

**Option 1: VS Code Live Server (Recommended)**
1. Install [VS Code](https://code.visualstudio.com/)
2. Install the "Live Server" extension
3. Open the project folder in VS Code
4. Right-click `index.html` → "Open with Live Server"

**Option 2: Python**
```bash
# Navigate to the project folder
cd "meu-jogo"

# Start server (Python 3)
python -m http.server

# Open browser to http://localhost:8000
```

**Option 3: Node.js**
```bash
npx serve
```

### Controls
- **Click cards** to play them (1-9 keys also work)
- **Click "End Turn"** or press **E** to end your turn
- **Click map nodes** to navigate
- **Click shop items** to buy them

## 🎯 Game Features

- **15 unique cards** across 4 types (Attack, Defense, Skill, Power)
- **5 enemies** with distinct attack patterns
- **10 relics** with powerful effects
- **8 narrative events** with meaningful choices
- **3 floors** with procedurally generated maps
- **Shop, Campfire, and Event nodes** for strategic decisions
- **Save/Load** system using localStorage
- **Sound effects** via Web Audio API
- **Animated UI** with damage numbers and hover effects

## 📁 Project Structure

```
meu-jogo/
├── index.html          # Entry point
├── style.css           # Dark fantasy theme styling
├── GDD.txt             # Game Design Document
├── CONTEXTO_AGENTE.txt # AI Agent context file
├── README.md           # This file
├── js/
│   ├── main.js         # Game initialization
│   ├── gameState.js    # Global state management
│   ├── cards.js        # Card system
│   ├── enemies.js      # Enemy system
│   ├── battle.js       # Battle logic
│   ├── map.js          # Map generation
│   ├── deck.js         # Deck management
│   ├── ui.js           # UI rendering
│   ├── relics.js       # Relic system
│   ├── events.js       # Event system
│   └── audio.js        # Sound effects
└── data/
    ├── cards.json      # 15 card definitions
    ├── enemies.json    # 5 enemy definitions
    ├── events.json     # 8 event definitions
    └── relics.json     # 10 relic definitions
```

## 🛠️ Built With

- HTML5
- CSS3 (with animations and custom properties)
- JavaScript ES6+ (no frameworks)
- Web Audio API
- Google Fonts (MedievalSharp)

## 🚀 Deployment

### GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
# Enable GitHub Pages in repository settings
```

### Netlify
Drag and drop the project folder to [netlify.com](https://netlify.com)

### itch.io
1. Create a ZIP of the project folder
2. Upload to [itch.io](https://itch.io) as HTML5 game
3. Set viewport to 1280x720

## 📝 License

This project is open source and available for educational purposes.

---

*"The curse claims another soul..."*

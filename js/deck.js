function initStartingDeck() {
  const deck = [];
  for (let i = 0; i < 5; i++) deck.push(createCardInstance('strike'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('defend'));
  deck.push(createCardInstance('heavy_strike'));
  deck.push(createCardInstance('iron_wall'));
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

class DeckManager {
  constructor(cards) {
    this.drawPile = shuffleDeck([...cards]);
    this.hand = [];
    this.discardPile = [];
  }
  
  drawCards(count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.drawPile = shuffleDeck([...this.discardPile]);
        this.discardPile = [];
      }
      if (this.drawPile.length > 0) {
        const card = this.drawPile.pop();
        this.hand.push(card);
        drawn.push(card);
      }
    }
    return drawn;
  }
  
  discardHand() {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }
  
  removeCardFromHand(index) {
    if (index >= 0 && index < this.hand.length) {
      const card = this.hand.splice(index, 1)[0];
      this.discardPile.push(card);
      return card;
    }
    return null;
  }
  
  exhaustRandomCard() {
    const allCards = [...this.drawPile, ...this.hand, ...this.discardPile];
    if (allCards.length === 0) return;
    if (this.hand.length > 0) {
      this.hand.splice(0, 1);
    }
  }
}
const AudioSystem = {
  ctx: null,
  initialized: false,
  
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  },
  
  playTone(freq = 440, duration = 0.15, type = 'sine', volume = 0.1) {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  
  cardPlay() {
    this.playTone(600, 0.1, 'square', 0.08);
  },
  enemyHit() {
    this.playTone(200, 0.2, 'sawtooth', 0.1);
  },
  playerHit() {
    this.playTone(150, 0.3, 'triangle', 0.12);
  },
  shieldBlock() {
    this.playTone(800, 0.08, 'sine', 0.06);
  },
  victory() {
    this.playTone(523, 0.15, 'sine', 0.1);
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.1), 150);
    setTimeout(() => this.playTone(784, 0.25, 'sine', 0.1), 300);
  },
  defeat() {
    this.playTone(300, 0.3, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(200, 0.5, 'sawtooth', 0.1), 300);
  }
};
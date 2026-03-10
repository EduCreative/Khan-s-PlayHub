
class AudioService {
  private context: AudioContext | null = null;
  private volume: number = 0.5;

  private initContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  setVolume(volume: number) {
    this.volume = volume;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volumeMult: number = 1) {
    this.initContext();
    if (!this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);

    gain.gain.setValueAtTime(this.volume * volumeMult * 0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 'sine', 0.1, 0.5);
  }

  playNav() {
    this.playTone(400, 'sine', 0.15, 0.3);
  }

  playToggle(on: boolean) {
    this.initContext();
    if (!this.context) return;

    const duration = 0.2;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    const startFreq = on ? 400 : 600;
    const endFreq = on ? 800 : 300;

    osc.frequency.setValueAtTime(startFreq, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.context.currentTime + duration);

    gain.gain.setValueAtTime(this.volume * 0.05, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  playSuccess() {
    this.initContext();
    if (!this.context) return;

    const tones = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    tones.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.3, 0.4);
      }, i * 100);
    });
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.3, 0.2);
  }

  vibrate(pattern: number | number[] = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

export const audioService = new AudioService();

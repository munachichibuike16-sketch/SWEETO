/**
 * Dynamic Web Audio API Sound Synthesizer & Tactile Haptics Engine
 * Provides latency-free, synthetic sound effects without requiring network assets.
 */

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended by browser autoplay policy
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playSound = (type = 'chime') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Standard haptic vibration on supporting mobile devices
    if (type !== 'click' && 'vibrate' in navigator) {
      if (type === 'chime') {
        navigator.vibrate([100, 50, 100]); // Sweet double pulse
      } else if (type === 'celebrate') {
        navigator.vibrate([150, 80, 150, 80, 200]); // Festive sequence
      } else if (type === 'bubble' || type === 'cart_add') {
        navigator.vibrate(60); // Crisp single tap
      }
    }

    const now = ctx.currentTime;

    if (type === 'chime') {
      // 🔔 Premium Dual-Tone Chime (e.g. Notification / Price Drop)
      // First Tone: Pure chime note (A-flat 5 to C 6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(830.61, now); 
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.18);
      
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Second Tone: Harmonious delayed high note (E 6 to G 6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); 
      osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.26);
      
      gain2.gain.setValueAtTime(0.06, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.start(now + 0.08);
      osc2.stop(now + 0.58);

    } else if (type === 'bubble' || type === 'cart_add') {
      // 🫧 Crisp Pop/Bubble Sound (e.g. Add to Cart)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Fast upward sweep to simulate a pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.12);

    } else if (type === 'celebrate') {
      // 🎉 Grand Celebratory Harp Arpeggio Cascade (e.g. Checkout Success)
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
      notes.forEach((freq, idx) => {
        const timeDelay = idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle'; // Warmer, fuller tone
        osc.frequency.setValueAtTime(freq, now + timeDelay);
        osc.frequency.linearRampToValueAtTime(freq * 1.05, now + timeDelay + 0.25);
        
        gain.gain.setValueAtTime(0.08, now + timeDelay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeDelay + 0.45);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + timeDelay);
        osc.stop(now + timeDelay + 0.45);
      });

    } else if (type === 'click') {
      // 🔘 Crisp Subtle Tactile UI Click (e.g. Menu Tabs / Navigation)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.03);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.03);
    }
  } catch (err) {
    console.warn('Audio synthesis failed:', err);
  }
};

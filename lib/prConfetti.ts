import confetti from 'canvas-confetti';

export function firePRConfetti() {
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 0.8 },
  });
  confetti({
    particleCount: 80,
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 0.8 },
  });
}
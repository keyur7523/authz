import type { Transition } from "framer-motion";

// Apple-style springs: bounce 0 ≈ damping 1.0 (no overshoot); duration ≈ "response".
export const spring: Transition = { type: "spring", bounce: 0, duration: 0.35 };

// Only after a gesture carried momentum (flick/drag release) do we allow a little bounce.
export const momentumSpring: Transition = { type: "spring", bounce: 0.2, duration: 0.3 };

// Dimming scrim behind modal tasks.
export const scrimMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
} as const;

// Modal panels enter and exit along the same path (symmetric scale + fade).
export const panelMotion = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: spring,
} as const;

// Apple's momentum projection: where a flick would come to rest (decelerationRate ≈ 0.998).
export function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

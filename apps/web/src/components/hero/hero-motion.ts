/**
 * Live animation state shared by GSAP and the render loop. GSAP tweens these
 * plain values (for example `gsap.to(motion, { speed: 0.25 })`) and the
 * scene's useFrame reads them every frame. Nothing here goes through React
 * state, so animating never causes a re-render.
 */
/** One card's tweenable values. */
export interface CardMotion {
  /** The focus pop, 0 at rest and 1 at its peak. */
  pop: number;
  /** Where the sheen band is across the face: below 0 or above 1 is off. */
  sheen: number;
  /** How far the card has turned over: 0 shows the back, 1 the front. */
  flip: number;
  /** 1 while the pointer is over this card; calms its noise motion. */
  hover: number;
  /** How far the card has fallen into the stack after a claim (0–1). */
  settle: number;
  /** The teaser's quick peek turn: 0 at rest, 1 at its widest. */
  tease: number;
}

export interface HeroMotion {
  /** How far the stream has travelled, in path fractions. Ever increasing. */
  travel: number;
  /** Multiplier on the base pace. 1 is normal, 0 is stopped. */
  speed: number;
  /** The breathing cycle, swung between -1 and 1 by a GSAP yoyo tween. */
  breath: number;
  /** Multiplier on per-card noise motion. Eased down during a claim. */
  noise: number;
  /** Per-card values, grown to fit the card count. */
  cards: CardMotion[];
  /**
   * The claim: which card is being claimed (-1 for none) and how far it has
   * left the path for the reveal position (0 on the path, 1 there).
   */
  claim: { index: number; blend: number };
  /** The whole scene's opacity; a returning visitor's deck fades in. */
  fade: number;
  /** The particles' opacity; they fade out when a claim starts. */
  ambient: number;
}

export function cardMotion(motion: HeroMotion, index: number): CardMotion {
  motion.cards[index] ??= {
    pop: 0,
    sheen: -1,
    flip: 0,
    hover: 0,
    settle: 0,
    tease: 0,
  };

  return motion.cards[index];
}

export function createHeroMotion(): HeroMotion {
  return {
    travel: 0,
    speed: 1,
    breath: 0,
    noise: 1,
    cards: [],
    claim: { index: -1, blend: 0 },
    fade: 1,
    ambient: 1,
  };
}

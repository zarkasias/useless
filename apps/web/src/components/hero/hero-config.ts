export type Vec3 = [number, number, number];

/** The most sparkles the particle layer can draw. */
export const MAX_SPARKLES = 80;

/**
 * Every timing, position and motion value for the hero scene. The scene reads
 * a mutable copy each frame, so the leva panel on /hero-lab can tune it live.
 */
export const HERO_CONFIG = {
  /** Bumped whenever something structural changes, such as the curve. */
  version: 0,

  camera: { fov: 35, z: 7 },
  maxPixelRatio: 2,

  card: { width: 1.3, height: 1.625, radius: 0.08 },

  /**
   * Control points from entry (top-left of the stage, far away) through the
   * approach arc and the focus point (about 70% along, the closest point to
   * the camera), then an exit that falls away down and to the right, so the
   * focus card is always the biggest. On desktop the stage is the right-hand column only, so the
   * stream never crosses the headline. Phones get their own stage below the
   * Claim button.
   */
  curve: {
    desktop: [
      [-3.2, 2.6, -6],
      [-1.8, 1.6, -3.8],
      [-0.5, 0.5, -1.6],
      [0.8, -0.45, 0.5],
      [2.0, -1.0, -0.3],
      [3.1, -1.4, -1.6],
    ] as Vec3[],
    mobile: [
      [-3.3, 3.1, -4.5],
      [-1.9, 1.75, -2.8],
      [-0.6, 0.6, -1.0],
      [0.35, -0.4, 0.4],
      [1.3, -0.85, -0.3],
      [2.3, -1.2, -1.4],
    ] as Vec3[],
  },

  /** Where the focus point sits, as a fraction of the path (0–1). */
  focusAt: 0.7,

  stream: {
    cardCount: 7,
    /**
     * Gap between neighbouring cards, as a fraction of the path. Phones have
     * a shorter path, so they need a wider gap to keep cards apart; cards
     * that don't fit wait off the path.
     */
    spacing: { desktop: 1 / 7, mobile: 0.15 },
    /** Base pace when `rhythm` is off: one card through focus this often. */
    secondsPerCard: 1.75,
  },

  /**
   * The stream moves in beats rather than a constant flow: every card
   * advances one slot in a quick eased move, then the stream rests with a
   * card held at the focus point. `drift` keeps a little movement during the
   * rest, as a fraction of normal pace, so it never looks frozen.
   */
  rhythm: {
    enabled: true,
    advance: 0.7,
    dwell: 1.3,
    dwellJitter: 0.35,
    drift: 0.06,
  },

  /** Faked depth of field: values at the entry, at focus and at the exit. */
  entry: { scale: 0.5, opacity: 0.3, brightness: 0.6 },
  focus: { scale: 1, opacity: 1, brightness: 1 },
  exit: {
    scale: 0.85,
    opacity: 0,
    /** The exit fade covers this last fraction of the path. */
    length: 0.22,
  },

  /** How far cards turn with the path's direction while facing the camera. */
  pathTurn: 0.18,

  /**
   * Layer 1: cards move faster on entry, slow down and linger around the
   * focus point, then speed up again on the exit. `strength` is how much
   * slower they go at focus (0 = even pace); `width` is how wide the slow
   * stretch is, as a fraction of the path.
   */
  speedRemap: { strength: 0.4, width: 0.11 },

  /** Layer 1: the whole stream's pace drifts ±amount over `period` seconds. */
  breathing: { amount: 0.15, period: 6 },

  /**
   * Layer 2: per-card simplex noise. Bob is in scene units; sway (z) and
   * tilt (x/y) are in degrees. `frequency` is how fast the noise changes.
   */
  noise: { frequency: 0.22, bob: 0.025, sway: 1.5, tilt: 2.5 },

  /** Layer 2: cards roll up to this many degrees into the curve's bends. */
  banking: { maxDegrees: 4 },

  /**
   * Layer 3: as a card reaches the focus point it pops (scale up by `scale`,
   * then back) and briefly brightens. `duration` is the whole pop, in seconds.
   */
  focusPop: { scale: 0.06, brightness: 0.12, duration: 0.9 },

  /**
   * Layer 3: a soft glossy band sweeps across the card face as it passes
   * focus, like light catching a foil card. `width` is the band's softness,
   * as a fraction of the card.
   */
  sheen: { intensity: 0.9, width: 0.12, duration: 0.95 },

  /**
   * Layer 4 (desktop only): the camera drifts toward the pointer by up to
   * `amount` units, eased by `smoothing` each frame. The card nearest the
   * pointer (within `reach`, in screen fractions) tilts up to `tiltDegrees`
   * toward it.
   */
  pointer: { amount: 0.15, smoothing: 0.05, tiltDegrees: 5, reach: 0.3 },

  /**
   * Focus peek: every `every`th rest, the card at the focus point turns over
   * to show a sample achievement, holds for `hold` seconds so it can be read,
   * then turns back before the stream moves on. Samples never decide or
   * hint at what a claim gives. While face up the card comes forward by
   * `lift` and grows by `scale`, so the description is readable; `arc` is
   * the extra lift mid-turn, so it feels turned by hand rather than spun.
   */
  peek: { every: 3, flip: 0.6, hold: 1.6, lift: 0.35, scale: 0.3, arc: 0.2 },

  /**
   * Hover preview (desktop only): the card under the pointer turns over to a
   * sample in `flip` seconds while the whole stream eases to `speed` of its
   * pace over `ease` seconds. The hovered card keeps `noise` of its wobble so
   * it's easy to read. Only cards above `minOpacity` respond.
   */
  hover: { speed: 0.25, ease: 0.4, flip: 0.5, noise: 0.3, minOpacity: 0.6 },

  /**
   * The claim. The stream eases to a stop over `slowdown` seconds while the
   * focus card lifts `lift` units toward the camera over `liftTime`, leaving
   * the path for the reveal position: the focus point nudged by `reveal`
   * (x, y). Phones lift it higher, so the deck sits close under the text
   * instead of low in the stage, and Share stays on screen. When the result arrives it turns over in `flip` seconds. While
   * waiting it floats by `waitFloat`. A failed claim puts everything back
   * over `resume` seconds.
   */
  claim: {
    slowdown: 0.8,
    lift: 0.5,
    liftTime: 0.9,
    reveal: {
      // About 15px lower than first tuned, on a 680px-tall desktop stage.
      desktop: [-0.15, 0.117] as [number, number],
      mobile: [-0.1, 0.85] as [number, number],
    },
    flip: 1,
    waitFloat: 0.04,
    /** Space between the bottom of the deck and the Share button, in px. */
    shareGap: 28,
    resume: 0.8,
  },

  /**
   * After the reveal, the other cards fall into a neat, squared-up deck
   * directly under the revealed card: the same size and in the same plane,
   * each one `step` (x, y) further down and to the right than the card above
   * it, so only a few thin edges show as a cue that there are more cards.
   * `stagger` seconds apart, each taking `duration`. `jitter` (units) and
   * `rotation` (°) add randomness, and are off for a tidy deck. The revealed
   * card then floats by ±`float`°.
   */
  settle: {
    step: [0.012, -0.014] as [number, number],
    jitter: 0,
    rotation: 0,
    stagger: 0.065,
    duration: 0.9,
    float: 2,
    floatSpeed: 0.55,
  },

  /** A returning visitor's deck fades in over this many seconds. */
  returning: { fadeIn: 0.6 },

  /**
   * Layer 5 (optional): every `min`–`max` seconds one random, clearly visible
   * card turns `degrees` on Y and back over `duration` seconds, hinting that
   * there's something on the other side.
   */
  teaser: { min: 6, max: 10, degrees: 25, duration: 0.8 },

  /**
   * Layer 6 (optional): `count` small sparkles in the rarity colours drift
   * along the path, up to `spread` units either side of it, `size` pixels
   * across at the focus point. Each makes one trip in about `seconds`.
   */
  particles: { count: 24, spread: 1.3, size: 16, seconds: 26, opacity: 0.85 },

  /** How many sample faces to draw when the scene loads. */
  samplePoolSize: 8,

  /** On/off switches for each motion layer. Later phases fill these in. */
  layers: {
    // The rhythm replaces these two; they stay available for comparison.
    speedRemap: false,
    breathing: false,
    noise: true,
    banking: true,
    focusPop: true,
    sheen: true,
    parallax: true,
    pointerTilt: true,
    peek: true,
    hover: true,
    teaser: false,
    particles: false,
  },
};

export type HeroConfig = typeof HERO_CONFIG;

/** A fresh, independent copy for one scene to mutate. */
export function createHeroConfig(): HeroConfig {
  return structuredClone(HERO_CONFIG);
}

"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { createNoise2D } from "simplex-noise";
import {
  CatmullRomCurve3,
  Euler,
  Group,
  Quaternion,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
  type ShaderMaterial,
  type Texture,
} from "three";

import type { ShareImageInput } from "@/lib/share-image";
import { drawCardBack, drawCardFront } from "./card-textures";
import { createSheenMaterial } from "./sheen-material";
import { Sparkles } from "./hero-sparkles";
import type { HeroConfig } from "./hero-config";
import { cardMotion, type HeroMotion } from "./hero-motion";
import {
  cardProgress,
  createBankTable,
  createSpeedRemap,
  depthAt,
  type Layout,
} from "./hero-path";

gsap.registerPlugin(useGSAP);

// Touch devices have no hover, so they skip all pointer response.
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

// Stages narrower than this use the phone curve.
const DESKTOP_MIN_WIDTH = 700;

// Where the page itself switches to two columns (Tailwind's md breakpoint).
const PAGE_DESKTOP_MIN_WIDTH = 768;

function cardGeometry(config: HeroConfig) {
  const { width, height, radius } = config.card;
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geometry = new ShapeGeometry(shape, 6);
  const position = geometry.attributes.position!;
  const uv = geometry.attributes.uv!;

  // ShapeGeometry uses raw coordinates as UVs; textures need 0–1.
  for (let i = 0; i < position.count; i++) {
    uv.setXY(
      i,
      position.getX(i) / width + 0.5,
      position.getY(i) / height + 0.5,
    );
  }

  return geometry;
}

/**
 * The claim, as the page sees it. `attempt` goes up with every tap so each
 * try starts fresh.
 */
export interface HeroClaim {
  status: "idle" | "claiming" | "revealed" | "failed";
  /** The claimed achievement, once the server has answered. */
  achievement: ShareImageInput | null;
  attempt: number;
  /**
   * True when the achievement was claimed on an earlier visit today. The
   * scene then opens straight into the collapsed deck, with no stream.
   */
  restored?: boolean;
}

type ClaimPhase = "idle" | "claiming" | "revealed";

/** The pointer over the stage, in normalised device coordinates. */
export interface PointerState {
  x: number;
  y: number;
  /** False when outside the stage, or on devices without a fine pointer. */
  active: boolean;
}

interface StreamProps {
  config: HeroConfig;
  motion: HeroMotion;
  cardCount: number;
  back: Texture;
  /** Sample achievement fronts for the focus peek; fills in as they draw. */
  faces: Texture[];
  pointer: PointerState;
  /** Hover previews only exist on devices with a real hover pointer. */
  canHover: boolean;
  claim: HeroClaim;
  /** Kept under the revealed card, for the Share button. */
  shareAnchor?: RefObject<HTMLElement | null>;
  /** Called once the stack has landed after a claim. */
  onSettled?: () => void;
}

interface StackSpot {
  /**
   * Where the card sits relative to the reveal position. Relative, so the
   * deck follows the revealed card when the layout changes (a resize, or
   * turning a tablet), instead of staying where it first landed.
   */
  offset: Vector3;
  rotation: number;
  order: number;
}

const DEGREES = Math.PI / 180;

// Fixed offsets into the noise field, so each card and each axis moves on
// its own and no two cards move in sync.
const NOISE_AXES = { bob: 0, sway: 11.3, tiltX: 23.9, tiltY: 41.7 };
const NOISE_CARD_OFFSET = 37.17;

interface PathCache {
  key: string;
  path: CatmullRomCurve3;
  bankAt: (t: number) => number;
}

interface RemapCache {
  key: string;
  remap: (u: number) => number;
}

// A card only counts as "at focus" for the pop if it moved less than this
// since the last frame, so wrapping from exit to entry never triggers one.
const MAX_FRAME_STEP = 0.2;

function Stream({
  config,
  motion,
  cardCount,
  back,
  faces,
  pointer,
  canHover,
  claim,
  shareAnchor,
  onSettled,
}: StreamProps) {
  const { camera, size, gl } = useThree();
  const hovered = useRef(-1);
  // The card the focus peek is turning over, which hover leaves alone.
  const peeking = useRef(-1);
  // Hover and peeks only run while nothing is being claimed.
  const claimPhase = useRef<ClaimPhase>("idle");
  const claimedFace = useRef<Texture | null>(null);
  // Lets a failed claim restart the beats.
  const restartRhythm = useRef<() => void>(() => {});
  const flips = useRef<(Group | null)[]>([]);
  const facesNow = useRef(faces);
  const layoutNow = useRef<Layout>("desktop");
  const lastFace = useRef<Texture | null>(null);

  facesNow.current = faces;
  const lastT = useRef<(number | null)[]>([]);
  const pointerTilt = useRef<{ x: number; y: number }[]>([]);
  const screen = useMemo(() => new Vector3(), []);
  const groups = useRef<(Group | null)[]>([]);
  const curve = useRef<PathCache | null>(null);
  const remap = useRef<RemapCache | null>(null);
  const breathing = useRef<gsap.core.Tween | null>(null);
  // The current beat (an advance or a rest), so a claim can slow it down.
  const beat = useRef<gsap.core.Animation | null>(null);
  const spacingNow = useRef(config.stream.spacing.desktop);
  const point = useMemo(() => new Vector3(), []);
  const tangent = useMemo(() => new Vector3(), []);
  const reveal = useMemo(() => new Vector3(), []);
  const stackTurn = useMemo(() => new Quaternion(), []);
  const stackEuler = useMemo(() => new Euler(), []);
  const anchorPoint = useMemo(() => new Vector3(), []);
  const deckBase = useMemo(() => new Vector3(), []);
  const stackTarget = useMemo(() => new Vector3(), []);
  const stack = useRef<(StackSpot | null)[]>([]);
  const settled = useRef(false);
  const onSettledNow = useRef(onSettled);

  onSettledNow.current = onSettled;

  // A returning visitor never sees the stream: the scene starts invisible
  // and still, and opens straight into the collapsed deck once the saved
  // card's face is drawn. Decided once, at mount.
  const restoring = useRef(claim.status === "revealed" && !!claim.restored);
  const restoreFace = useRef<Texture | null>(null);

  if (restoring.current && claimPhase.current === "idle") {
    claimPhase.current = "revealed";
    motion.fade = 0;
    motion.speed = 0;
    motion.ambient = 0;
  }
  const noise2D = useMemo(() => createNoise2D(), []);

  const geometry = useMemo(() => cardGeometry(config), [config]);
  // The front faces the other way, so it shows once the card turns over. A
  // half turn is a rotation, not a reflection, so the face isn't mirrored.
  const frontGeometry = useMemo(
    () => geometry.clone().rotateY(Math.PI),
    [geometry],
  );
  const fronts = useMemo(
    () =>
      Array.from(
        { length: cardCount },
        () =>
          new MeshBasicMaterial({
            map: back,
            transparent: true,
            depthWrite: false,
          }),
      ),
    [back, cardCount],
  );
  const materials = useMemo(
    () =>
      Array.from(
        { length: cardCount },
        () =>
          new MeshBasicMaterial({
            map: back,
            transparent: true,
            depthWrite: false,
          }),
      ),
    [back, cardCount],
  );

  const sheens = useMemo(
    () => Array.from({ length: cardCount }, () => createSheenMaterial()),
    [cardCount],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => frontGeometry.dispose(), [frontGeometry]);
  useEffect(
    () => () => fronts.forEach((material) => material.dispose()),
    [fronts],
  );
  useEffect(() => () => sheens.forEach((sheen) => sheen.dispose()), [sheens]);

  // Layer 3: the focus pop and sheen sweep, as GSAP tweens on the card's
  // plain motion values. The frame loop reads them back.
  const { contextSafe } = useGSAP({ dependencies: [motion] });
  const celebrateFocus = contextSafe((index: number) => {
    const values = cardMotion(motion, index);
    const { focusPop, layers } = config;

    if (layers.focusPop) {
      gsap.killTweensOf(values, "pop");
      gsap
        .timeline()
        .to(values, {
          pop: 1,
          duration: focusPop.duration * 0.35,
          ease: "back.out(2.2)",
        })
        .to(values, {
          pop: 0,
          duration: focusPop.duration * 0.65,
          ease: "power2.inOut",
        });
    }

    if (layers.sheen) sweepSheen(index);
  });
  const sweepSheen = contextSafe((index: number) => {
    const values = cardMotion(motion, index);

    gsap.killTweensOf(values, "sheen");
    gsap.fromTo(
      values,
      { sheen: -0.3 },
      {
        sheen: 1.3,
        duration: config.sheen.duration,
        ease: "power1.inOut",
      },
    );
  });
  useEffect(
    () => () => materials.forEach((material) => material.dispose()),
    [materials],
  );

  /** The card currently nearest the focus point. */
  const focusCard = () => {
    let best = -1;
    let distance = Infinity;

    for (let i = 0; i < config.stream.cardCount; i++) {
      const u = cardProgress(config, layoutNow.current, motion.travel, i);

      if (u === null) continue;

      const t = config.layers.speedRemap ? (remap.current?.remap(u) ?? u) : u;

      if (Math.abs(t - config.focusAt) < distance) {
        distance = Math.abs(t - config.focusAt);
        best = i;
      }
    }

    return best;
  };

  /** A sample face, never the same one twice in a row. */
  const nextFace = () => {
    const pool = facesNow.current.filter((face) => face !== lastFace.current);
    const face = pool[Math.floor(Math.random() * pool.length)] ?? null;

    lastFace.current = face;

    return face;
  };

  // Hover preview: turn the card under the pointer over to a sample and
  // ease the stream down so it can be read. One card at a time.
  const endHover = contextSafe(() => {
    const index = hovered.current;

    if (index < 0) return;

    const values = cardMotion(motion, index);

    hovered.current = -1;
    gl.domElement.style.cursor = "";
    gsap.to(values, {
      flip: 0,
      hover: 0,
      duration: config.hover.flip,
      ease: "power2.inOut",
      overwrite: "auto",
    });
    gsap.to(motion, {
      speed: 1,
      duration: config.hover.ease,
      ease: "power2.out",
      overwrite: "auto",
    });
  });

  const startHover = contextSafe((index: number) => {
    if (
      !canHover ||
      !config.layers.hover ||
      claimPhase.current !== "idle" ||
      index === hovered.current
    ) {
      return;
    }

    const material = materials[index];
    const front = fronts[index];

    if (
      !material ||
      !front ||
      index === peeking.current ||
      material.opacity < config.hover.minOpacity
    ) {
      return;
    }

    const face = nextFace();

    if (!face) return;

    endHover();

    front.map = face;
    front.needsUpdate = true;
    hovered.current = index;
    gl.domElement.style.cursor = "pointer";

    gsap.to(cardMotion(motion, index), {
      flip: 1,
      hover: 1,
      duration: config.hover.flip,
      ease: "power2.inOut",
      overwrite: "auto",
    });
    gsap.to(motion, {
      speed: config.hover.speed,
      duration: config.hover.ease,
      ease: "power2.out",
      overwrite: "auto",
    });
  });

  useEffect(() => {
    const canvas = gl.domElement;

    return () => {
      canvas.style.cursor = "";
    };
  }, [gl]);

  // Layer 1 breathing: GSAP swings motion.breath between -1 and 1 forever.
  // Each swing takes one second at timeScale 1; the frame loop scales it to
  // the configured period, so tuning never restarts the tween.
  useGSAP(() => {
    breathing.current = gsap.fromTo(
      motion,
      { breath: -1 },
      {
        breath: 1,
        duration: 1,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      },
    );
  }, [motion]);

  // The rhythm: every card advances one slot in a quick eased move, then
  // the stream rests with a card held exactly at the focus point. Each beat
  // schedules the next, so tuning the timings applies from the next beat.
  useGSAP(() => {
    let alive = true;
    let beats = 0;

    // Start with a card resting at the focus point.
    motion.travel = config.focusAt;

    // The focus peek: turn the focus card over to a sample, hold it so it
    // can be read, then turn it back before the stream moves on.
    const peek = (index: number, face: Texture) => {
      const front = fronts[index];

      if (!front) return false;

      front.map = face;
      front.needsUpdate = true;

      const values = cardMotion(motion, index);
      const { flip, hold } = config.peek;

      peeking.current = index;
      beat.current = gsap
        .timeline({
          onComplete: () => {
            peeking.current = -1;
            advance();
          },
        })
        .to(values, {
          flip: 1,
          duration: flip,
          delay: 0.2,
          ease: "power2.inOut",
          onComplete: () => {
            if (config.layers.sheen) sweepSheen(index);
          },
        })
        .to(values, {
          flip: 0,
          duration: flip,
          delay: hold,
          ease: "power2.inOut",
        });

      return true;
    };

    const rest = () => {
      if (!alive) return;

      beats += 1;

      // No peek while the visitor is previewing a card or claiming.
      if (
        config.layers.peek &&
        claimPhase.current === "idle" &&
        config.rhythm.enabled &&
        hovered.current < 0 &&
        beats % Math.max(1, Math.round(config.peek.every)) === 0
      ) {
        const index = focusCard();
        const face = nextFace();

        if (index >= 0 && face && peek(index, face)) return;
      }

      const jitter = (Math.random() * 2 - 1) * config.rhythm.dwellJitter;

      beat.current = gsap.delayedCall(
        Math.max(0.2, config.rhythm.dwell + jitter),
        advance,
      );
    };

    const advance = () => {
      if (!alive) return;

      // While the rhythm is off, check back shortly.
      if (!config.rhythm.enabled) {
        beat.current = gsap.delayedCall(0.25, advance);
        return;
      }

      const spacing = spacingNow.current;
      // Land on the next slot that puts a card exactly at the focus point,
      // which also soaks up the small drift during the rest.
      const slot = Math.round((motion.travel - config.focusAt) / spacing) + 1;

      beat.current = gsap.to(motion, {
        travel: config.focusAt + slot * spacing,
        duration: config.rhythm.advance,
        ease: "power3.inOut",
        onComplete: rest,
      });
    };

    restartRhythm.current = () => {
      beat.current?.kill();
      rest();
    };
    if (!restoring.current) rest();

    return () => {
      alive = false;
      beat.current?.kill();
    };
  }, [motion]);

  // Layer 5, the teaser: every so often one clearly visible card turns a
  // little and back, as if about to show its other side. Only while the
  // stream runs, and never on a card being peeked at or previewed.
  useGSAP(() => {
    let next: gsap.core.Tween | null = null;

    const schedule = () => {
      const { min, max } = config.teaser;
      const wait = Math.max(1, min + Math.random() * Math.max(0, max - min));

      next = gsap.delayedCall(wait, tease);
    };

    const tease = () => {
      schedule();

      if (!config.layers.teaser || claimPhase.current !== "idle") return;

      const candidates = materials.flatMap((material, i) => {
        const values = cardMotion(motion, i);

        return groups.current[i]?.visible &&
          material.opacity >= 0.6 &&
          i !== hovered.current &&
          i !== peeking.current &&
          values.flip === 0 &&
          values.tease === 0
          ? [i]
          : [];
      });
      const index = candidates[Math.floor(Math.random() * candidates.length)];

      if (index === undefined) return;

      gsap.to(cardMotion(motion, index), {
        tease: 1,
        duration: config.teaser.duration / 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1,
      });
    };

    schedule();

    return () => next?.kill();
  }, [motion, materials]);

  /** Where the claimed card rests: the focus point, nudged and lifted. */
  const revealPosition = (target: Vector3) => {
    const path = curve.current?.path;

    if (path) path.getPointAt(config.focusAt, target);
    // By the page's layout, not the stage's width: on desktop the stage is
    // only the right-hand column, which is narrow enough on a laptop to use
    // the phone path, but the phone's raised reveal must stay on phones.
    const [x, y] =
      config.claim.reveal[
        window.innerWidth >= PAGE_DESKTOP_MIN_WIDTH ? "desktop" : "mobile"
      ];

    target.x += x;
    target.y += y;
    target.z += config.claim.lift;

    return target;
  };

  // Step 3: the other cards fall, one after another, into a loose stack
  // just below and behind the revealed card, like cards dropped on a table.
  const startSettle = contextSafe((revealed: number, instant = false) => {
    const settings = config.settle;
    const others = Array.from(
      { length: config.stream.cardCount },
      (_, i) => i,
    ).filter((i) => i !== revealed);
    const jitter = () => (Math.random() * 2 - 1) * settings.jitter;

    others.forEach((i, order) => {
      const depth = order + 1;

      // The revealed card's face sits `peek.lift` in front of the reveal
      // position once turned over; the deck goes just behind that face.
      stack.current[i] = {
        offset: new Vector3(
          settings.step[0] * depth + jitter(),
          settings.step[1] * depth + jitter(),
          config.peek.lift - 0.01 * depth,
        ),
        rotation: (Math.random() * 2 - 1) * settings.rotation * DEGREES,
        order,
      };

      if (instant) {
        cardMotion(motion, i).settle = 1;
        return;
      }

      gsap.to(cardMotion(motion, i), {
        settle: 1,
        duration: settings.duration,
        delay: order * settings.stagger,
        ease: "back.out(1.3)",
        overwrite: "auto",
      });
    });

    if (instant) return;

    gsap.delayedCall(
      settings.duration + others.length * settings.stagger,
      () => {
        settled.current = true;
        onSettledNow.current?.();
      },
    );
  });

  // A returning visitor: lay out the collapsed deck at once, with today's
  // achievement face up on top, then fade it all in and celebrate once.
  const applyRestore = contextSafe((face: Texture) => {
    const index = focusCard();
    const front = fronts[index];

    if (index < 0 || !front) return;

    claimedFace.current?.dispose();
    claimedFace.current = face;
    front.map = face;
    front.needsUpdate = true;

    motion.noise = 0.5;
    motion.claim.index = index;
    motion.claim.blend = 1;
    cardMotion(motion, index).flip = 1;
    startSettle(index, true);

    settled.current = true;
    onSettledNow.current?.();

    gsap.to(motion, {
      fade: 1,
      duration: config.returning.fadeIn,
      ease: "power2.out",
      onComplete: () => celebrateFocus(index),
    });
  });

  const restoreClaim = contextSafe(async (achievement: ShareImageInput) => {
    try {
      restoreFace.current = await drawCardFront(achievement);
    } catch (error) {
      console.error("Could not draw the saved card:", error);
      // Show the deck anyway rather than an empty stage.
      motion.fade = 1;
    }
  });

  // The claim, step 1: everything settles and the focus card lifts toward
  // the camera, off the path. It starts on tap, before the server answers.
  const startClaim = contextSafe(() => {
    if (claimPhase.current !== "idle") return;

    claimPhase.current = "claiming";
    endHover();

    const settings = config.claim;
    let delay = 0;

    // Any card showing a sample (mid-peek or hovered) turns back first, so
    // a preview is never mistaken for the result.
    if (peeking.current >= 0) {
      beat.current?.kill();
      peeking.current = -1;
    }

    motion.cards.forEach((values) => {
      if (values.tease > 0) {
        gsap.killTweensOf(values, "tease");
        gsap.to(values, { tease: 0, duration: 0.3, ease: "power2.out" });
      }

      if (values.flip <= 0) return;

      gsap.killTweensOf(values, "flip");
      gsap.to(values, { flip: 0, duration: 0.35, ease: "power2.inOut" });
      delay = 0.3;
    });

    gsap.to(motion, {
      speed: 0,
      noise: 0.5,
      ambient: 0,
      duration: settings.slowdown,
      ease: "power2.out",
      overwrite: "auto",
    });

    motion.claim.index = focusCard();
    gsap.to(motion.claim, {
      blend: 1,
      duration: settings.liftTime,
      delay,
      ease: "power3.out",
      overwrite: "auto",
    });
  });

  // Step 2: the result is in. Put the achievement on the lifted card's
  // front and turn it over, then celebrate with the pop and sheen.
  const revealClaim = contextSafe(async (achievement: ShareImageInput) => {
    const index = motion.claim.index;
    const front = fronts[index];

    if (index < 0 || !front) return;

    let face: Texture;

    try {
      face = await drawCardFront(achievement);
    } catch (error) {
      console.error("Could not draw the claimed card:", error);
      return;
    }

    if (claimPhase.current !== "claiming" || motion.claim.index !== index) {
      face.dispose();
      return;
    }

    claimedFace.current?.dispose();
    claimedFace.current = face;
    front.map = face;
    front.needsUpdate = true;
    claimPhase.current = "revealed";

    // Let the lift finish before turning over.
    const waitForLift = (1 - motion.claim.blend) * config.claim.liftTime;

    gsap.to(cardMotion(motion, index), {
      flip: 1,
      duration: config.claim.flip,
      delay: waitForLift,
      ease: "power3.inOut",
      overwrite: "auto",
      onComplete: () => {
        celebrateFocus(index);
        startSettle(index);
      },
    });
  });

  // Or: the claim failed or there was nothing to claim. The card settles
  // back onto the path and the stream picks up again.
  const cancelClaim = contextSafe(() => {
    if (claimPhase.current !== "claiming") return;

    const duration = config.claim.resume;

    gsap.to(motion.claim, {
      blend: 0,
      duration,
      ease: "power2.inOut",
      overwrite: "auto",
      onComplete: () => {
        motion.claim.index = -1;
        claimPhase.current = "idle";
      },
    });
    gsap.to(motion, {
      speed: 1,
      noise: 1,
      ambient: 1,
      duration,
      ease: "power2.inOut",
      overwrite: "auto",
    });
    restartRhythm.current();
  });

  // Act once per change of claim status, not on every render.
  const handledClaim = useRef("");

  useEffect(() => {
    const key = `${claim.status}:${claim.attempt}`;

    if (handledClaim.current === key) return;
    handledClaim.current = key;

    if (claim.status === "claiming") {
      startClaim();
    } else if (claim.status === "revealed" && claim.achievement) {
      if (restoring.current) {
        void restoreClaim(claim.achievement);
      } else {
        startClaim();
        void revealClaim(claim.achievement);
      }
    } else if (claim.status === "failed") {
      cancelClaim();
    }
  }, [claim, startClaim, revealClaim, cancelClaim, restoreClaim]);

  useEffect(
    () => () => {
      claimedFace.current?.dispose();
    },
    [],
  );

  useFrame(({ clock }, delta) => {
    // Layer 4: the camera drifts toward the pointer for a little parallax.
    const follow = config.layers.parallax && pointer.active;
    const targetX = follow ? pointer.x * config.pointer.amount : 0;
    const targetY = follow ? pointer.y * config.pointer.amount * 0.6 : 0;

    camera.position.x +=
      (targetX - camera.position.x) * config.pointer.smoothing;
    camera.position.y +=
      (targetY - camera.position.y) * config.pointer.smoothing;
    camera.lookAt(0, 0, 0);

    const layout: Layout =
      size.width >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile";

    layoutNow.current = layout;
    const curveKey = `${layout}:${config.version}`;

    // Rebuild the curve when the layout or the control points change.
    if (curve.current?.key !== curveKey) {
      const path = new CatmullRomCurve3(
        config.curve[layout].map(([x, y, z]) => new Vector3(x, y, z)),
        false,
        "centripetal",
      );

      curve.current = {
        key: curveKey,
        path,
        bankAt: createBankTable((t) => path.getTangentAt(t, new Vector3())),
      };
    }

    const { strength, width } = config.speedRemap;
    const remapKey = `${config.focusAt}:${strength}:${width}`;

    if (remap.current?.key !== remapKey) {
      remap.current = {
        key: remapKey,
        remap: createSpeedRemap(config.focusAt, strength, width),
      };
    }

    if (restoreFace.current) {
      applyRestore(restoreFace.current);
      restoreFace.current = null;
    }

    const { path, bankAt } = curve.current;
    const { layers } = config;
    const dt = Math.min(delta, 0.05);
    const time = clock.elapsedTime;
    const spacing = config.stream.spacing[layout];

    breathing.current?.timeScale(2 / Math.max(0.5, config.breathing.period));

    // A sine swing with a little noise mixed in, so the pace never repeats
    // exactly.
    const breath = layers.breathing
      ? config.breathing.amount *
        (0.75 * motion.breath + 0.25 * noise2D(time * 0.15, 900))
      : 0;

    spacingNow.current = spacing;
    beat.current?.timeScale(Math.max(0, motion.speed));

    // At speed 1, one card passes the focus point every `secondsPerCard`.
    // With the rhythm on, GSAP does the moving and this is only the gentle
    // drift between beats.
    const pace = config.rhythm.enabled ? config.rhythm.drift : 1;

    motion.travel +=
      (dt * motion.speed * pace * (1 + breath) * spacing) /
      config.stream.secondsPerCard;

    // Layer 4: the clearly visible card nearest the pointer leans toward it.
    // Uses last frame's positions, which is close enough and keeps this cheap.
    let nearest = -1;

    if (layers.pointerTilt && pointer.active) {
      let best = config.pointer.reach * 2;

      for (let i = 0; i < cardCount; i++) {
        const card = groups.current[i];
        const material = materials[i];

        if (!card?.visible || !material || material.opacity < 0.6) continue;

        screen.copy(card.position).project(camera);

        const distance = Math.hypot(screen.x - pointer.x, screen.y - pointer.y);

        if (distance < best) {
          best = distance;
          nearest = i;
        }
      }
    }

    // A hovered card that drifts into the faint exit stops being previewed.
    if (hovered.current >= 0) {
      const card = groups.current[hovered.current];
      const material = materials[hovered.current];

      if (
        !card?.visible ||
        !material ||
        material.opacity < config.hover.minOpacity * 0.8
      ) {
        endHover();
      }
    }

    // Where the deck sits this frame, so it follows any layout change.
    revealPosition(deckBase);

    const noiseScale = layers.noise ? motion.noise : 0;
    const noiseTime = time * config.noise.frequency;

    for (let i = 0; i < cardCount; i++) {
      const card = groups.current[i];
      const material = materials[i];

      if (!card || !material) continue;

      const values = cardMotion(motion, i);
      const u = cardProgress(config, layout, motion.travel, i);

      // Cards waiting off the path still join the stack after a claim.
      card.visible = u !== null || values.settle > 0;
      if (!card.visible) continue;

      const t = u === null ? 0 : layers.speedRemap ? remap.current.remap(u) : u;
      const depth = depthAt(config, t);
      const previous = lastT.current[i];

      lastT.current[i] = t;

      // Layer 3: celebrate the moment a card reaches the focus point.
      if (
        previous != null &&
        previous < config.focusAt &&
        t >= config.focusAt &&
        t - previous < MAX_FRAME_STEP
      ) {
        celebrateFocus(i);
      }

      // Layer 4: ease each card's lean toward the pointer, or back to rest.
      const lean = (pointerTilt.current[i] ??= { x: 0, y: 0 });
      const leanTarget = { x: 0, y: 0 };

      if (i === nearest) {
        screen.copy(card.position).project(camera);

        const reach = Math.max(config.pointer.reach, 0.05);

        leanTarget.x = Math.max(
          -1,
          Math.min(1, (pointer.x - screen.x) / reach),
        );
        leanTarget.y = Math.max(
          -1,
          Math.min(1, (pointer.y - screen.y) / reach),
        );
      }

      lean.x += (leanTarget.x - lean.x) * 0.08;
      lean.y += (leanTarget.y - lean.y) * 0.08;

      path.getPointAt(t, point);
      path.getTangentAt(t, tangent);

      // Layer 2: each card's own gentle bob, sway and tilt.
      const seed = i * NOISE_CARD_OFFSET;
      const calm = 1 - values.hover * (1 - config.hover.noise);
      const wobble = (axis: number) =>
        noise2D(noiseTime, seed + axis) * noiseScale * calm;
      const bob = wobble(NOISE_AXES.bob) * config.noise.bob;
      const sway = wobble(NOISE_AXES.sway) * config.noise.sway * DEGREES;
      const tiltX = wobble(NOISE_AXES.tiltX) * config.noise.tilt * DEGREES;
      const tiltY = wobble(NOISE_AXES.tiltY) * config.noise.tilt * DEGREES;

      // Layer 2: roll into the curve's bends, like riding the path.
      const bank = layers.banking
        ? bankAt(t) * config.banking.maxDegrees * DEGREES
        : 0;

      // The claimed card leaves the path for the reveal position: the focus
      // point nudged up and toward centre, lifted toward the camera.
      const claimed = i === motion.claim.index ? motion.claim.blend : 0;
      const onPath = 1 - claimed;

      card.position.copy(point);
      card.position.y += bob;

      if (claimed > 0) {
        revealPosition(reveal);

        // A gentle float while waiting for the server.
        if (claimPhase.current === "claiming") {
          reveal.y += Math.sin(time * 1.8) * config.claim.waitFloat * claimed;
        }

        card.position.lerp(reveal, claimed);
      }

      card.scale.setScalar(
        (depth.scale * onPath + claimed) *
          (1 + values.pop * config.focusPop.scale),
      );

      // Face the camera, turned a little by the path's direction of travel.
      // The claimed card straightens up as it leaves the path.
      card.quaternion.copy(camera.quaternion);
      card.rotateZ(
        (Math.atan2(tangent.y, tangent.x) * config.pathTurn + bank + sway) *
          onPath,
      );
      const leanAngle = config.pointer.tiltDegrees * DEGREES;

      card.rotateY(
        (-tangent.z * config.pathTurn + tiltY) * onPath + lean.x * leanAngle,
      );
      card.rotateX(tiltX * onPath - lean.y * leanAngle);

      // The revealed card floats gently in front of the stack.
      if (claimed > 0 && claimPhase.current === "revealed") {
        const float = config.settle.float * DEGREES * claimed;
        const speed = config.settle.floatSpeed;

        card.rotateX(Math.sin(time * speed) * float);
        card.rotateY(Math.cos(time * speed * 0.8) * float);
        card.position.y += Math.sin(time * speed * 1.3) * 0.03 * claimed;
      }

      // Falling into the stack: blend from wherever the card was to its spot.
      // The ease overshoots a little, which reads as a soft bounce.
      const spot = stack.current[i];
      const settle = claimed > 0 || !spot ? 0 : values.settle;

      if (settle > 0 && spot) {
        stackTarget.copy(deckBase).add(spot.offset);
        card.position.lerp(stackTarget, settle);
        card.scale.setScalar(
          // The same size as the revealed card, which grows by
          // `peek.scale` once turned over.
          card.scale.x + (1 + config.peek.scale - card.scale.x) * settle,
        );
        stackEuler.set(0, 0, spot.rotation);
        stackTurn.setFromEuler(stackEuler).premultiply(camera.quaternion);
        card.quaternion.slerp(stackTurn, Math.min(1, settle));
      }

      // The card nearest the focus point always draws on top, so cards
      // bunching up around it tuck behind instead of covering it. The
      // claimed card is above them all, and the stack sits just below it.
      const order =
        claimed > 0
          ? 2000
          : settle > 0 && spot
            ? 1500 + spot.order
            : 1000 - Math.round(Math.abs(t - config.focusAt) * 1000);

      card.traverse((child) => {
        child.renderOrder = order;
      });

      // Turning over: a half turn on Y, lifted toward the camera and tipped
      // slightly mid-turn so it feels turned by hand rather than spun.
      const flip = flips.current[i];

      if (flip) {
        const arc = Math.sin(values.flip * Math.PI);

        const tease = values.tease * config.teaser.degrees * DEGREES;

        flip.rotation.set(0, values.flip * Math.PI + tease, arc * 0.06);
        flip.position.set(
          0,
          arc * 0.05,
          values.flip * config.peek.lift + arc * config.peek.arc,
        );
        flip.scale.setScalar(1 + values.flip * config.peek.scale);
      }

      // Cards that were faint at the entry or exit fade in as they fall.
      const landed = Math.min(1, settle);
      const brightness =
        (depth.brightness * onPath + claimed) * (1 - landed) +
        0.97 * landed +
        values.pop * config.focusPop.brightness;
      const opacity =
        (depth.opacity * onPath + claimed) * (1 - landed) + landed;
      const front = fronts[i];

      material.opacity = opacity * motion.fade;
      material.color.setScalar(brightness);

      if (front) {
        front.opacity = opacity * motion.fade;
        front.color.setScalar(brightness);
      }

      const sheen = sheens[i] as ShaderMaterial | undefined;

      if (sheen) {
        sheen.uniforms.sweep!.value = values.sheen;
        sheen.uniforms.width!.value = config.sheen.width;
        // Fronts carry text, so the light is gentler there.
        const onFront = values.flip > 0.5;

        sheen.uniforms.intensity!.value =
          config.sheen.intensity * opacity * motion.fade * (onFront ? 0.45 : 1);
      }
    }

    // Keep the Share button centred under the revealed card, and clear of
    // the whole deck: the stacked cards hang lower than the revealed one,
    // by a different amount each time they fall.
    const anchor = shareAnchor?.current;
    const revealedFlip = flips.current[motion.claim.index];

    if (anchor && revealedFlip && claimPhase.current === "revealed") {
      anchorPoint.set(0, -config.card.height / 2, 0);
      revealedFlip.localToWorld(anchorPoint).project(camera);

      const x = ((anchorPoint.x + 1) / 2) * size.width;
      let lowest = anchorPoint.y;
      const halfW = config.card.width / 2;
      const halfH = config.card.height / 2;

      for (let i = 0; i < cardCount; i++) {
        const flip = flips.current[i];
        const inDeck =
          i === motion.claim.index || cardMotion(motion, i).settle > 0;

        if (!flip || !inDeck || !groups.current[i]?.visible) continue;

        for (const [cx, cy] of [
          [-halfW, -halfH],
          [halfW, -halfH],
          [-halfW, halfH],
          [halfW, halfH],
        ] as const) {
          anchorPoint.set(cx, cy, 0);
          flip.localToWorld(anchorPoint).project(camera);
          lowest = Math.min(lowest, anchorPoint.y);
        }
      }

      const y = ((1 - lowest) / 2) * size.height;

      anchor.style.transform = `translate(${x}px, ${y}px) translate(-50%, ${config.claim.shareGap}px)`;
    }
  });

  return (
    <>
      <Sparkles
        config={config}
        motion={motion}
        getPath={() => curve.current?.path ?? null}
      />
      {materials.map((material, i) => (
        <group
          key={i}
          ref={(group) => {
            groups.current[i] = group;
          }}
          onPointerOver={(event) => {
            // Only the front-most card under the pointer responds.
            event.stopPropagation();
            startHover(i);
          }}
          onPointerOut={() => {
            if (hovered.current === i) endHover();
          }}
        >
          <group
            ref={(flip) => {
              flips.current[i] = flip;
            }}
          >
            <mesh geometry={geometry} material={material} />
            <mesh geometry={geometry} material={sheens[i]} position-z={0.001} />
            <mesh
              geometry={frontGeometry}
              material={fronts[i]}
              position-z={-0.002}
            />
            <mesh
              geometry={frontGeometry}
              material={sheens[i]}
              position-z={-0.003}
            />
          </group>
        </group>
      ))}
    </>
  );
}

interface HeroSceneProps {
  config: HeroConfig;
  motion: HeroMotion;
  cardCount: number;
  /** Sample achievements for the focus peek. */
  samples: ShareImageInput[];
  claim: HeroClaim;
  /** Kept under the revealed card, for the Share button. */
  shareAnchor?: RefObject<HTMLElement | null>;
  /** Called once the stack has landed after a claim. */
  onSettled?: () => void;
}

/** The hero's three.js scene. Loaded lazily; the page works without it. */
export default function HeroScene({
  config,
  motion,
  cardCount,
  samples,
  claim,
  shareAnchor,
  onSettled,
}: HeroSceneProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerState>({ x: 0, y: 0, active: false }).current;
  const [back, setBack] = useState<Texture | null>(null);
  const [faces, setFaces] = useState<Texture[]>([]);

  // A returning visitor's scene starts invisible from its very first frame.
  useState(() => {
    if (claim.status === "revealed" && claim.restored) motion.fade = 0;
  });
  const [canHover, setCanHover] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let texture: Texture | null = null;

    drawCardBack()
      .then((drawn) => {
        texture = drawn;
        if (cancelled) drawn.dispose();
        else setBack(drawn);
      })
      .catch((error: unknown) => {
        console.error("Could not draw the card back:", error);
      });

    return () => {
      cancelled = true;
      texture?.dispose();
    };
  }, []);

  // Layer 4: follow the pointer across the stage, on desktop only. The
  // canvas sits under the headline, so this listens on the window and maps
  // into the stage's own coordinates.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const finePointer = window.matchMedia(FINE_POINTER_QUERY);

    setCanHover(finePointer.matches);

    if (!wrapper || !finePointer.matches) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const rect = wrapper.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      pointer.active = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      pointer.x = x * 2 - 1;
      pointer.y = 1 - y * 2;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [pointer]);

  // Draw the sample fronts once the back is ready, one at a time so the page
  // stays responsive. Each joins the peek pool as soon as it is drawn.
  useEffect(() => {
    if (!back || samples.length === 0) return;

    let cancelled = false;
    const drawn: Texture[] = [];

    (async () => {
      for (const sample of samples.slice(0, config.samplePoolSize)) {
        if (cancelled) return;

        try {
          const face = await drawCardFront(sample);

          if (cancelled) {
            face.dispose();
            return;
          }

          drawn.push(face);
          setFaces([...drawn]);
        } catch (error) {
          console.error("Could not draw a sample card:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
      drawn.forEach((face) => face.dispose());
    };
  }, [back, samples, config.samplePoolSize]);

  // Stop rendering while the hero is scrolled out of view.
  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) return;

    const observer = new IntersectionObserver(([entry]) =>
      setInView(Boolean(entry?.isIntersecting)),
    );

    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="size-full" aria-hidden="true">
      <Canvas
        flat
        dpr={[1, config.maxPixelRatio]}
        frameloop={inView ? "always" : "never"}
        camera={{ fov: config.camera.fov, position: [0, 0, config.camera.z] }}
        gl={{ antialias: true, alpha: true }}
      >
        {back && (
          <Stream
            config={config}
            motion={motion}
            cardCount={cardCount}
            back={back}
            faces={faces}
            pointer={pointer}
            canHover={canHover}
            claim={claim}
            shareAnchor={shareAnchor}
            onSettled={onSettled}
          />
        )}
      </Canvas>
    </div>
  );
}

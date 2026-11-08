"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

import { AchievementCard } from "@/components/achievement-card-updated";
import type { Achievement } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { CardBack } from "./card-back";
import { ConfettiBurst } from "./confetti-burst";

gsap.registerPlugin(MotionPathPlugin);

const CARD_COUNT = 5;
const LOOP_SECONDS = 15;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_QUERY = "(min-width: 768px)";

// Cards linger while small on the left and speed up as they grow, which
// keeps a clear gap between the big cards on the right.
const PACE = 1.45;
const MIN_SCALE = 0.36;
const MAX_SCALE = 1.1;

// The loose pile the other cards drop into after a claim. Untidy on purpose,
// so the chosen card clearly sits on top. Offsets are fractions of a card.
const DECK = [
  { x: -0.09, y: 0.03, rotation: -9 },
  { x: 0.08, y: -0.02, rotation: 8 },
  { x: -0.03, y: -0.05, rotation: 3 },
  { x: 0.1, y: 0.04, rotation: 12 },
  { x: -0.11, y: -0.01, rotation: -5 },
];

type RawPath = ReturnType<typeof MotionPathPlugin.arrayToRawPath>;

interface Layout {
  path: RawPath;
  slot: { x: number; y: number };
  /** How far along the path the slot sits, 0–1. */
  slotProgress: number;
  cardWidth: number;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function measure(stage: HTMLElement, card: HTMLElement): Layout {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const desktop = window.matchMedia(DESKTOP_QUERY).matches;

  // On desktop the stage reaches under the headline; the slot is the centre
  // of the right-hand column. On phones the stage is full width.
  const slot = { x: width * (desktop ? 0.7 : 0.5), y: height * 0.5 };
  const path = MotionPathPlugin.arrayToRawPath(
    [
      { x: -width * (desktop ? 0.05 : 0.45), y: height * 0.82 },
      { x: width * (desktop ? 0.3 : 0.08), y: height * 0.8 },
      slot,
      { x: width * (desktop ? 1.15 : 1.5), y: height * 0.3 },
    ],
    { curviness: 1.25 },
  );

  MotionPathPlugin.cacheRawPathMeasurements(path);

  // Find where the curve passes through the slot.
  let slotProgress = 0;
  let nearest = Infinity;

  for (let i = 0; i <= 200; i++) {
    const point = MotionPathPlugin.getPositionOnPath(path, i / 200);
    const distance = Math.hypot(point.x - slot.x, point.y - slot.y);

    if (distance < nearest) {
      nearest = distance;
      slotProgress = i / 200;
    }
  }

  return { path, slot, slotProgress, cardWidth: card.offsetWidth };
}

/** Where card `index` sits on the path after `elapsed` seconds. */
function loopProgress(index: number, elapsed: number) {
  const phase = (elapsed / LOOP_SECONDS + index / CARD_COUNT) % 1;

  return phase ** PACE;
}

function poseOnPath(layout: Layout, progress: number) {
  const point = MotionPathPlugin.getPositionOnPath(layout.path, progress, true);
  const { slotProgress } = layout;
  const scale =
    progress <= slotProgress
      ? lerp(MIN_SCALE, 1, (progress / slotProgress) ** 1.2)
      : lerp(1, MAX_SCALE, (progress - slotProgress) / (1 - slotProgress));
  const fade = Math.min(progress / 0.08, (1 - progress) / 0.1, 1);

  return {
    x: point.x,
    y: point.y,
    scale,
    rotation: Math.max(
      -10,
      Math.min(10, ((point as { angle?: number }).angle ?? 0) * 0.3),
    ),
    // Smaller cards sit further back, so they are a little fainter.
    opacity:
      clamp01(fade) * lerp(0.55, 1, (scale - MIN_SCALE) / (1 - MIN_SCALE)),
    zIndex: Math.round(progress * 100),
  };
}

interface CardFeedProps {
  /** The claimed achievement, shown face up on top of the deck. */
  revealed: Achievement | null;
  /** Skip the reveal animation for an achievement from an earlier visit. */
  restored: boolean;
  /** Hold the loop still until we know whether there is a saved claim. */
  ready: boolean;
  label: string;
  className?: string;
}

export function CardFeed({
  revealed,
  restored,
  ready,
  label,
  className,
}: CardFeedProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const layoutRef = useRef<Layout | null>(null);
  const progressRef = useRef<number[]>([]);
  const elapsedRef = useRef(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [slot, setSlot] = useState<{ x: number; y: number } | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const placeOnLoop = () => {
    const layout = layoutRef.current;

    if (!layout) return;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      const progress = loopProgress(i, elapsedRef.current);

      progressRef.current[i] = progress;
      gsap.set(card, poseOnPath(layout, progress));
    });
  };

  const deckPose = (layout: Layout, order: number) => {
    const jitter = DECK[order % DECK.length]!;

    return {
      x: layout.slot.x + jitter.x * layout.cardWidth,
      y: layout.slot.y + jitter.y * layout.cardWidth,
      scale: 0.97,
      rotation: jitter.rotation,
      opacity: 1,
      zIndex: 150 + order,
    };
  };

  // Measure the stage and lay the cards out, again whenever it resizes.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const firstCard = cardRefs.current[0];

    if (!stage || !firstCard) return;

    cardRefs.current.forEach((card) => {
      if (card) gsap.set(card, { xPercent: -50, yPercent: -50 });
    });
    flipRefs.current.forEach((flip) => {
      if (flip) gsap.set(flip, { transformPerspective: 900 });
    });

    let first = true;

    const relayout = () => {
      layoutRef.current = measure(stage, firstCard);

      // Start with one card at the slot. It is a balanced first frame, and
      // the still picture when motion is reduced.
      if (first) {
        first = false;
        elapsedRef.current =
          layoutRef.current.slotProgress ** (1 / PACE) * LOOP_SECONDS;
      }

      setSlot(layoutRef.current.slot);
      placeOnLoop();
    };

    relayout();

    const observer = new ResizeObserver(relayout);

    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  // The loop runs until a card is chosen, only while the stage is on screen.
  useEffect(() => {
    const stage = stageRef.current;

    if (
      !ready ||
      revealed ||
      !stage ||
      window.matchMedia(REDUCED_MOTION_QUERY).matches
    ) {
      return;
    }

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });

    observer.observe(stage);

    const tick = (_time: number, deltaMs: number) => {
      if (!visible) return;

      elapsedRef.current += Math.min(deltaMs, 50) / 1000;
      placeOnLoop();
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
    };
  }, [ready, revealed]);

  // Once there is an achievement, pick the card nearest the slot.
  useEffect(() => {
    if (!revealed) {
      setChosen(null);
      return;
    }

    const slotProgress = layoutRef.current?.slotProgress ?? 0.65;
    const distances = Array.from({ length: CARD_COUNT }, (_, i) =>
      Math.abs((progressRef.current[i] ?? 0) - slotProgress),
    );

    setChosen(distances.indexOf(Math.min(...distances)));
  }, [revealed]);

  // Bring the chosen card to the slot and turn it over. The rest drop into
  // a loose pile behind it.
  useLayoutEffect(() => {
    const layout = layoutRef.current;

    if (chosen === null || !layout || !revealed) return;

    const card = cardRefs.current[chosen];
    const flip = flipRefs.current[chosen];

    if (!card || !flip) return;

    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const settled = { ...layout.slot, scale: 1, rotation: 0, opacity: 1 };
    const others = cardRefs.current.filter(
      (other, i): other is HTMLDivElement => other !== null && i !== chosen,
    );

    if (restored || reduced) {
      others.forEach((other, order) =>
        gsap.set(other, deckPose(layout, order)),
      );
      gsap.set(card, { ...settled, zIndex: 200 });
      gsap.set(flip, { rotationY: 180 });

      if (!restored) {
        // Reduced motion: a crossfade instead of a flip.
        gsap.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      }

      return;
    }

    const timeline = gsap.timeline({
      onComplete: () => setCelebrate(revealed.id),
    });

    timeline
      .set(card, { zIndex: 200 })
      .to(card, { ...settled, duration: 0.7, ease: "power3.inOut" }, 0)
      .to(flip, { rotationY: 180, duration: 0.8, ease: "back.out(1.6)" }, 0.35);

    others.forEach((other, order) => {
      timeline.to(
        other,
        { ...deckPose(layout, order), duration: 0.65, ease: "power2.out" },
        0.05 * order,
      );
    });

    return () => {
      timeline.kill();
    };
  }, [chosen, revealed, restored]);

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={label}
      // isolate keeps the cards' stacking inside the feed, so every card
      // passes underneath the headline.
      className={cn("relative isolate", className)}
    >
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(card) => {
            cardRefs.current[i] = card;
          }}
          data-feed-card={i}
          className="absolute top-0 left-0 aspect-[5/7] w-[230px] will-change-transform md:w-[270px]"
          aria-hidden="true"
        >
          <div
            ref={(flip) => {
              flipRefs.current[i] = flip;
            }}
            className="relative size-full [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
              <CardBack />
            </div>

            {chosen === i && revealed && (
              <div
                data-testid="chosen-card"
                className="absolute inset-0 [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)] [&>div]:h-full"
              >
                <AchievementCard
                  achievement={revealed}
                  variant="stacked"
                  ingrid
                  showShareButton={false}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {slot && (
        <div
          className="pointer-events-none absolute size-0"
          style={{ left: slot.x, top: slot.y }}
        >
          <ConfettiBurst trigger={celebrate} />
        </div>
      )}
    </div>
  );
}

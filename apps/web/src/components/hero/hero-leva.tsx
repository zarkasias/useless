"use client";

import { memo } from "react";
import { button, folder, Leva, useControls } from "leva";

import { MAX_SPARKLES, type HeroConfig, type Vec3 } from "./hero-config";

// Development-only tuning panel for /hero-lab. It writes straight into the
// scene's config object, which the render loop reads every frame, so tuning
// never re-renders React. Card count is the one structural value.

interface HeroLevaProps {
  config: HeroConfig;
  onCardCountChange: (count: number) => void;
}

function curveControls(config: HeroConfig, layout: "desktop" | "mobile") {
  const labels = [
    "entry",
    "approach",
    "approach 2",
    "focus",
    "exit",
    "exit end",
  ];

  return Object.fromEntries(
    config.curve[layout].map((point, i) => [
      `${layout} ${labels[i] ?? i}`,
      {
        value: [...point] as Vec3,
        step: 0.05,
        onChange: (value: Vec3) => {
          config.curve[layout][i] = [...value] as Vec3;
          config.version += 1;
        },
      },
    ]),
  );
}

function HeroLeva({ config, onCardCountChange }: HeroLevaProps) {
  useControls(() => ({
    "Path (desktop)": folder(curveControls(config, "desktop"), {
      collapsed: true,
    }),
    "Path (mobile)": folder(curveControls(config, "mobile"), {
      collapsed: true,
    }),
    Stream: folder({
      "focus position": {
        value: config.focusAt,
        min: 0.4,
        max: 0.95,
        step: 0.01,
        onChange: (value: number) => {
          config.focusAt = value;
        },
      },
      "seconds per card": {
        value: config.stream.secondsPerCard,
        min: 0.6,
        max: 5,
        step: 0.05,
        onChange: (value: number) => {
          config.stream.secondsPerCard = value;
        },
      },
      "card count": {
        value: config.stream.cardCount,
        min: 3,
        max: 14,
        step: 1,
        onChange: (value: number) => {
          config.stream.cardCount = value;
          onCardCountChange(value);
        },
      },
      "spacing (desktop)": {
        value: config.stream.spacing.desktop,
        min: 0.04,
        max: 0.3,
        step: 0.005,
        onChange: (value: number) => {
          config.stream.spacing.desktop = value;
        },
      },
      "spacing (mobile)": {
        value: config.stream.spacing.mobile,
        min: 0.04,
        max: 0.3,
        step: 0.005,
        onChange: (value: number) => {
          config.stream.spacing.mobile = value;
        },
      },
      // Spreads the cards evenly over the whole desktop path.
      "even spacing": button(() => {
        config.stream.spacing.desktop = 1 / config.stream.cardCount;
      }),
      "path turn": {
        value: config.pathTurn,
        min: 0,
        max: 0.6,
        step: 0.01,
        onChange: (value: number) => {
          config.pathTurn = value;
        },
      },
    }),
    "Entry & exit": folder({
      "entry scale": {
        value: config.entry.scale,
        min: 0.1,
        max: 1,
        step: 0.01,
        onChange: (value: number) => {
          config.entry.scale = value;
        },
      },
      "entry opacity": {
        value: config.entry.opacity,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (value: number) => {
          config.entry.opacity = value;
        },
      },
      "entry brightness": {
        value: config.entry.brightness,
        min: 0.2,
        max: 1,
        step: 0.01,
        onChange: (value: number) => {
          config.entry.brightness = value;
        },
      },
      "exit scale": {
        value: config.exit.scale,
        min: 0.4,
        max: 1.2,
        step: 0.01,
        onChange: (value: number) => {
          config.exit.scale = value;
        },
      },
      "exit opacity": {
        value: config.exit.opacity,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (value: number) => {
          config.exit.opacity = value;
        },
      },
      "exit fade length": {
        value: config.exit.length,
        min: 0.05,
        max: 0.4,
        step: 0.01,
        onChange: (value: number) => {
          config.exit.length = value;
        },
      },
    }),
    // Beats: advance one slot, then rest with a card at focus.
    Rhythm: folder({
      "beats on": {
        value: config.rhythm.enabled,
        onChange: (value: boolean) => {
          config.rhythm.enabled = value;
        },
      },
      "advance (s)": {
        value: config.rhythm.advance,
        min: 0.25,
        max: 2,
        step: 0.05,
        onChange: (value: number) => {
          config.rhythm.advance = value;
        },
      },
      "rest (s)": {
        value: config.rhythm.dwell,
        min: 0.2,
        max: 4,
        step: 0.05,
        onChange: (value: number) => {
          config.rhythm.dwell = value;
        },
      },
      "rest variation (s)": {
        value: config.rhythm.dwellJitter,
        min: 0,
        max: 1.5,
        step: 0.05,
        onChange: (value: number) => {
          config.rhythm.dwellJitter = value;
        },
      },
      "drift while resting": {
        value: config.rhythm.drift,
        min: 0,
        max: 0.4,
        step: 0.01,
        onChange: (value: number) => {
          config.rhythm.drift = value;
        },
      },
    }),
    // The focus card turns over to a sample every few rests.
    "Focus peek": folder({
      "every nth rest": {
        value: config.peek.every,
        min: 1,
        max: 8,
        step: 1,
        onChange: (value: number) => {
          config.peek.every = value;
        },
      },
      "turn (s)": {
        value: config.peek.flip,
        min: 0.2,
        max: 1.5,
        step: 0.05,
        onChange: (value: number) => {
          config.peek.flip = value;
        },
      },
      "hold (s)": {
        value: config.peek.hold,
        min: 0.3,
        max: 4,
        step: 0.1,
        onChange: (value: number) => {
          config.peek.hold = value;
        },
      },
      grow: {
        value: config.peek.scale,
        min: 0,
        max: 0.8,
        step: 0.01,
        onChange: (value: number) => {
          config.peek.scale = value;
        },
      },
      "turn arc": {
        value: config.peek.arc,
        min: 0,
        max: 0.8,
        step: 0.01,
        onChange: (value: number) => {
          config.peek.arc = value;
        },
      },
      lift: {
        value: config.peek.lift,
        min: 0,
        max: 0.8,
        step: 0.01,
        onChange: (value: number) => {
          config.peek.lift = value;
        },
      },
    }),
    // Desktop only: preview a card by hovering it.
    "Hover preview": folder({
      "stream speed while hovering": {
        value: config.hover.speed,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (value: number) => {
          config.hover.speed = value;
        },
      },
      "slow-down time (s)": {
        value: config.hover.ease,
        min: 0.1,
        max: 1.5,
        step: 0.05,
        onChange: (value: number) => {
          config.hover.ease = value;
        },
      },
      "hover turn (s)": {
        value: config.hover.flip,
        min: 0.2,
        max: 1.5,
        step: 0.05,
        onChange: (value: number) => {
          config.hover.flip = value;
        },
      },
      "hovered card wobble": {
        value: config.hover.noise,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (value: number) => {
          config.hover.noise = value;
        },
      },
    }),
    // The claim: slow down, lift, turn over.
    Claim: folder({
      "slow-down (s)": {
        value: config.claim.slowdown,
        min: 0.2,
        max: 2,
        step: 0.05,
        onChange: (value: number) => {
          config.claim.slowdown = value;
        },
      },
      "claim lift": {
        value: config.claim.lift,
        min: 0,
        max: 1.5,
        step: 0.01,
        onChange: (value: number) => {
          config.claim.lift = value;
        },
      },
      "lift time (s)": {
        value: config.claim.liftTime,
        min: 0.2,
        max: 2,
        step: 0.05,
        onChange: (value: number) => {
          config.claim.liftTime = value;
        },
      },
      "reveal (desktop)": {
        value: {
          x: config.claim.reveal.desktop[0],
          y: config.claim.reveal.desktop[1],
        },
        step: 0.01,
        onChange: (value: { x: number; y: number }) => {
          config.claim.reveal.desktop = [value.x, value.y];
        },
      },
      "reveal (phone)": {
        value: {
          x: config.claim.reveal.mobile[0],
          y: config.claim.reveal.mobile[1],
        },
        step: 0.01,
        onChange: (value: { x: number; y: number }) => {
          config.claim.reveal.mobile = [value.x, value.y];
        },
      },
      "turn over (s)": {
        value: config.claim.flip,
        min: 0.3,
        max: 2.5,
        step: 0.05,
        onChange: (value: number) => {
          config.claim.flip = value;
        },
      },
      "waiting float": {
        value: config.claim.waitFloat,
        min: 0,
        max: 0.15,
        step: 0.005,
        onChange: (value: number) => {
          config.claim.waitFloat = value;
        },
      },
      "Share gap (px)": {
        value: config.claim.shareGap,
        min: 0,
        max: 80,
        step: 1,
        onChange: (value: number) => {
          config.claim.shareGap = value;
        },
      },
      "resume after failure (s)": {
        value: config.claim.resume,
        min: 0.2,
        max: 2,
        step: 0.05,
        onChange: (value: number) => {
          config.claim.resume = value;
        },
      },
    }),
    // After the reveal: the deck under the card and the revealed card's float.
    Settle: folder({
      "edge step per card (x, y)": {
        value: { x: config.settle.step[0], y: config.settle.step[1] },
        step: 0.002,
        onChange: (value: { x: number; y: number }) => {
          config.settle.step = [value.x, value.y];
        },
      },
      "stagger (s)": {
        value: config.settle.stagger,
        min: 0,
        max: 0.2,
        step: 0.005,
        onChange: (value: number) => {
          config.settle.stagger = value;
        },
      },
      "fall time (s)": {
        value: config.settle.duration,
        min: 0.3,
        max: 2,
        step: 0.05,
        onChange: (value: number) => {
          config.settle.duration = value;
        },
      },
      "offset randomness": {
        value: config.settle.jitter,
        min: 0,
        max: 0.5,
        step: 0.01,
        onChange: (value: number) => {
          config.settle.jitter = value;
        },
      },
      "rotation randomness°": {
        value: config.settle.rotation,
        min: 0,
        max: 30,
        step: 0.5,
        onChange: (value: number) => {
          config.settle.rotation = value;
        },
      },
      "revealed float°": {
        value: config.settle.float,
        min: 0,
        max: 6,
        step: 0.1,
        onChange: (value: number) => {
          config.settle.float = value;
        },
      },
      "float speed": {
        value: config.settle.floatSpeed,
        min: 0.1,
        max: 2,
        step: 0.05,
        onChange: (value: number) => {
          config.settle.floatSpeed = value;
        },
      },
    }),
    // Layer 1: speed along the path.
    Speed: folder({
      "remap strength": {
        value: config.speedRemap.strength,
        min: 0,
        max: 0.85,
        step: 0.01,
        onChange: (value: number) => {
          config.speedRemap.strength = value;
        },
      },
      "linger width": {
        value: config.speedRemap.width,
        min: 0.03,
        max: 0.3,
        step: 0.005,
        onChange: (value: number) => {
          config.speedRemap.width = value;
        },
      },
      "breathing amount": {
        value: config.breathing.amount,
        min: 0,
        max: 0.4,
        step: 0.01,
        onChange: (value: number) => {
          config.breathing.amount = value;
        },
      },
      "breathing period (s)": {
        value: config.breathing.period,
        min: 2,
        max: 14,
        step: 0.5,
        onChange: (value: number) => {
          config.breathing.period = value;
        },
      },
    }),
    // Layer 2: each card's own motion.
    "Card motion": folder({
      "noise speed": {
        value: config.noise.frequency,
        min: 0.05,
        max: 1,
        step: 0.01,
        onChange: (value: number) => {
          config.noise.frequency = value;
        },
      },
      bob: {
        value: config.noise.bob,
        min: 0,
        max: 0.2,
        step: 0.005,
        onChange: (value: number) => {
          config.noise.bob = value;
        },
      },
      "sway°": {
        value: config.noise.sway,
        min: 0,
        max: 10,
        step: 0.1,
        onChange: (value: number) => {
          config.noise.sway = value;
        },
      },
      "tilt°": {
        value: config.noise.tilt,
        min: 0,
        max: 12,
        step: 0.1,
        onChange: (value: number) => {
          config.noise.tilt = value;
        },
      },
      "banking°": {
        value: config.banking.maxDegrees,
        min: -15,
        max: 15,
        step: 0.5,
        onChange: (value: number) => {
          config.banking.maxDegrees = value;
        },
      },
    }),
    // Layer 3: the moment at the focus point.
    "Focus moment": folder({
      "pop scale": {
        value: config.focusPop.scale,
        min: 0,
        max: 0.2,
        step: 0.005,
        onChange: (value: number) => {
          config.focusPop.scale = value;
        },
      },
      "pop brightness": {
        value: config.focusPop.brightness,
        min: 0,
        max: 0.4,
        step: 0.01,
        onChange: (value: number) => {
          config.focusPop.brightness = value;
        },
      },
      "pop duration (s)": {
        value: config.focusPop.duration,
        min: 0.3,
        max: 2,
        step: 0.05,
        onChange: (value: number) => {
          config.focusPop.duration = value;
        },
      },
      "sheen intensity": {
        value: config.sheen.intensity,
        min: 0,
        max: 1.2,
        step: 0.01,
        onChange: (value: number) => {
          config.sheen.intensity = value;
        },
      },
      "sheen width": {
        value: config.sheen.width,
        min: 0.03,
        max: 0.4,
        step: 0.005,
        onChange: (value: number) => {
          config.sheen.width = value;
        },
      },
      "sheen duration (s)": {
        value: config.sheen.duration,
        min: 0.3,
        max: 2.5,
        step: 0.05,
        onChange: (value: number) => {
          config.sheen.duration = value;
        },
      },
    }),
    // Layer 4: pointer response, desktop only.
    Pointer: folder({
      "parallax amount": {
        value: config.pointer.amount,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (value: number) => {
          config.pointer.amount = value;
        },
      },
      "parallax smoothing": {
        value: config.pointer.smoothing,
        min: 0.01,
        max: 0.3,
        step: 0.005,
        onChange: (value: number) => {
          config.pointer.smoothing = value;
        },
      },
      "nearest card tilt°": {
        value: config.pointer.tiltDegrees,
        min: 0,
        max: 15,
        step: 0.5,
        onChange: (value: number) => {
          config.pointer.tiltDegrees = value;
        },
      },
      "tilt reach": {
        value: config.pointer.reach,
        min: 0.05,
        max: 0.8,
        step: 0.01,
        onChange: (value: number) => {
          config.pointer.reach = value;
        },
      },
    }),
    // Layer 5 (optional): an occasional small turn that hints at the face.
    Teaser: folder(
      {
        "interval min (s)": {
          value: config.teaser.min,
          min: 1,
          max: 20,
          step: 0.5,
          onChange: (value: number) => {
            config.teaser.min = value;
          },
        },
        "interval max (s)": {
          value: config.teaser.max,
          min: 1,
          max: 30,
          step: 0.5,
          onChange: (value: number) => {
            config.teaser.max = value;
          },
        },
        "turn°": {
          value: config.teaser.degrees,
          min: 5,
          max: 60,
          step: 1,
          onChange: (value: number) => {
            config.teaser.degrees = value;
          },
        },
        "duration (s)": {
          value: config.teaser.duration,
          min: 0.3,
          max: 2,
          step: 0.05,
          onChange: (value: number) => {
            config.teaser.duration = value;
          },
        },
      },
      { collapsed: true },
    ),
    // Layer 6 (optional): sparkles drifting along the path.
    Particles: folder(
      {
        "particle count": {
          value: config.particles.count,
          min: 0,
          max: MAX_SPARKLES,
          step: 1,
          onChange: (value: number) => {
            config.particles.count = value;
          },
        },
        spread: {
          value: config.particles.spread,
          min: 0,
          max: 2,
          step: 0.05,
          onChange: (value: number) => {
            config.particles.spread = value;
          },
        },
        "size (px)": {
          value: config.particles.size,
          min: 2,
          max: 24,
          step: 0.5,
          onChange: (value: number) => {
            config.particles.size = value;
          },
        },
        "lap (s)": {
          value: config.particles.seconds,
          min: 4,
          max: 60,
          step: 1,
          onChange: (value: number) => {
            config.particles.seconds = value;
          },
        },
        opacity: {
          value: config.particles.opacity,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (value: number) => {
            config.particles.opacity = value;
          },
        },
      },
      { collapsed: true },
    ),
    // On/off switches for every motion layer.
    Layers: folder(
      Object.fromEntries(
        (Object.keys(config.layers) as (keyof HeroConfig["layers"])[]).map(
          (layer) => [
            layer,
            {
              value: config.layers[layer],
              onChange: (value: boolean) => {
                config.layers[layer] = value;
              },
            },
          ],
        ),
      ),
      { collapsed: true },
    ),
  }));

  // Start folded on phones so the panel doesn't cover the stage.
  const narrow = typeof window !== "undefined" && window.innerWidth < 700;

  return <Leva collapsed={narrow} titleBar={{ title: "Hero lab" }} />;
}

// The panel writes straight into the config, so it never needs to re-render
// with the page. Re-rendering every control cost hundreds of milliseconds
// during a claim.
export default memo(HeroLeva);

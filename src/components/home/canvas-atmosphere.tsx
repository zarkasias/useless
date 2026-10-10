"use client";

import { useEffect, useRef } from "react";
import styles from "./home.module.css";

interface CanvasAtmosphereProps {
  pulse: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function CanvasAtmosphere({ pulse }: CanvasAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef(pulse);

  useEffect(() => {
    pulseRef.current = pulse;
  }, [pulse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d");

    if (!canvas || !host || !context) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const colors = ["#8062d6", "#379c83", "#d6a12c", "#e185a3"];
    const particles = Array.from({ length: 48 }, (_, index) => ({
      x: ((index * 73 + 19) % 997) / 997,
      y: ((index * 137 + 41) % 991) / 991,
      depth: 0.2 + (index % 7) / 8,
      size: 2 + (index % 4),
      phase: index * 1.7,
      color: colors[index % colors.length],
    }));

    const sparks: Spark[] = [];
    let width = 1;
    let height = 1;
    let frame = 0;
    let visible = true;
    let reduced = preference.matches;
    let lastTime = 0;
    let elapsed = 0;
    let lastPulse = pulseRef.current;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      frame = 0;

      if (!visible || document.hidden) return;

      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;

      lastTime = time;
      if (!reduced) elapsed += delta;

      context.clearRect(0, 0, width, height);

      const scroll = reduced ? 0 : window.scrollY;

      particles.forEach((particle) => {
        const drift = reduced
          ? 0
          : Math.sin(elapsed * 0.45 + particle.phase) * 18;

        const x =
          particle.x * width +
          (reduced ? 0 : pointerX * particle.depth * 35) +
          drift;

        const rawY =
          particle.y * height +
          scroll * particle.depth * 0.18 +
          (reduced ? 0 : pointerY * particle.depth * 24);

        const y = ((rawY % height) + height) % height;

        context.save();
        context.translate(x, y);
        context.rotate(reduced ? particle.phase : elapsed * 0.12);
        context.globalAlpha = 0.35 + particle.depth * 0.3;
        context.fillStyle = particle.color;

        if (particle.size % 2 === 0) {
          context.fillRect(
            -particle.size,
            -particle.size,
            particle.size * 2,
            particle.size * 2,
          );
        } else {
          context.beginPath();
          context.arc(0, 0, particle.size, 0, Math.PI * 2);
          context.fill();
        }

        context.restore();
      });

      if (lastPulse !== pulseRef.current) {
        lastPulse = pulseRef.current;

        if (!reduced) {
          for (let index = 0; index < 42; index += 1) {
            const angle = (index / 42) * Math.PI * 2;
            const speed = 90 + (index % 5) * 35;

            sparks.push({
              x: width / 2,
              y: height * 0.45,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              color: colors[index % colors.length],
            });
          }
        }
      }

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];

        spark.life -= delta * 0.7;
        spark.x += spark.vx * delta;
        spark.y += spark.vy * delta;
        spark.vy += 140 * delta;

        if (spark.life <= 0) {
          sparks.splice(index, 1);
          continue;
        }

        context.globalAlpha = spark.life;
        context.fillStyle = spark.color;
        context.fillRect(spark.x, spark.y, 5, 8);
      }

      context.globalAlpha = 1;

      if (!reduced) frame = requestAnimationFrame(draw);
    };

    const restart = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;

      if (visible && !document.hidden) {
        frame = requestAnimationFrame(draw);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const rect = host.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / width - 0.5;
      pointerY = (event.clientY - rect.top) / height - 0.5;
    };

    const onPointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };

    const onPreferenceChange = () => {
      reduced = preference.matches;
      sparks.length = 0;
      restart();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      restart();
    });

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        restart();
      },
      { threshold: 0 },
    );

    resize();
    resizeObserver.observe(host);
    intersectionObserver.observe(host);

    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", restart);
    preference.addEventListener("change", onPreferenceChange);

    restart();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", restart);
      preference.removeEventListener("change", onPreferenceChange);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={styles.atmosphere} aria-hidden="true" />
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Lock, X } from "lucide-react";

import { useReducedMotion } from "@/components/hero/use-reduced-motion";
import type { Achievement } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import styles from "./card-wall.module.css";
import { CardFace, rarityClass } from "./wall-card";

/** Timings from HANDOFF.md §3. */
const OPEN_MS = 500;
const CLOSE_MS = 400;
const OPEN_EASING = "cubic-bezier(0.2, 0.85, 0.25, 1)";
const CLOSE_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

export interface ZoomTarget {
  achievement: Achievement;
  /** Where the card grows from and returns to: a wall card or a button. */
  source: HTMLElement;
  /** Hide the source while zoomed (a wall card), or leave it (a button). */
  hideSource: boolean;
}

export interface CardZoomProps {
  target: ZoomTarget;
  locked: boolean;
  /** A line above the card, such as the claim reveal's heading. */
  heading?: ReactNode;
  /** Buttons under an unlocked card, such as Share. */
  actions?: ReactNode;
  /** A last line under everything, such as the free-claim counter. */
  footnote?: ReactNode;
  /** Called once the close animation has finished. */
  onClosed: () => void;
}

/** The transform that puts the zoomed card exactly over its source. */
function transformFromSource(source: HTMLElement, card: HTMLElement): string {
  const from = source.getBoundingClientRect();
  const to = card.getBoundingClientRect();
  const scale = Math.max(0.12, from.width / to.width);
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);

  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
}

function focusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  );
}

/**
 * A card zoomed from its place on the wall to the centre of the screen
 * (HANDOFF.md §3). It grows from the source's exact position and size, and
 * returns there on close: the X, a click on the scrim, or Escape. Focus moves
 * into the card and back to where it was. With reduced motion it opens and
 * closes without animation.
 */
export function CardZoom({
  target,
  locked,
  heading,
  actions,
  footnote,
  onClosed,
}: CardZoomProps) {
  const { achievement, source, hideSource } = target;
  const reducedMotion = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const closing = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  // Open: start the big card over the source, then let it grow to the centre.
  useLayoutEffect(() => {
    const card = cardRef.current;

    if (!card) return;

    // Kept from the first run, since development runs this effect twice.
    returnFocus.current ??= document.activeElement;

    if (hideSource) source.style.visibility = "hidden";

    if (!reducedMotion) {
      card.style.transition = "none";
      card.style.transform = transformFromSource(source, card);
      card.getBoundingClientRect();
      card.style.transition = `transform ${OPEN_MS}ms ${OPEN_EASING}`;
      card.style.transform = "none";
    }

    closeRef.current?.focus({ preventScroll: true });

    return () => {
      source.style.visibility = "";
    };
    // Runs once per opened card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const close = useCallback(() => {
    const card = cardRef.current;

    if (closing.current) return;
    closing.current = true;

    const finish = () => {
      source.style.visibility = "";

      const back = returnFocus.current;

      // Back to where focus was. Wall cards are out of the tab order but
      // still focusable, so a keyboard user lands where they started.
      if (back instanceof HTMLElement && back.isConnected) {
        back.focus({ preventScroll: true });
      }
      onClosed();
    };

    if (reducedMotion || !card) {
      finish();
      return;
    }

    setIsClosing(true);
    card.style.transition = "none";
    card.style.transform = "none";
    const to = transformFromSource(source, card);

    card.getBoundingClientRect();
    card.style.transition = `transform ${CLOSE_MS}ms ${CLOSE_EASING}`;
    card.style.transform = to;
    window.setTimeout(finish, CLOSE_MS);
  }, [onClosed, reducedMotion, source]);

  // Escape closes; Tab stays inside the zoomed card.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab" || !overlayRef.current) return;

      const items = focusable(overlayRef.current);
      const first = items[0];
      const last = items[items.length - 1];

      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!overlayRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <div
      ref={overlayRef}
      className={cn(styles.overlay, isClosing && styles.overlayClosing)}
      data-card-zoom
    >
      {/* The scrim is for pointers; keyboard users have the X and Escape. */}
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close and go back to the wall"
        tabIndex={-1}
        onClick={close}
      />
      <div className={styles.zoomWrap}>
        {heading && (
          <p className={cn(styles.zoomExtra, styles.zoomHeading)}>{heading}</p>
        )}
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            styles.zoomCard,
            rarityClass(achievement.type),
            locked && styles.locked,
          )}
        >
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={close}
          >
            <X className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
          <CardFace
            achievement={achievement}
            locked={locked}
            iconSize={176}
            titleId={titleId}
            descriptionId={descriptionId}
          />
        </div>
        {locked ? (
          <p className={cn(styles.zoomExtra, styles.lockedNote)}>
            <Lock className="size-[18px]" aria-hidden />
            Locked. Unlock it to share it.
          </p>
        ) : (
          actions && <div className={styles.zoomExtra}>{actions}</div>
        )}
        {footnote && (
          <p
            className={cn(
              styles.zoomExtra,
              "text-[15px] font-bold text-gray-600",
            )}
          >
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}

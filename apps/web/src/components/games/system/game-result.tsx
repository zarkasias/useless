import type { ReactNode } from "react";

import GameButton from "@/components/games/system/game-button";

interface GameResultProps {
  eyebrow: string;
  title: string;
  description?: string;
  stats?: ReactNode;
  children?: ReactNode;

  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;

  secondaryActionLabel?: string;
  secondaryActionIcon?: ReactNode;
  onSecondaryAction?: () => void;
}

export default function GameResult({
  eyebrow,
  title,
  description,
  stats,
  children,

  actionLabel = "Play again",
  actionIcon,

  secondaryActionLabel,
  secondaryActionIcon,
  onSecondaryAction,
  onAction,
}: GameResultProps) {
  return (
    <div
      className="
        relative
        mx-auto
        max-w-xl
        overflow-hidden
        rounded-xl
        border
        border-amber-300/50
        bg-black/30
        p-6
        text-center
        shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.2)]
        backdrop-blur-md
      "
    >
      {/* subtle gold glow */}
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

      <div className="pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative">
        <div
          className="
            text-[10px]
            font-black
            uppercase
            tracking-[0.2em]
            text-amber-200/70
          "
        >
          {eyebrow}
        </div>

        <h2
          className="
            mt-2
            text-2xl
            font-black
            tracking-tight
            text-amber-50
            sm:text-3xl
          "
        >
          {title}
        </h2>

        {description && (
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-emerald-50/70">
            {description}
          </p>
        )}

        {stats && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {stats}
          </div>
        )}

        {children && <div className="mt-5">{children}</div>}

        {(onAction || onSecondaryAction) && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {onAction && (
              <GameButton onClick={onAction} icon={actionIcon}>
                {actionLabel}
              </GameButton>
            )}

            {onSecondaryAction && secondaryActionLabel && (
              <GameButton
                onClick={onSecondaryAction}
                icon={secondaryActionIcon}
                variant="secondary"
              >
                {secondaryActionLabel}
              </GameButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import Image from "next/image";
import type { GameCardTheme } from "./game-card-themes";
import { LockKeyhole, Sparkles } from "lucide-react";

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  iconAlt?: string;
  available?: boolean;
  subscribed: boolean;
  footerText?: string;
  theme: GameCardTheme;
}

export default function GameCabinetCard({
  title,
  description,
  icon,
  iconAlt,
  subscribed,
  available = false,
  footerText = "More Pointless fun incoming",
  theme,
}: GameCardProps) {
  const showSoon = !available;
  const showPro = available && !subscribed;
  return (
    <div
      className={`
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        bg-gradient-to-br
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
        ${theme.border}
        ${theme.gradient}
        ${theme.hoverShadow}
      `}
    >
      <div
        className={`
          absolute -right-10 -top-10
          size-36 rounded-full blur-3xl
          ${theme.glow}
        `}
      />

      <div className="relative flex gap-5 p-5">
        <div
          className={`
            flex
            size-24
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            shadow-inner
            transition-transform
            duration-300
            group-hover:-rotate-3
            group-hover:scale-105
            ${theme.iconGradient}
          `}
        >
          <Image
            src={icon}
            alt={iconAlt ?? title}
            width={98}
            height={98}
            className="size-24 object-contain drop-shadow-md"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`
              mb-2
              inline-flex
              rounded-full
              px-2.5
              py-1
              ${available ? "gap-1.5" : "gap-0"}
              text-[10px]
              font-black
              uppercase
              tracking-wide
              ${theme.badgeBackground}
              ${theme.badgeText}
            `}
          >
            {available && <Sparkles className="size-3" />}
            {available ? "Ready To Play" : "Coming soon"}
          </div>

          <h3
            className={`
              text-xl font-black tracking-tight
              ${theme.titleText}
            `}
          >
            {title}
          </h3>

          <p className="mt-2 text-sm leading-4 tracking-tight text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div
        className={`
          relative
          flex
          items-center
          justify-between
          border-t
          px-5
          py-3
          ${theme.footerBorder}
          ${theme.footerBackground}
        `}
      >
        <span
          className={`
            text-xs font-semibold
            ${theme.footerText}
          `}
        >
          {footerText}
        </span>

        {showSoon && (
          <div className="flex items-center gap-1 px-2.5 text-xs font-bold text-muted-foreground">
            <LockKeyhole className="size-3.5" />
            Soon
          </div>
        )}
        {showPro && (
          <div className="flex items-center gap-1 px-2.5 text-xs font-black text-muted-foreground">
            <LockKeyhole className="size-3.5" />
            Pro
          </div>
        )}
      </div>
    </div>
  );
}

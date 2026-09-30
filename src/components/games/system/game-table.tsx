import type { ReactNode } from "react";

interface GameTableProps {
  children: ReactNode;
  className?: string;
  compactMobile?: boolean;
}

export function GameTable({ children, className = "", compactMobile = false }: GameTableProps) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-lg
        ${compactMobile ? "border-2 md:border-[6px]" : "border-[6px]"}
        border-amber-950
        bg-gradient-to-br
        from-emerald-700
        via-emerald-800
        to-green-950
        ${compactMobile ? "p-2 md:p-7" : "p-5 sm:p-7"}
        shadow-[inset_0_0_35px_rgba(0,0,0,0.35),0_8px_24px_rgba(0,0,0,0.18)]
        ${className}
      `}
    >
      {/* Felt texture */}
      <div
        className={`
          pointer-events-none
          absolute
          inset-0
          opacity-[0.07]
          [background-image:radial-gradient(circle_at_center,white_0.6px,transparent_0.7px)]
          [background-size:5px_5px]
        `}
      />

      {/* Soft overhead table lighting */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent" />

      {/* Felt depth */}
      <div className="pointer-events-none absolute -left-20 top-1/3 size-56 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-20 bottom-0 size-64 rounded-full bg-black/20 blur-3xl" />

      {/* Gold inset rail */}
      <div
        className={`
          pointer-events-none
          absolute
          ${compactMobile ? "hidden md:block" : ""}
          inset-2
          rounded-md
          border-4
          border-amber-400/70
          shadow-[inset_0_0_0_1px_rgba(120,53,15,0.7),0_0_8px_rgba(251,191,36,0.18)]
        `}
      />

      {/* Secondary fine gold line */}
      <div
        className={`
          pointer-events-none
          absolute
          ${compactMobile ? "hidden md:block" : ""}
          inset-[11px]
          rounded-md
          border
          border-amber-200/30
        `}
      />

      <div className="relative space-y-5 pb-5">{children}</div>
    </div>
  );
}

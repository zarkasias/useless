import type { ReactNode } from "react";

interface GameResultOverlayProps {
  children: ReactNode;
  className?: string;
}

export default function GameResultOverlay({
  children,
  className = "",
}: GameResultOverlayProps) {
  return (
    <div
      className={`
        absolute
        inset-0
        z-20
        flex
        items-center
        justify-center
        p-5
        bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.5)_58%,rgba(0,0,0,0.18)_80%,transparent_100%)]
        animate-in
        fade-in-0
        duration-300
        sm:p-8
        ${className}
      `}
    >
      <div className="w-full max-w-xl animate-in zoom-in-95 duration-300">
        {children}
      </div>
    </div>
  );
}

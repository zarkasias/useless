import type { ReactNode } from "react";

interface GameResultOverlayProps {
  children: ReactNode;
  variant?: "default" | "transparent";
  className?: string;
}

export default function GameResultOverlay({
  children,
  className = "",
  variant = "default",
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
         ${
           variant === "transparent"
             ? "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.12)_65%,transparent_100%)]"
             : "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.5)_58%,rgba(0,0,0,0.18)_80%,transparent_100%)]"
         }
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

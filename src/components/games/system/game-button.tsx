import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface GameButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export default function GameButton({
  children,
  onClick,
  disabled = false,
  icon,
}: GameButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className="
        h-9
        rounded-md
        border
        border-amber-300/40
        bg-black/25
        px-3
        font-black
        text-amber-100
        shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.18)]
        backdrop-blur-sm
        transition-all
        hover:border-amber-300/70
        hover:bg-black/35
        hover:text-amber-50
        active:translate-y-px
        disabled:pointer-events-none
        disabled:opacity-40
      "
    >
      {icon && (
        <span className="mr-2 flex size-4 items-center justify-center">
          {icon}
        </span>
      )}

      {children}
    </Button>
  );
}

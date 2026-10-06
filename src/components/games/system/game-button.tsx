import type { ReactNode, ComponentProps } from "react";

import { Button } from "@/components/ui/button";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

interface GameButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: ReactNode;
  size?: ButtonSize;
}

export default function GameButton({
  children,
  onClick,
  disabled = false,
  variant = "ghost",
  size = "xs",
  icon,
}: GameButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size ? size : "xs"}
      disabled={disabled}
      onClick={onClick}
      className="
        h-9
        rounded-md
        border
        border-amber-300/40
        bg-black/25
        px-3
        text-xs
        sm:text-sm
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
        <span className="mr-1 md:mr-2 flex size-4 items-center justify-center">
          {icon}
        </span>
      )}

      {children}
    </Button>
  );
}

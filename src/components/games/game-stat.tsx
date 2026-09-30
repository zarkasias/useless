import type { ReactNode } from "react";

interface GameStatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export default function GameStat({ label, value, icon }: GameStatProps) {
  return (
    <div className="min-w-0 sm:min-w-[80px] border-r px-1 py-1 sm:px-3 sm:py-3 text-center last:border-r-0">
      <div className="flex items-center justify-center gap-1 text-sm sm:text-lg font-black text-gray-700">
        {icon}
        <span className="min-w-0 break-all tabular-nums">{value}</span>
      </div>

      <div className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

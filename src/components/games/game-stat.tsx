import type { ReactNode } from "react";

interface GameStatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export default function GameStat({ label, value, icon }: GameStatProps) {
  return (
    <div className="min-w-[88px] border-r px-4 py-3 text-center last:border-r-0">
      <div className="flex items-center justify-center gap-1 text-lg font-black text-gray-700">
        {icon}
        {value}
      </div>

      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

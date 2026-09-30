interface GameMetricProps {
  label: string;
  value: string | number;
}

export default function GameMetric({ label, value }: GameMetricProps) {
  return (
    <div
      className="
        min-w-0 sm:min-w-[82px]
        rounded-md
        border
        border-amber-300/40
        bg-black/25
        px-1.5 sm:px-3
        py-1 sm:py-2
        text-center
        shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.18)]
        backdrop-blur-sm
      "
    >
      <div
        className="
          text-base sm:text-lg
          font-black
          leading-none
          text-amber-100
          drop-shadow-sm
        "
      >
        {value}
      </div>

      <div
        className="
          mt-1
          text-[9px]
          font-black
          uppercase
          tracking-wide sm:tracking-[0.14em]
          text-amber-200/70
        "
      >
        {label}
      </div>
    </div>
  );
}

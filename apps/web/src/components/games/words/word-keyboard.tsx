import { Delete } from "lucide-react";
import type { LetterStatus } from "@/lib/games/words/word-rules";
import { letterStyles } from "./word-board";

interface WordKeyboardProps {
  statuses: Partial<Record<string, LetterStatus>>;
  disabled: boolean;
  onInput: (key: string) => void;
}

export function WordKeyboard({ statuses, disabled, onInput }: WordKeyboardProps) {
  return (
    <div role="group" aria-label="On-screen keyboard" className="mx-auto w-full max-w-lg space-y-1.5">
      {["QWERTYUIOP".split(""), "ASDFGHJKL".split(""), ["Enter", ..."ZXCVBNM".split(""), "Backspace"]].map((row, index) => (
        <div key={index} className="flex justify-center gap-0.5 sm:gap-1">
          {row.map((key) => {
            const status = statuses[key];
            const action = key.length > 1;
            const label = key === "Backspace" ? "Delete" : key;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                aria-label={status ? `${label}, ${status}` : label}
                onClick={() => onInput(key)}
                className={`min-h-11 min-w-0 rounded-md border px-0.5 text-xs font-black shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:px-2 sm:text-sm ${action ? "flex-[1.5]" : "flex-1 max-w-11"} ${status ? letterStyles[status] : "border-amber-200 bg-slate-800 text-amber-100"} ${disabled ? "cursor-default" : "hover:border-amber-50"}`}
              >
                {key === "Backspace" ? <Delete aria-hidden="true" className="mx-auto size-4" /> : label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

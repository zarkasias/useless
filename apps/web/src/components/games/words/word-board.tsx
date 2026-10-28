import {
  MAX_GUESSES,
  WORD_LENGTH,
  type EvaluatedGuess,
  type LetterStatus,
} from "@/lib/games/words/word-rules";

// Shared by tiles and keys so a scored letter always has the same treatment.
export const letterStyles: Record<LetterStatus, string> = {
  correct: "border-emerald-300 bg-emerald-700 text-white",
  present: "border-amber-200 bg-amber-300 text-amber-950",
  absent: "border-slate-400 bg-slate-700 text-white",
};

interface WordBoardProps {
  evaluations: readonly EvaluatedGuess[];
  draft: string;
  playing: boolean;
}

export function WordBoard({ evaluations, draft, playing }: WordBoardProps) {
  return (
    <div role="table" aria-label="Six guesses of five letters" className="mx-auto w-full max-w-xs space-y-1.5">
      {Array.from({ length: MAX_GUESSES }, (_, row) => {
        const evaluation = evaluations[row];
        const active = playing && row === evaluations.length;
        return (
          <div key={row} role="row" aria-label={`Guess ${row + 1}`} className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: WORD_LENGTH }, (_, column) => {
              const scored = evaluation?.letters[column];
              const letter = scored?.letter ?? (active ? draft[column] : "") ?? "";
              const status = scored?.status ?? (letter ? "not submitted" : "empty");
              return (
                <span
                  key={column}
                  role="cell"
                  aria-label={`Letter ${column + 1}: ${letter || "empty"}, ${status}`}
                  className={`flex aspect-square min-w-0 items-center justify-center rounded-md border-2 text-xl font-black sm:text-2xl ${scored ? letterStyles[scored.status] : "bg-slate-800 text-slate-100"} ${scored ? "" : active ? "border-amber-200" : "border-slate-400"}`}
                >
                  <span aria-hidden="true">{letter}</span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Info, Settings } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GameButton from "../../system/game-button";

import type { SpiderDifficulty } from "@/lib/games/solitaire/spider/spider-types";

interface SpiderSettingsProps {
  difficulty: SpiderDifficulty;
  onStartGame: (difficulty: SpiderDifficulty) => void;
}

export function SpiderSettings({
  difficulty,
  onStartGame,
}: SpiderSettingsProps) {
  const [open, setOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<SpiderDifficulty>(difficulty);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setSelectedDifficulty(difficulty);
        }

        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-amber-300/40 bg-black/25 px-3 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-300/70 hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          <Settings className="size-4" aria-hidden="true" />
          <span>Change difficulty</span>
        </button>
      </DialogTrigger>

      <DialogContent className="border-amber-300/30 bg-emerald-950 text-amber-100">
        <DialogHeader>
          <DialogTitle>Change difficulty</DialogTitle>
          <DialogDescription className="text-emerald-100/80">
            More suits make the game harder. Starting a new game applies your
            selection and replaces your current game.
          </DialogDescription>
        </DialogHeader>

        <label className="grid gap-2 text-sm font-semibold">
          Difficulty
          <select
            value={selectedDifficulty}
            onChange={(event) => {
              const value = Number(event.target.value);

              if (value === 1 || value === 2 || value === 4) {
                setSelectedDifficulty(value);
              }
            }}
            className="rounded-md border border-amber-300/40 bg-emerald-900 px-3 py-2 text-amber-100"
          >
            <option value={1}>1 suit — Easy</option>
            <option value={2}>2 suits — Medium</option>
            <option value={4}>4 suits — Hard</option>
          </select>
        </label>

        <div className="flex justify-end">
          <GameButton
            onClick={() => {
              onStartGame(selectedDifficulty);
              setOpen(false);
            }}
          >
            Start New Game
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SpiderInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-black/25 focus-visible:outline-none focus-visibe:ring-2 focus-visible:ring-amber-200"
        >
          <Info className="size-4" aria-hidden="true" />
          <span>How to play</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-amber-300/30 bg-emerald-950/90 text-amber-100">
        <DialogHeader>
          <DialogTitle>How to play Spider Solitaire</DialogTitle>
          <DialogDescription className="text-emerald-100/80">
            Complete eight runs of cards from King down to Ace, all in the same
            suit.
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-2 pl-5 text-xs md:text-sm leading-relaxed text-emerald-100">
          <li>Place a card on a card one rank higher, regardless of suit.</li>
          <li>
            Move a group together when its cards descend in order and share the
            same suit.
          </li>
          <li>Any face-up card or valid group can move to an empty column.</li>
          <li>
            Select the stock to deal another row. Use Hint for a suggested move
            or Undo to take back a move.
          </li>
        </ul>

        <div className="rounded-md border border-amber-300/25 bg-black/20 p-3 text-sm leading-relaxed">
          <p className="font-semibold">Want an easier or harder game?</p>
          <div className="text-xs md:text-sm mt-1 text-emerald-100">
            Select Change difficulty above the cards:
            <ul className="py-2 list-disc space-y-1 pl-3 leading-relaxed">
              <li> 1 suit is Easy</li>
              <li>2 suits is Medium</li>
              <li>4 suits is Hard.</li>
            </ul>
            Your selection applies when you start a new game.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

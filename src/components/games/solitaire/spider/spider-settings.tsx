"use client";

import { useState } from "react";
import { Settings } from "lucide-react";

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
          aria-label="Spider settings"
          className="flex size-11 items-center justify-center text-amber-100"
        >
          <Settings className="size-5" aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent className="border-amber-300/30 bg-emerald-950 text-amber-100">
        <DialogHeader>
          <DialogTitle>Spider settings</DialogTitle>
          <DialogDescription className="text-emerald-100/80">
            Choose a variant. Starting a new game replaces your current game.
          </DialogDescription>
        </DialogHeader>

        <label className="grid gap-2 text-sm font-semibold">
          Game variant
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

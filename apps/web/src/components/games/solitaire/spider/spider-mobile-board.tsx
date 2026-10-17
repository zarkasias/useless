"use client";

import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";
import type { SpiderHint } from "@/lib/games/solitaire/spider/spider-hint";

import GameButton from "../../system/game-button";
import MobileCard from "../shared/mobile-card";
import { getSuitSymbol } from "../shared/card-display-utils";
import { useSpiderMobileInteractions } from "./use-spider-mobile-interactions";

interface SpiderMobileBoardProps {
  board: SpiderBoardState;
  onMove: (board: SpiderBoardState) => boolean;
  onStockTap: () => void;
  canDeal: boolean;
  hint: SpiderHint | null;
  hintFading?: boolean;
}

export function SpiderMobileBoard({
  board,
  onMove,
  onStockTap,
  canDeal,
  hint,
  hintFading = false,
}: SpiderMobileBoardProps) {
  const mobile = useSpiderMobileInteractions({ board, onMove });

  const visibleHint = mobile.pendingSource ? null : hint;

  const buttonClass =
    "relative block w-full rounded-md touch-manipulation select-none " +
    "focus-visible:outline-2 focus-visible:outline-amber-300";

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div
          className="grid grid-cols-8 gap-1"
          role="group"
          aria-label="Completed runs"
        >
          {Array.from({ length: 8 }, (_, index) => {
            const run = board.completedRuns[index];

            return (
              <span
                key={index}
                aria-label={`Run ${index + 1}: ${
                  run ? `${run.suit} complete` : "empty"
                }`}
                className={`flex h-9 w-7 items-center justify-center rounded border ${
                  run
                    ? "border-amber-300 bg-white"
                    : "border-dashed border-white/30 text-white/40"
                } ${
                  run?.suit === "hearts" || run?.suit === "diamonds"
                    ? "text-red-700"
                    : run
                      ? "text-slate-900"
                      : ""
                }`}
              >
                {run ? getSuitSymbol(run.suit) : index + 1}
              </span>
            );
          })}
        </div>

        <div
          className={`rounded-md transition-shadow duration-500 motion-reduce:transition-none ${
            visibleHint?.type === "deal-stock" && !hintFading ? "ring-2 ring-amber-300" : ""
          }`}
        >
          {/* {visibleHint?.type === "deal-stock" && (
            <span className="pointer-events-none absolute -top-5 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-black shadow">
              Deal
            </span>
          )} */}
          <GameButton
            disabled={!canDeal}
            onClick={() => {
              mobile.clearPendingMove();
              onStockTap();
            }}
          >
            Deal ({board.stock.length / 10})
          </GameButton>
        </div>
      </div>

      <div className="w-full min-w-0 pb-3">
        <div className="grid w-full min-w-0 grid-cols-10 items-start gap-px">
          {board.tableau.map((column, columnIndex) => {
            const isTarget = mobile.pendingDestinations.includes(columnIndex);
            const isHintTarget =
              visibleHint?.type === "tableau-to-tableau" &&
              visibleHint.targetColumnIndex === columnIndex;

            return (
              <div key={columnIndex} className="relative min-w-0">
                {isHintTarget && (
                  <span style={{ opacity: hintFading ? 0 : 1 }} className="transition-opacity duration-500 motion-reduce:transition-none pointer-events-none absolute -top-2 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-300 px-2 py-0.5 text-[9px] font-bold text-emerald-950 shadow">
                    Here
                  </span>
                )}
                <button
                  type="button"
                  disabled={!isTarget}
                  aria-label={`Move to column ${columnIndex + 1}`}
                  onClick={() => mobile.handleDestinationTap(columnIndex)}
                  className={`mb-1 min-h-10 w-full rounded text-xs font-bold ${
                    isTarget
                      ? "bg-emerald-300 text-emerald-950"
                      : "text-emerald-100/60"
                  }`}
                >
                  {columnIndex + 1}
                  {isTarget ? " ↓" : ""}
                </button>

                <div
                  className={`rounded-md transition-shadow duration-500 motion-reduce:transition-none ${
                    isTarget || (isHintTarget && !hintFading)
                      ? "ring-2 ring-inset ring-emerald-300"
                      : ""
                  }`}
                >
                  {column.length === 0 ? (
                    <button
                      type="button"
                      disabled={!isTarget}
                      aria-label={`Empty column ${columnIndex + 1}`}
                      onClick={() => mobile.handleDestinationTap(columnIndex)}
                      className={`${buttonClass} aspect-[5/7] border border-dashed border-white/30 bg-black/10 text-emerald-100`}
                    >
                      {isTarget ? "↓" : ""}
                    </button>
                  ) : (
                    column.map((card, cardIndex) => {
                      const selected =
                        mobile.pendingSource?.columnIndex === columnIndex &&
                        cardIndex >= mobile.pendingSource.cardIndex;

                      const isHintSource =
                        visibleHint?.type === "tableau-to-tableau" &&
                        visibleHint.sourceColumnIndex === columnIndex &&
                        cardIndex >= visibleHint.cardIndex;

                      const isHintStartCard =
                        visibleHint?.type === "tableau-to-tableau" &&
                        visibleHint.sourceColumnIndex === columnIndex &&
                        cardIndex === visibleHint.cardIndex;

                      return (
                        <div
                          key={card.id}
                          className="relative"
                          style={{
                            height:
                              cardIndex === column.length - 1
                                ? "auto"
                                : card.faceUp
                                  ? 24
                                  : 16,
                          }}
                        >
                          {isHintStartCard && (
                            <span style={{ opacity: hintFading ? 0 : 1 }} className="transition-opacity duration-500 motion-reduce:transition-none pointer-events-none absolute -top-2 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-bold text-black shadow">
                              Move
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={!card.faceUp}
                            aria-pressed={selected}
                            aria-label={`${
                              card.faceUp
                                ? `${card.rank} of ${card.suit}`
                                : "Face-down card"
                            }, column ${columnIndex + 1}`}
                            onClick={() =>
                              mobile.handleTableauCardTap(
                                columnIndex,
                                cardIndex,
                              )
                            }
                            className={`${buttonClass} transition-shadow duration-500 motion-reduce:transition-none ${
                              selected || (isHintSource && !hintFading)
                                ? "ring-2 ring-inset ring-amber-300"
                                : ""
                            }`}
                          >
                            <MobileCard card={card} isSpider={true} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

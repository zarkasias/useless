import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";
import { useKlondikeMobileInteractions } from "./use-klondike-mobile-interactions";
import { getSuitSymbol } from "../shared/card-display-utils";
import { useMobileCardMotion } from "./use-mobile-card-motion";
import MobileCard from "../shared/mobile-card";

import type { KlondikeHint } from "@/lib/games/solitaire/klondike/klondike-hint";

import {
  isHintFoundationTarget,
  isHintStock,
  isHintTableauTarget,
  isHintWasteSource,
} from "@/lib/games/solitaire/klondike/klondike-hint-display";

interface KlondikeMobileBoardProps {
  board: KlondikeBoardState;
  onMove: (board: KlondikeBoardState) => void;
  onStockTap: () => void;
  autoFinishCardId?: string | null;
  hint: KlondikeHint | null;
}

export function KlondikeMobileBoard({
  board,
  onMove,
  onStockTap,
  autoFinishCardId,
  hint,
}: KlondikeMobileBoardProps) {
  const boardRef = useMobileCardMotion(board);
  const mobile = useKlondikeMobileInteractions({ board, onMove });
  const slot =
    "aspect-[5/7] w-full rounded-md border border-dashed border-white/30 bg-black/10 flex items-center justify-center text-emerald-100/60";
  const button =
    "relative block w-full min-w-0 rounded-md touch-manipulation select-none focus-visible:outline-2 focus-visible:outline-amber-300";
  const target = (columnIndex: number) =>
    mobile.pendingDestinations.some(
      (d) => d.type === "tableau" && d.columnIndex === columnIndex,
    ) || isHintTableauTarget(hint, columnIndex);

  const waste = board.waste[board.waste.length - 1];

  return (
    <div
      ref={boardRef}
      className="mx-auto w-full max-w-[560px] min-h-[400px] min-w-0 space-y-3"
    >
      <div className="grid grid-cols-7 items-end gap-1">
        {board.foundations.map((foundation, index) => {
          const card = foundation.cards[foundation.cards.length - 1];
          return (
            <div key={foundation.suit}>
              <button
                type="button"
                data-mobile-card-id={card?.id}
                aria-label={`${foundation.suit} foundation${card ? `, ${card.rank}` : ", empty"}`}
                className={`${button} 
                ${
                  mobile.pendingSource?.type === "foundation" &&
                  mobile.pendingSource.foundationIndex === index
                    ? "ring-2 ring-amber-300"
                    : ""
                }
                 ${
                   isHintFoundationTarget(hint, index)
                     ? "ring-2 ring-emerald-300 ring-offset-2 ring-offset-emerald-900"
                     : ""
                 }
                `}
                onClick={() => mobile.handleFoundationTap(index)}
              >
                {card ? (
                  <MobileCard
                    card={card}
                    active={card.id === autoFinishCardId}
                  />
                ) : (
                  <span className={slot}>{getSuitSymbol(foundation.suit)}</span>
                )}
              </button>
            </div>
          );
        })}
        <div aria-hidden="true" />

        <div>
          <div className="mb-1 text-center text-[9px] font-bold uppercase text-emerald-100/70">
            Waste
          </div>
          <button
            type="button"
            data-mobile-card-id={waste?.id}
            disabled={!waste}
            aria-label={
              waste
                ? `Move ${waste.rank} of ${waste.suit} from waste`
                : "Empty waste"
            }
            className={`${button} 
            ${
              mobile.pendingSource?.type === "waste"
                ? "ring-2 ring-amber-300"
                : ""
            }
               ${
                 isHintWasteSource(hint)
                   ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900"
                   : ""
               }
              `}
            onClick={mobile.handleWasteTap}
          >
            {waste ? <MobileCard card={waste} /> : <span className={slot} />}
          </button>
        </div>

        <div>
          <div className="mb-1 text-center text-[9px] font-bold uppercase text-emerald-100/70">
            Stock
          </div>
          <button
            type="button"
            data-mobile-card-id={board.stock[board.stock.length - 1]?.id}
            aria-label={board.stock.length ? "Draw a card" : "Recycle waste"}
            className={`${button}
              ${
                isHintStock(hint)
                  ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900"
                  : ""
              }
            `}
            onClick={() => {
              mobile.clearPendingMove();
              onStockTap();
            }}
          >
            {board.stock.length ? (
              <MobileCard
                card={{ ...board.stock[board.stock.length - 1], faceUp: false }}
              />
            ) : (
              <span className={slot}>↻</span>
            )}
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 items-start gap-1 pb-2">
        {board.tableau.map((column, columnIndex) => {
          const hintedTarget = target(columnIndex);

          return (
            <div
              key={columnIndex}
              className={`
          min-w-0
          rounded-md
          ${
            hintedTarget
              ? "ring-2 ring-emerald-300 ring-offset-2 ring-offset-emerald-900"
              : ""
          }
        `}
            >
              {column.length === 0 ? (
                <button
                  type="button"
                  className={`${button} ${slot}`}
                  aria-label={`Empty column ${columnIndex + 1}`}
                  onClick={() =>
                    mobile.handleDestinationTap({
                      type: "tableau",
                      columnIndex,
                    })
                  }
                >
                  {hintedTarget ? "↓" : ""}
                </button>
              ) : (
                column.map((card, cardIndex) => {
                  const selected =
                    mobile.pendingSource?.type === "tableau" &&
                    mobile.pendingSource.columnIndex === columnIndex &&
                    cardIndex >= mobile.pendingSource.cardIndex;

                  const hinted =
                    (hint?.type === "tableau-to-tableau" ||
                      hint?.type === "tableau-to-foundation") &&
                    hint.sourceColumnIndex === columnIndex &&
                    cardIndex >= hint.cardIndex;

                  return (
                    <div
                      key={card.id}
                      style={{
                        height:
                          cardIndex === column.length - 1
                            ? "auto"
                            : card.faceUp
                              ? 28
                              : 18,
                      }}
                    >
                      <button
                        type="button"
                        data-mobile-card-id={card.id}
                        disabled={!card.faceUp}
                        aria-label={`${
                          card.faceUp
                            ? `${card.rank} of ${card.suit}`
                            : "Face-down card"
                        }, column ${columnIndex + 1}`}
                        aria-pressed={selected}
                        className={`
                    ${button}
                    ${selected ? "ring-2 ring-amber-300" : ""}
                    ${hinted ? "ring-2 ring-amber-300" : ""}
                  `}
                        onClick={() =>
                          mobile.handleTableauCardTap(columnIndex, cardIndex)
                        }
                      >
                        <MobileCard
                          card={card}
                          active={card.id === autoFinishCardId}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

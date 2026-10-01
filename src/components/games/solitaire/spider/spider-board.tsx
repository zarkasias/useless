"use client";

import type { SpiderBoardState } from "@/lib/games/solitaire/spider/spider-types";
import type { useSpiderInteractions } from "./use-spider-interactions";

import { CardColumn } from "../shared/card-column";
import { CardPile } from "../shared/card-pile";

interface SpiderBoardProps {
  board: SpiderBoardState;
  interactions: ReturnType<typeof useSpiderInteractions>;
}

export function SpiderBoard({ board, interactions }: SpiderBoardProps) {
  const {
    canDeal,
    handleStockClick,
    selectedTableauCard,
    handleTableauClick,
    handleTableauCardClick,
    isValidTableauTarget,
  } = interactions;

  return (
    <div className="w-full overflow-x-auto pb-3">
      <div className="min-w-[760px] space-y-6 px-2">
        <div className="flex items-start justify-between gap-6">
          <div className="flex gap-3">
            {Array.from({ length: 8 }, (_, index) => {
              const run = board.completedRuns[index];

              return (
                <CardPile
                  key={index}
                  label={`Run ${index + 1}`}
                  card={run?.cards[0] ?? null}
                />
              );
            })}
          </div>

          <CardPile
            label="Stock"
            card={board.stock[0] ?? null}
            faceDown
            onClick={canDeal ? handleStockClick : undefined}
          />
        </div>

        <div className="grid grid-cols-10 gap-2">
          {board.tableau.map((column, columnIndex) => (
            <CardColumn
              key={columnIndex}
              cards={column}
              cardOffset={28}
              minHeight={Math.max(
                340,
                Math.max(0, column.length - 1) * 28 + 96,
              )}
              selectedCardIndex={
                selectedTableauCard?.columnIndex === columnIndex
                  ? selectedTableauCard.cardIndex
                  : null
              }
              validTarget={isValidTableauTarget(columnIndex)}
              onColumnClick={() => handleTableauClick(columnIndex)}
              onCardClick={(cardIndex) =>
                handleTableauCardClick(columnIndex, cardIndex)
              }
              onCardDragStart={(_, event) => event.preventDefault()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

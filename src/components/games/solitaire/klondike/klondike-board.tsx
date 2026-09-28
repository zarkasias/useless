"use client";
import { useKlondikeInteractions } from "./use-klondike-interactions";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";
import { CardPile } from "../shared/card-pile";
import { CardColumn } from "../shared/card-column";

type KlondikeInteractions = ReturnType<typeof useKlondikeInteractions>;

interface KlondikeBoardProps {
  board: KlondikeBoardState;
  interactions: KlondikeInteractions;
}

export function KlondikeBoard({ board, interactions }: KlondikeBoardProps) {
  const {
    selectedCardId,
    setSelectedCardId,

    selectedTableauCard,
    setSelectedTableauCard,

    selectedFoundationIndex,
    setSelectedFoundationIndex,

    flippedCardId,
    handleStockClick,
    handleTableauClick,
    handleFoundationClick,
    handleTableauCardClick,
    isValidTableauTarget,
    isValidFoundationTarget,

    handleTableauDragOver,
    handleTableauDragStart,
    handleTableauDrop,

    handleWasteDragStart,

    handleFoundationDragOver,
    handleFoundationDragStart,
    handleFoundationDrop,
  } = interactions;

  return (
    <div className="w-full overflow-x-auto pb-3">
      <div className="w-full space-y-4 px-1 sm:min-w-[680px] sm:space-y-6 sm:px-6">
        {/* Stock / Waste / Foundations */}
        <div className="flex items-start justify-between gap-6">
          <div className="ml-2 flex gap-2 sm:gap-5">
            {board.foundations.map((foundation, foundationIndex) => (
              <CardPile
                key={foundation.suit}
                label={foundation.suit}
                card={foundation.cards[foundation.cards.length - 1] ?? null}
                selected={selectedFoundationIndex === foundationIndex}
                validTarget={isValidFoundationTarget(foundationIndex)}
                onDragStart={(event) =>
                  handleFoundationDragStart(foundationIndex, event)
                }
                onDragOver={handleFoundationDragOver}
                onDrop={(event) => handleFoundationDrop(foundationIndex, event)}
                onClick={() => {
                  if (selectedCardId || selectedTableauCard) {
                    handleFoundationClick(foundationIndex);
                    return;
                  }

                  if (foundation.cards.length === 0) {
                    handleFoundationClick(foundationIndex);
                    return;
                  }

                  setSelectedFoundationIndex(
                    selectedFoundationIndex === foundationIndex
                      ? null
                      : foundationIndex,
                  );

                  setSelectedCardId(null);
                  setSelectedTableauCard(null);
                }}
              />
            ))}
          </div>
          <div className="flex gap-2 sm:gap-3 sm:mr-14">
            <CardPile
              label="Waste"
              card={board.waste[board.waste.length - 1] ?? null}
              selected={
                board.waste[board.waste.length - 1]?.id === selectedCardId
              }
              animateFlip={
                board.waste[board.waste.length - 1]?.id === flippedCardId
              }
              onDragStart={handleWasteDragStart}
              onClick={() => {
                const topWasteCard = board.waste[board.waste.length - 1];

                if (!topWasteCard) return;

                setSelectedCardId(
                  selectedCardId === topWasteCard.id ? null : topWasteCard.id,
                );

                setSelectedTableauCard(null);
              }}
            />
            <CardPile
              label="Stock"
              card={board.stock[board.stock.length - 1] ?? null}
              faceDown
              onClick={handleStockClick}
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="ml-2 grid grid-cols-7 gap-1 sm:gap-2">
          {board.tableau.map((column, columnIndex) => (
            <CardColumn
              key={columnIndex}
              cards={column}
              flippedCardId={flippedCardId}
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
              onCardDragStart={(cardIndex) =>
                handleTableauDragStart(columnIndex, cardIndex)
              }
              onDragOver={handleTableauDragOver}
              onDrop={(event) => handleTableauDrop(columnIndex, event)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

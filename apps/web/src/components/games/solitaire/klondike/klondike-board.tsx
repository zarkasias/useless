"use client";
import { useKlondikeInteractions } from "./use-klondike-interactions";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";
import type { KlondikeHint } from "@/lib/games/solitaire/klondike/klondike-hint";

import {
  isHintFoundationTarget,
  isHintStock,
  isHintTableauTarget,
  isHintWasteSource,
} from "@/lib/games/solitaire/klondike/klondike-hint-display";

import { CardPile } from "../shared/card-pile";
import { CardColumn } from "../shared/card-column";

type KlondikeInteractions = ReturnType<typeof useKlondikeInteractions>;

interface KlondikeBoardProps {
  board: KlondikeBoardState;
  interactions: KlondikeInteractions;
  autoFinishCardId: string | null;
  hint: KlondikeHint | null;
}

export function KlondikeBoard({
  board,
  interactions,
  autoFinishCardId,
  hint,
}: KlondikeBoardProps) {
  const {
    selectedCardId,
    setSelectedCardId,

    selectedTableauCard,
    setSelectedTableauCard,

    selectedFoundationIndex,
    setSelectedFoundationIndex,

    flippedCardId,
    handleDragEnd,
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
      <div className="w-full space-y-4 px-1 sm:min-w-170 sm:space-y-6 sm:px-6">
        {/* Stock / Waste / Foundations */}
        <div className="flex items-start justify-between gap-6">
          <div className="ml-2 flex gap-2 sm:gap-5">
            {board.foundations.map((foundation, foundationIndex) => {
              const hinted = isHintFoundationTarget(hint, foundationIndex);

              return (
                <div
                  key={foundation.suit}
                  className={
                    hinted
                      ? `
                        rounded-lg
                        ring-2
                        ring-emerald-300
                        ring-offset-2
                        ring-offset-emerald-900
                      `
                      : ""
                  }
                >
                  <CardPile
                    key={foundation.suit}
                    label={foundation.suit}
                    autoFinishCardId={autoFinishCardId}
                    card={foundation.cards[foundation.cards.length - 1] ?? null}
                    selected={selectedFoundationIndex === foundationIndex}
                    validTarget={isValidFoundationTarget(foundationIndex)}
                    onDragEnd={handleDragEnd}
                    onDragStart={(event) =>
                      handleFoundationDragStart(foundationIndex, event)
                    }
                    onDragOver={handleFoundationDragOver}
                    onDrop={(event) =>
                      handleFoundationDrop(foundationIndex, event)
                    }
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
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 sm:gap-3 sm:mr-14">
            <CardPile
              label="Waste"
              isHint={isHintWasteSource(hint)}
              autoFinishCardId={autoFinishCardId}
              card={board.waste[board.waste.length - 1] ?? null}
              selected={
                board.waste[board.waste.length - 1]?.id === selectedCardId
              }
              animateFlip={
                board.waste[board.waste.length - 1]?.id === flippedCardId
              }
              onDragStart={handleWasteDragStart}
              onDragEnd={handleDragEnd}
              onClick={() => {
                const topWasteCard = board.waste[board.waste.length - 1];

                if (!topWasteCard) return;

                setSelectedCardId(
                  selectedCardId === topWasteCard.id ? null : topWasteCard.id,
                );

                setSelectedTableauCard(null);
                setSelectedFoundationIndex(null);
              }}
            />

            {/* Stock */}
            <CardPile
              label="Stock"
              isHint={isHintStock(hint)}
              card={board.stock[board.stock.length - 1] ?? null}
              faceDown
              onClick={handleStockClick}
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="ml-2 grid grid-cols-7 gap-1 sm:gap-2">
          {board.tableau.map((column, columnIndex) => {
            const hintCardIndex =
              (hint?.type === "tableau-to-tableau" ||
                hint?.type === "tableau-to-foundation") &&
              hint.sourceColumnIndex === columnIndex
                ? hint.cardIndex
                : null;

            const hintedTarget = isHintTableauTarget(hint, columnIndex);

            return (
              <CardColumn
                key={columnIndex}
                cards={column}
                autoFinishCardId={autoFinishCardId}
                flippedCardId={flippedCardId}
                hintCardIndex={hintCardIndex}
                hintTarget={hintedTarget}
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
                onDragEnd={handleDragEnd}
                onCardDragStart={(cardIndex, event) =>
                  handleTableauDragStart(columnIndex, cardIndex, event)
                }
                onDragOver={handleTableauDragOver}
                onDrop={(event) => handleTableauDrop(columnIndex, event)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

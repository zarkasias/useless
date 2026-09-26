"use client";
import type { Dispatch, SetStateAction } from "react";
import { useState, useRef, useEffect } from "react";

import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";
import { CardPile } from "../shared/card-pile";
import { CardColumn } from "../shared/card-column";
import {
  drawFromStock,
  recycleWasteToStock,
  moveWasteCardToTableau,
  moveTableauSequence,
  moveWasteCardToFoundation,
  moveTableauCardToFoundation,
  moveFoundationCardToTableau,
} from "@/lib/games/solitaire/klondike/klondike-moves";

import {
  canMoveTableauSequence,
  canPlaceOnEmptyTableau,
  canPlaceOnTableau,
  canPlaceOnFoundation,
} from "@/lib/games/solitaire/klondike/klondike-rules";

interface KlondikeBoardProps {
  board: KlondikeBoardState;
  setBoard: Dispatch<SetStateAction<KlondikeBoardState | null>>;
}

export function KlondikeBoard({ board, setBoard }: KlondikeBoardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTableauCard, setSelectedTableauCard] = useState<{
    columnIndex: number;
    cardIndex: number;
  } | null>(null);
  const [selectedFoundationIndex, setSelectedFoundationIndex] = useState<
    number | null
  >(null);
  const previousFaceUpState = useRef<Map<string, boolean> | null>(null);

  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  useEffect(() => {
    const currentFaceUpState = new Map<string, boolean>();

    const allCards = [
      ...board.stock,
      ...board.waste,
      ...board.foundations.flatMap((foundation) => foundation.cards),
      ...board.tableau.flat(),
    ];

    for (const card of allCards) {
      currentFaceUpState.set(card.id, card.faceUp);
    }

    if (previousFaceUpState.current) {
      const newlyFlippedCard = allCards.find((card) => {
        const wasFaceUp = previousFaceUpState.current?.get(card.id) ?? false;

        return !wasFaceUp && card.faceUp;
      });

      if (newlyFlippedCard) {
        setFlippedCardId(newlyFlippedCard.id);
      }
    }

    previousFaceUpState.current = currentFaceUpState;
  }, [board]);

  const handleStockClick = () => {
    setBoard((currentBoard) => {
      if (!currentBoard) {
        return currentBoard;
      }
      if (currentBoard.stock.length > 0) {
        return drawFromStock(currentBoard);
      }

      return recycleWasteToStock(currentBoard);
    });

    setSelectedCardId(null);
    setSelectedTableauCard(null);
  };

  const handleTableauClick = (columnIndex: number) => {
    if (selectedFoundationIndex !== null) {
      setBoard((currentBoard) => {
        if (!currentBoard) {
          return currentBoard;
        }

        const nextBoard = moveFoundationCardToTableau(
          currentBoard,
          selectedFoundationIndex,
          columnIndex,
        );

        return nextBoard ?? currentBoard;
      });

      setSelectedFoundationIndex(null);
      return;
    }

    if (selectedTableauCard) {
      setBoard((currentBoard) => {
        if (!currentBoard) {
          return currentBoard;
        }
        const nextBoard = moveTableauSequence(
          currentBoard,
          selectedTableauCard.columnIndex,
          selectedTableauCard.cardIndex,
          columnIndex,
        );

        return nextBoard ?? currentBoard;
      });

      setSelectedTableauCard(null);
      return;
    }

    const topWasteCard = board.waste[board.waste.length - 1];

    if (!topWasteCard) {
      return;
    }

    if (selectedCardId !== topWasteCard.id) {
      return;
    }

    setBoard((currentBoard) => {
      if (!currentBoard) {
        return currentBoard;
      }
      const nextBoard = moveWasteCardToTableau(currentBoard, columnIndex);

      return nextBoard ?? currentBoard;
    });

    setSelectedCardId(null);
  };

  const handleFoundationClick = (foundationIndex: number) => {
    if (selectedTableauCard) {
      setBoard((currentBoard) => {
        if (!currentBoard) {
          return currentBoard;
        }
        const nextBoard = moveTableauCardToFoundation(
          currentBoard,
          selectedTableauCard.columnIndex,
          foundationIndex,
        );

        return nextBoard ?? currentBoard;
      });

      setSelectedTableauCard(null);
      return;
    }

    const topWasteCard = board.waste[board.waste.length - 1];

    if (!topWasteCard) {
      return;
    }

    if (selectedCardId !== topWasteCard.id) {
      return;
    }

    setBoard((currentBoard) => {
      if (!currentBoard) {
        return currentBoard;
      }
      const nextBoard = moveWasteCardToFoundation(
        currentBoard,
        foundationIndex,
      );

      return nextBoard ?? currentBoard;
    });

    setSelectedCardId(null);
  };

  const handleTableauCardClick = (columnIndex: number, cardIndex: number) => {
    const card = board.tableau[columnIndex]?.[cardIndex];

    if (!card) {
      return;
    }

    const isSameSelection =
      selectedTableauCard?.columnIndex === columnIndex &&
      selectedTableauCard.cardIndex === cardIndex;

    // Clicking the same selected card again deselects it
    if (isSameSelection) {
      setSelectedTableauCard(null);
      return;
    }

    // If a tableau card is already selected,
    // clicking another card attempts a move
    if (selectedTableauCard) {
      handleTableauClick(columnIndex);
      return;
    }

    // If a waste card is selected,
    // clicking a tableau card attempts a move
    if (selectedCardId) {
      handleTableauClick(columnIndex);
      return;
    }

    // If a foundation card is selected,
    // clicking a tableau card attempts a move
    if (selectedFoundationIndex !== null) {
      handleTableauClick(columnIndex);
      return;
    }

    // Face-down cards cannot be selected
    if (!card.faceUp) {
      return;
    }

    // Otherwise select this tableau card
    setSelectedTableauCard({
      columnIndex,
      cardIndex,
    });

    setSelectedCardId(null);
    setSelectedFoundationIndex(null);
  };

  const isValidTableauTarget = (columnIndex: number): boolean => {
    const targetColumn = board.tableau[columnIndex];

    if (selectedFoundationIndex !== null) {
      const foundation = board.foundations[selectedFoundationIndex];
      const movingCard = foundation.cards[foundation.cards.length - 1];

      if (!movingCard) {
        return false;
      }

      if (targetColumn.length === 0) {
        return canPlaceOnEmptyTableau(movingCard);
      }

      const targetCard = targetColumn[targetColumn.length - 1];

      return canPlaceOnTableau(movingCard, targetCard);
    }

    if (selectedTableauCard) {
      const movingCards = board.tableau[selectedTableauCard.columnIndex].slice(
        selectedTableauCard.cardIndex,
      );

      return canMoveTableauSequence(movingCards, targetColumn);
    }

    const topWasteCard = board.waste[board.waste.length - 1];

    if (selectedCardId && topWasteCard?.id === selectedCardId) {
      if (targetColumn.length === 0) {
        return canPlaceOnEmptyTableau(topWasteCard);
      }

      const targetCard = targetColumn[targetColumn.length - 1];

      return canPlaceOnTableau(topWasteCard, targetCard);
    }

    return false;
  };

  const isValidFoundationTarget = (foundationIndex: number): boolean => {
    const foundation = board.foundations[foundationIndex];

    if (selectedTableauCard) {
      const column = board.tableau[selectedTableauCard.columnIndex];

      const movingCard = column[column.length - 1];

      if (!movingCard) {
        return false;
      }

      // Only the top tableau card can move to foundation
      if (selectedTableauCard.cardIndex !== column.length - 1) {
        return false;
      }

      return canPlaceOnFoundation(movingCard, foundation);
    }

    const topWasteCard = board.waste[board.waste.length - 1];

    if (selectedCardId && topWasteCard?.id === selectedCardId) {
      return canPlaceOnFoundation(topWasteCard, foundation);
    }

    return false;
  };

  return (
    <div className="w-full overflow-x-auto pb-3">
      <div className="w-full space-y-4 px-1 sm:min-w-[680px] sm:space-y-6 sm:px-6">
        {/* Stock / Waste / Foundations */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex gap-2 sm:gap-5">
            {board.foundations.map((foundation, foundationIndex) => (
              <CardPile
                key={foundation.suit}
                label={foundation.suit}
                card={foundation.cards[foundation.cards.length - 1] ?? null}
                selected={selectedFoundationIndex === foundationIndex}
                validTarget={isValidFoundationTarget(foundationIndex)}
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
        <div className="grid grid-cols-7 gap-1 sm:gap-3">
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { createSpiderDeck } from "./spider-deck";
import { isValidTableauSequence } from "./spider-rules";
import type { SpiderBoardState } from "./spider-types";

export function validateSpiderBoard(board: SpiderBoardState): boolean {
  if (![1, 2, 4].includes(board.difficulty)) {
    return false;
  }

  if (board.tableau.length !== 10) {
    return false;
  }

  const allCards = [
    ...board.stock,
    ...board.tableau.flat(),
    ...board.completedRuns.flatMap((run) => run.cards),
  ];

  if (
    allCards.length !== 104 ||
    new Set(allCards.map((card) => card.id)).size !== 104
  ) {
    return false;
  }

  const expectedCards = new Map(
    createSpiderDeck(board.difficulty).map((card) => [card.id, card]),
  );

  for (const card of allCards) {
    const expected = expectedCards.get(card.id);

    if (
      !expected ||
      card.suit !== expected.suit ||
      card.rank !== expected.rank
    ) {
      return false;
    }
  }

  if (
    board.stock.length > 50 ||
    board.stock.length % 10 !== 0 ||
    board.stock.some((card) => card.faceUp)
  ) {
    return false;
  }

  for (const column of board.tableau) {
    if (column.length > 0 && !column[column.length - 1].faceUp) {
      return false;
    }

    let foundFaceUpCard = false;

    for (const card of column) {
      if (card.faceUp) {
        foundFaceUpCard = true;
      } else if (foundFaceUpCard) {
        return false;
      }
    }
  }

  for (const run of board.completedRuns) {
    if (
      run.cards.length !== 13 ||
      run.cards[0]?.rank !== "K" ||
      run.cards[12]?.rank !== "A" ||
      run.suit !== run.cards[0]?.suit ||
      !isValidTableauSequence(run.cards)
    ) {
      return false;
    }
  }

  return true;
}

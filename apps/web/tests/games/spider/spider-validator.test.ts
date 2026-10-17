import { describe, expect, it } from "vitest";

import { createSpiderDeck } from "@/lib/games/solitaire/spider/spider-deck";
import { createSpiderBoard } from "@/lib/games/solitaire/spider/spider-setup";
import { validateSpiderBoard } from "@/lib/games/solitaire/spider/spider-validator";
import type {
  SpiderBoardState,
  SpiderDifficulty,
} from "@/lib/games/solitaire/spider/spider-types";
import type { GameCard } from "@/lib/types/gamecards";

function initialBoard(difficulty: SpiderDifficulty = 2): SpiderBoardState {
  return createSpiderBoard(createSpiderDeck(difficulty), difficulty);
}

// A valid late-game position with no stock and several empty columns.
function exposedBoard(): SpiderBoardState {
  return {
    difficulty: 2,
    stock: [],
    tableau: [
      createSpiderDeck(2).map((card) => ({ ...card, faceUp: true })),
      ...Array.from({ length: 9 }, () => []),
    ],
    completedRuns: [],
  };
}

function boardWithCompletedRun(): SpiderBoardState {
  const board = exposedBoard();
  const ranks: GameCard["rank"][] = [
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
    "A",
  ];

  const cards = ranks.map((rank) => {
    const index = board.tableau[0].findIndex(
      (card) => card.suit === "spades" && card.rank === rank,
    );

    if (index < 0) {
      throw new Error(`Missing fixture card: ${rank} of spades`);
    }

    return board.tableau[0].splice(index, 1)[0];
  });

  board.completedRuns = [{ suit: "spades", cards }];
  return board;
}

describe("Spider board validation", () => {
  it.each([1, 2, 4] as const)(
    "accepts an initial %s-suit board without mutating it",
    (difficulty) => {
      const board = initialBoard(difficulty);
      const original = structuredClone(board);

      expect(validateSpiderBoard(board)).toBe(true);
      expect(board).toEqual(original);
    },
  );

  it("accepts empty tableau columns and an exhausted stock", () => {
    expect(validateSpiderBoard(exposedBoard())).toBe(true);
  });

  it("accepts a completed same-suit King-to-Ace run", () => {
    expect(validateSpiderBoard(boardWithCompletedRun())).toBe(true);
  });

  const invalidBoards: Array<{
    name: string;
    mutate: (board: SpiderBoardState) => void;
  }> = [
    {
      name: "unsupported difficulty",
      mutate: (board) => {
        board.difficulty = 3 as SpiderDifficulty;
      },
    },
    {
      name: "fewer than ten columns",
      mutate: (board) => {
        board.tableau[0].push(...board.tableau.pop()!);
      },
    },
    {
      name: "more than ten columns",
      mutate: (board) => {
        board.tableau.push([]);
      },
    },
    {
      name: "a missing card",
      mutate: (board) => {
        board.stock.pop();
      },
    },
    {
      name: "an extra card",
      mutate: (board) => {
        board.stock.push({ ...board.stock[0] });
      },
    },
    {
      name: "a duplicate card ID with 104 total cards",
      mutate: (board) => {
        board.stock[1].id = board.stock[0].id;
      },
    },
    {
      name: "an unknown card ID",
      mutate: (board) => {
        board.stock[0].id = "not-a-spider-card";
      },
    },
    {
      name: "a suit that does not match the card ID",
      mutate: (board) => {
        const card = board.stock[0];
        card.suit = card.suit === "spades" ? "hearts" : "spades";
      },
    },
    {
      name: "a rank that does not match the card ID",
      mutate: (board) => {
        const card = board.stock[0];
        card.rank = card.rank === "A" ? "2" : "A";
      },
    },
    {
      name: "more than fifty stock cards",
      mutate: (board) => {
        const moved = board.tableau[0].splice(0, 1)[0];
        board.stock.push({ ...moved, faceUp: false });
      },
    },
    {
      name: "a partial stock deal",
      mutate: (board) => {
        const moved = board.stock.pop()!;
        board.tableau[0].push({ ...moved, faceUp: true });
      },
    },
    {
      name: "a face-up stock card",
      mutate: (board) => {
        board.stock[0].faceUp = true;
      },
    },
    {
      name: "a hidden top tableau card",
      mutate: (board) => {
        const column = board.tableau[0];
        column[column.length - 1].faceUp = false;
      },
    },
    {
      name: "a hidden card after a face-up card",
      mutate: (board) => {
        board.tableau[0][0].faceUp = true;
        board.tableau[0][1].faceUp = false;
      },
    },
  ];

  it.each(invalidBoards)("rejects $name", ({ mutate }) => {
    const board = initialBoard();
    expect(validateSpiderBoard(board)).toBe(true);

    mutate(board);
    const original = structuredClone(board);

    expect(validateSpiderBoard(board)).toBe(false);
    expect(board).toEqual(original);
  });
});

describe("Spider completed-run validation", () => {
  const invalidRuns: Array<{
    name: string;
    mutate: (board: SpiderBoardState) => void;
  }> = [
    {
      name: "a run shorter than thirteen cards",
      mutate: (board) => {
        const removed = board.completedRuns[0].cards.pop()!;
        board.tableau[0].push(removed);
      },
    },
    {
      name: "a run that does not start with a King",
      mutate: (board) => {
        const cards = board.completedRuns[0].cards;
        [cards[0], cards[1]] = [cards[1], cards[0]];
      },
    },
    {
      name: "a run that does not end with an Ace",
      mutate: (board) => {
        const cards = board.completedRuns[0].cards;
        [cards[11], cards[12]] = [cards[12], cards[11]];
      },
    },
    {
      name: "a run with the wrong suit label",
      mutate: (board) => {
        board.completedRuns[0].suit = "hearts";
      },
    },
    {
      name: "a run with out-of-order middle cards",
      mutate: (board) => {
        const cards = board.completedRuns[0].cards;
        [cards[5], cards[6]] = [cards[6], cards[5]];
      },
    },
    {
      name: "a run containing a face-down card",
      mutate: (board) => {
        board.completedRuns[0].cards[5].faceUp = false;
      },
    },
    {
      name: "a run containing a different suit",
      mutate: (board) => {
        const cards = board.completedRuns[0].cards;
        const column = board.tableau[0];
        const index = column.findIndex(
          (card) => card.suit === "hearts" && card.rank === cards[5].rank,
        );

        if (index < 0) {
          throw new Error("Missing replacement card");
        }

        [cards[5], column[index]] = [column[index], cards[5]];
      },
    },
  ];

  it.each(invalidRuns)("rejects $name", ({ mutate }) => {
    const board = boardWithCompletedRun();
    expect(validateSpiderBoard(board)).toBe(true);

    mutate(board);

    // Keep every original card so rejection tests the run itself.
    const allCards = [
      ...board.stock,
      ...board.tableau.flat(),
      ...board.completedRuns.flatMap((run) => run.cards),
    ];

    expect(allCards).toHaveLength(104);
    expect(new Set(allCards.map((card) => card.id)).size).toBe(104);
    expect(validateSpiderBoard(board)).toBe(false);
  });
});

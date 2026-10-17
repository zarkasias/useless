import type { GameCard } from "@/lib/types/gamecards";

export type KlondikeFoundation = {
  suit: GameCard["suit"];
  cards: GameCard[];
};

export interface KlondikeBoardState {
  stock: GameCard[];
  waste: GameCard[];
  foundations: KlondikeFoundation[];
  tableau: GameCard[][];
}

export interface KlondikeAutoFinishMove {
  board: KlondikeBoardState;
  cardId: string;
  source:
    | {
        type: "waste";
      }
    | {
        type: "tableau";
        columnIndex: number;
      };
  foundationIndex: number;
}

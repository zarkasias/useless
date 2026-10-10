export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export type LetterStatus = "absent" | "present" | "correct";
export type WordGameStatus = "playing" | "won" | "lost";

export interface EvaluatedLetter {
  letter: string;
  status: LetterStatus;
}

export interface EvaluatedGuess {
  word: string;
  letters: EvaluatedLetter[];
}

export type GuessError =
  | "game-over"
  | "invalid-length"
  | "invalid-characters"
  | "unknown-word"
  | "already-guessed";

export type SubmitGuessResult =
  | {
      success: true;
      guesses: string[];
      evaluation: EvaluatedGuess;
      status: WordGameStatus;
    }
  | {
      success: false;
      error: GuessError;
      message: string;
    };

export function normalizeWord(word: string): string {
  return word.trim().toUpperCase();
}

export function isFiveLetterWord(word: string): boolean {
  return /^[A-Z]{5}$/.test(word);
}

export function createWordDictionary(words: readonly string[]): Set<string> {
  const dictionary = new Set<string>();

  for (const entry of words) {
    const word = normalizeWord(entry);

    if (!isFiveLetterWord(word)) {
      throw new Error(`Invalid dictionary entry: ${entry}`);
    }

    dictionary.add(word);
  }

  return dictionary;
}

export function evaluateGuess(
  rawGuess: string,
  rawAnswer: string,
): EvaluatedGuess {
  const word = normalizeWord(rawGuess);
  const answer = normalizeWord(rawAnswer);

  if (!isFiveLetterWord(word) || !isFiveLetterWord(answer)) {
    throw new Error("Guess and answer must contain five English letters.");
  }

  const letters: EvaluatedLetter[] = Array.from(word, (letter) => ({
    letter,
    status: "absent",
  }));

  const remaining = new Map<string, number>();

  // Exact matches consume their letters before misplaced matches.
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (word[index] === answer[index]) {
      letters[index].status = "correct";
    } else {
      const letter = answer[index];
      remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (letters[index].status === "correct") {
      continue;
    }

    const letter = word[index];
    const count = remaining.get(letter) ?? 0;

    if (count > 0) {
      letters[index].status = "present";
      remaining.set(letter, count - 1);
    }
  }

  return { word, letters };
}

export function getWordGameStatus(
  guesses: readonly string[],
  rawAnswer: string,
): WordGameStatus {
  const answer = normalizeWord(rawAnswer);

  if (guesses.some((guess) => normalizeWord(guess) === answer)) {
    return "won";
  }

  return guesses.length >= MAX_GUESSES ? "lost" : "playing";
}

export function submitGuess({
  guess: rawGuess,
  answer: rawAnswer,
  guesses,
  dictionary,
}: {
  guess: string;
  answer: string;
  guesses: readonly string[];
  dictionary: ReadonlySet<string>;
}): SubmitGuessResult {
  const answer = normalizeWord(rawAnswer);

  if (!isFiveLetterWord(answer) || !dictionary.has(answer)) {
    throw new Error("The puzzle answer must be in the word dictionary.");
  }

  if (getWordGameStatus(guesses, answer) !== "playing") {
    return {
      success: false,
      error: "game-over",
      message: "This puzzle is finished.",
    };
  }

  const word = normalizeWord(rawGuess);

  if (word.length !== WORD_LENGTH) {
    return {
      success: false,
      error: "invalid-length",
      message: "Enter five letters.",
    };
  }

  if (!isFiveLetterWord(word)) {
    return {
      success: false,
      error: "invalid-characters",
      message: "Use letters A–Z.",
    };
  }

  if (!dictionary.has(word)) {
    return {
      success: false,
      error: "unknown-word",
      message: "That word isn't in our dictionary.",
    };
  }

  if (guesses.some((guess) => normalizeWord(guess) === word)) {
    return {
      success: false,
      error: "already-guessed",
      message: "You've already tried that word.",
    };
  }

  const nextGuesses = [...guesses, word];

  return {
    success: true,
    guesses: nextGuesses,
    evaluation: evaluateGuess(word, answer),
    status: getWordGameStatus(nextGuesses, answer),
  };
}

export function getKeyboardStatuses(
  evaluations: readonly EvaluatedGuess[],
): Partial<Record<string, LetterStatus>> {
  const statuses: Partial<Record<string, LetterStatus>> = {};
  const priority: Record<LetterStatus, number> = {
    absent: 0,
    present: 1,
    correct: 2,
  };

  for (const evaluation of evaluations) {
    for (const { letter, status } of evaluation.letters) {
      const previous = statuses[letter];

      if (previous === undefined || priority[status] > priority[previous]) {
        statuses[letter] = status;
      }
    }
  }

  return statuses;
}

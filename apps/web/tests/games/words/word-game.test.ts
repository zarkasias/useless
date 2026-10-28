// @vitest-environment jsdom

import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WordGame } from "@/components/games/words/word-game";
import { answerWords } from "@/lib/games/words/word-list";

const mocks = vi.hoisted(() => ({ record: vi.fn(), recorded: vi.fn() }));
vi.mock("@/app/actions/game-actions", () => ({ recordGuessGameResultAction: mocks.record }));

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mocks.record.mockReset().mockResolvedValue({ success: true });
  mocks.recorded.mockReset();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fetchMock = vi.fn(() => { throw new Error("Only the mocked result action may perform gameplay recording"); });
  vi.stubGlobal("fetch", fetchMock);
  // Use the real approved dictionary and selection function, choosing APPLE.
  vi.spyOn(Math, "random").mockReturnValue((answerWords.indexOf("APPLE") + 0.5) / answerWords.length);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function game() {
  return container.querySelector<HTMLElement>('section[aria-label="Useless Guess game"]')!;
}
function overlay() { return container.querySelector<HTMLElement>(".absolute.inset-0.z-20"); }
function rows() { return container.querySelectorAll('[role="row"]'); }
function status() { return container.querySelector('[role="status"]')!.textContent; }
function button(label: string) {
  const match = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (item) => item.getAttribute("aria-label") === label || item.textContent?.trim() === label,
  );
  if (!match) throw new Error(`Missing button: ${label}`);
  return match;
}
async function render(strict = false) {
  await act(async () => root.render(strict ? createElement(StrictMode, null, createElement(WordGame, { onGameRecorded: mocks.recorded })) : createElement(WordGame, { onGameRecorded: mocks.recorded })));
}
async function key(value: string, options: KeyboardEventInit = {}, target: Element = game()) {
  const event = new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...options });
  await act(async () => target.dispatchEvent(event));
  return event;
}
async function type(word: string) { for (const letter of word) await key(letter); }
async function submit(word: string) { await type(word); await key("Enter"); }
async function click(label: string) {
  await act(async () => { const target = button(label); target.focus(); target.click(); });
}

 describe("WordGame", () => {
  it("renders six stable rows, 30 cells, focusable input and credits", async () => {
    await render();
    expect(rows()).toHaveLength(6);
    expect(container.querySelectorAll('[role="cell"]')).toHaveLength(30);
    expect(document.activeElement).toBe(game());
    expect(container.querySelector('a[href="/licenses/scowl-2020.12.07.txt"]')?.textContent).toBe("Word list credits");
    expect(status()).toContain("Guess 1 of 6");
  });

  it("supports physical letters, length cap, deletion and invalid guesses without spending turns", async () => {
    await render();
    await type("abcdex");
    expect(rows()[0].textContent).toBe("ABCDE");
    await key("Backspace");
    await key("Enter");
    expect(status()).toContain("Enter five letters.");
    expect(rows()[0].textContent).toBe("ABCD");
    await click("Restart");
    await submit("ZZZZZ");
    expect(status()).toContain("That word isn't in our dictionary.");
    expect(rows()[0].textContent).toBe("ZZZZZ");
    expect(rows()[0].querySelector('[aria-label*="not submitted"]')).not.toBeNull();
    expect(container.textContent).toContain("0/6");
    // Recording is authorized through the mocked server action, not raw fetch or localStorage.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("routes on-screen and physical input through the same scoring rules and preserves keyboard priority", async () => {
    await render();
    for (const letter of "ALLEY") await click(letter);
    await click("Enter");
    expect(Array.from(rows()[0].children, (cell) => cell.getAttribute("aria-label"))).toEqual([
      "Letter 1: A, correct", "Letter 2: L, present", "Letter 3: L, absent", "Letter 4: E, present", "Letter 5: Y, absent",
    ]);
    expect(button("L, present").disabled).toBe(false);
    await submit("PUPPY");
    expect(button("P, correct").disabled).toBe(false);
    expect(button("L, present").disabled).toBe(false);
    expect(button("Y, absent").disabled).toBe(false);
    await submit("alley");
    expect(status()).toContain("You've already tried that word.");
    expect(container.textContent).toContain("2/6");
    expect(rows()[2].textContent).toBe("ALLEY");
  });

  it("ignores shortcuts, composition, repeat, edited fields and default-prevented events", async () => {
    await render(true);
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { repeat: true }, { isComposing: true }]) await key("a", options);
    await key("1");
    const prevented = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    prevented.preventDefault();
    await act(async () => game().dispatchEvent(prevented));
    const input = document.createElement("input");
    game().appendChild(input);
    await key("a", {}, input);
    input.remove();
    const editor = document.createElement("div");
    editor.contentEditable = "true";
    editor.setAttribute("contenteditable", "true");
    game().appendChild(editor);
    await key("b", {}, editor);
    editor.remove();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    await key("c", {}, outside);
    outside.remove();
    expect(rows()[0].textContent).toBe("");
    await key("a");
    expect(rows()[0].textContent).toBe("A"); // StrictMode did not leave a duplicate listener.
  });

  it("does not hijack native Enter on keyboard buttons or restart/credits controls", async () => {
    await render();
    await type("APPL");
    const letter = button("E");
    letter.focus();
    expect((await key("Enter", {}, letter)).defaultPrevented).toBe(false);
    // Simulate the one click generated by native Enter; jsdom does not synthesize it.
    await act(async () => letter.click());
    expect(rows()[0].textContent).toBe("APPLE");
    expect(container.textContent).toContain("0/6");
    await key("Enter", {}, button("Enter"));
    await click("Enter");
    expect(container.textContent).toContain("1/6");
    expect(status()).toContain("You won!");
    expect((await key("Enter", {}, button("Play again"))).defaultPrevented).toBe(false);
    expect((await key("Enter", {}, container.querySelector("a")!)).defaultPrevented).toBe(false);
  });

  it("wins on guess six, locks input, keeps the board and restarts without repeating the answer", async () => {
    const writes = vi.spyOn(Storage.prototype, "setItem");
    await render();
    for (const word of ["CRANE", "SLATE", "BRICK", "MOUND", "GHOST", "APPLE"]) await submit(word);
    expect(mocks.record).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ result: "win", answer: "APPLE", guesses: ["CRANE", "SLATE", "BRICK", "MOUND", "GHOST", "APPLE"] }));
    expect(mocks.recorded).toHaveBeenCalledOnce();
    expect(status()).toContain("You won!");
    expect(overlay()).not.toBeNull();
    expect(overlay()?.textContent).toContain("The word was APPLE. You used 6 of 6 guesses.");
    expect(overlay()?.contains(rows()[0])).toBe(false);
    expect(container.textContent).toContain("The word was APPLE.");
    expect(container.textContent).toContain("6/6");
    expect(rows()[5].textContent).toBe("APPLE");
    expect(button("A, correct").disabled).toBe(true);
    expect(document.activeElement).toBe(button("Play again"));
    await key("a");
    await key("Enter");
    expect(rows()[5].textContent).toBe("APPLE");
    await click("Play again");
    expect(document.activeElement).toBe(game());
    expect(container.querySelector("h2")).toBeNull();
    expect(overlay()).toBeNull();
    expect(container.textContent).toContain("0/6");
    expect(button("A").disabled).toBe(false);
    await submit("APPLE");
    expect(status()).not.toContain("You won!");
    expect(container.textContent).toContain("1/6");
    // Recording is authorized through the mocked server action, not raw fetch or localStorage.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(writes).not.toHaveBeenCalled();
  });

  it("loses after six wrong accepted guesses, reveals answer and disables keys", async () => {
    await render();
    for (const word of ["CRANE", "SLATE", "BRICK", "MOUND", "GHOST", "ALLEY"]) await submit(word);
    expect(mocks.record).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ result: "loss", guesses: ["CRANE", "SLATE", "BRICK", "MOUND", "GHOST", "ALLEY"] }));
    expect(mocks.recorded).toHaveBeenCalledOnce();
    expect(status()).toContain("No guesses left. The word was APPLE.");
    expect(overlay()).not.toBeNull();
    expect(overlay()?.textContent).toContain("The word was APPLE. You used 6 of 6 guesses.");
    expect(container.textContent).toContain("That word got the last word.");
    expect(button("Enter").disabled).toBe(true);
    expect(rows()[5].textContent).toBe("ALLEY");
    // Recording is authorized through the mocked server action, not raw fetch or localStorage.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["win", "loss"])("keeps the %s overlay until Play again; Escape and backdrop do not dismiss", async (outcome) => {
    await render();
    const guesses = outcome === "win"
      ? ["APPLE"]
      : ["CRANE", "SLATE", "BRICK", "MOUND", "GHOST", "ALLEY"];
    for (const word of guesses) await submit(word);
    const resultOverlay = overlay();
    expect(resultOverlay).not.toBeNull();
    expect(resultOverlay?.contains(button("Play again"))).toBe(true);
    expect(document.activeElement).toBe(button("Play again"));
    const boardBefore = Array.from(rows(), (row) => row.textContent);
    await key("Escape", {}, button("Play again"));
    await act(async () => resultOverlay?.click());
    await key("a");
    await key("Backspace");
    await key("Enter");
    expect(overlay()).toBe(resultOverlay);
    expect(Array.from(rows(), (row) => row.textContent)).toEqual(boardBefore);
    expect(button("Enter").disabled).toBe(true);
    expect(Array.from(resultOverlay!.querySelectorAll("button"), (item) => item.textContent?.trim())).toEqual(["Play again"]);
    await click("Play again");
    expect(overlay()).toBeNull();
    expect(Array.from(rows(), (row) => row.textContent)).toEqual(["", "", "", "", "", ""]);
    expect(document.activeElement).toBe(game());
    expect(button("Enter").disabled).toBe(false);
    // Recording is authorized through the mocked server action, not raw fetch or localStorage.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("restarts unfinished rounds and removes its keyboard listener on unmount", async () => {
    const remove = vi.spyOn(window, "removeEventListener");
    await render();
    await submit("ALLEY");
    await type("cr");
    await click("Restart");
    expect(Array.from(rows(), (row) => row.textContent)).toEqual(["", "", "", "", "", ""]);
    expect(status()).toContain("Guess 1 of 6");
    expect(button("L").disabled).toBe(false);
    await type("app");
    expect(rows()[0].textContent).toBe("APP");
    await act(async () => root.unmount());
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
    root = createRoot(container);
  });
  it("records the measured round duration and never re-records after callback rerenders or Play again", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    await render(true);
    await type("APPLE");
    clock.mockReturnValue(6000);
    await key("Enter");
    expect(mocks.record).toHaveBeenCalledExactlyOnceWith({ result: "win", answer: "APPLE", guesses: ["APPLE"], durationSeconds: 5 });
    await act(async () => root.render(createElement(StrictMode, null, createElement(WordGame, { onGameRecorded: () => mocks.recorded() }))));
    await key("Escape", {}, button("Play again"));
    await act(async () => overlay()?.click());
    expect(mocks.record).toHaveBeenCalledOnce();
    vi.mocked(Math.random).mockReturnValue(0);
    await click("Play again");
    expect(mocks.record).toHaveBeenCalledOnce();
    await submit("ABOUT");
    expect(mocks.record).toHaveBeenCalledTimes(2);
    expect(mocks.record.mock.calls[1][0]).toMatchObject({ result: "win", answer: "ABOUT", guesses: ["ABOUT"] });
  });

  it.each(["response", "exception"])("keeps the result and does not refresh or retry after a recording %s failure", async (failure) => {
    if (failure === "response") mocks.record.mockResolvedValue({ success: false, error: "Unable to save your result." });
    else mocks.record.mockRejectedValue(new Error("Network dropped"));
    await render();
    await submit("APPLE");
    expect(overlay()?.textContent).toContain(failure === "response" ? "Unable to save your result." : "Unable to confirm that your Guess result was saved.");
    expect(button("Enter").disabled).toBe(true);
    expect(mocks.recorded).not.toHaveBeenCalled();
    await act(async () => root.render(createElement(WordGame, { onGameRecorded: () => mocks.recorded() })));
    expect(mocks.record).toHaveBeenCalledOnce();
    await click("Play again");
    expect(mocks.record).toHaveBeenCalledOnce();
    expect(overlay()).toBeNull();
  });

  it("records only started abandoned rounds on restart, guards rapid restarts and refreshes on success", async () => {
    await render();
    await click("Restart");
    expect(mocks.record).not.toHaveBeenCalled();
    await type("a");
    await act(async () => { button("Restart").click(); button("Restart").click(); });
    expect(mocks.record).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ result: "abandoned", guesses: [] }));
    expect(mocks.recorded).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("0/6");
    expect(document.activeElement).toBe(game());
  });

  it("shows a dismissible abandoned-save error while leaving the next round playable", async () => {
    mocks.record.mockRejectedValueOnce(new Error("Network dropped"));
    await render();
    await submit("CRANE");
    await click("Restart");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("previous game's result was saved");
    expect(mocks.record).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ result: "abandoned", guesses: ["CRANE"] }));
    expect(mocks.recorded).not.toHaveBeenCalled();
    expect(overlay()).toBeNull();
    await type("a");
    expect(rows()[0].textContent).toBe("A");
    await click("Dismiss");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(mocks.record).toHaveBeenCalledOnce();
  });

  it("ignores an older completed round's save feedback but still refreshes its successfully updated lifetime stats", async () => {
    let resolveOld!: (value: { success: boolean }) => void;
    let resolveNew!: (value: { success: boolean; error?: string }) => void;
    mocks.record.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveNew = resolve; }));
    await render();
    await submit("APPLE");
    expect(overlay()?.textContent).toContain("Saving result...");
    vi.mocked(Math.random).mockReturnValue(0);
    await click("Play again");
    await submit("ABOUT");
    expect(mocks.record).toHaveBeenCalledTimes(2);
    await act(async () => resolveOld({ success: true }));
    expect(mocks.recorded).toHaveBeenCalledOnce();
    expect(overlay()?.textContent).toContain("Saving result...");
    expect(overlay()?.textContent).not.toContain("Result saved.");
    await act(async () => resolveNew({ success: false, error: "New round save failed" }));
    expect(overlay()?.textContent).toContain("New round save failed");
    expect(overlay()?.textContent).toContain("The word was ABOUT.");
    expect(mocks.recorded).toHaveBeenCalledOnce();
  });

});

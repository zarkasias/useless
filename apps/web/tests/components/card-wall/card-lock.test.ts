import { describe, expect, it } from "vitest";

import {
  isLockedOnWall,
  isLockedWhenZoomed,
  type CardLockState,
} from "@/components/card-wall/card-lock";

const loggedOut = (claimedId: string | null = null): CardLockState => ({
  signedIn: false,
  unlockedIds: new Set(),
  claimedId,
});

const loggedIn = (
  ids: string[],
  claimedId: string | null = null,
): CardLockState => ({ signedIn: true, unlockedIds: new Set(ids), claimedId });

// One case per row of the table in HANDOFF.md §4.
describe("homepage locked and unlocked display", () => {
  it("logged out, card not claimed today: colour on the wall, locked zoomed", () => {
    expect(isLockedOnWall(loggedOut("other"), "card")).toBe(false);
    expect(isLockedWhenZoomed(loggedOut("other"), "card")).toBe(true);
    expect(isLockedWhenZoomed(loggedOut(), "card")).toBe(true);
  });

  it("logged out, the card claimed today: colour on the wall and zoomed", () => {
    expect(isLockedOnWall(loggedOut("card"), "card")).toBe(false);
    expect(isLockedWhenZoomed(loggedOut("card"), "card")).toBe(false);
  });

  it("logged in, locked card: locked on the wall and zoomed", () => {
    expect(isLockedOnWall(loggedIn(["other"]), "card")).toBe(true);
    expect(isLockedWhenZoomed(loggedIn(["other"]), "card")).toBe(true);
  });

  it("logged in, unlocked card: colour on the wall and zoomed", () => {
    expect(isLockedOnWall(loggedIn(["card"]), "card")).toBe(false);
    expect(isLockedWhenZoomed(loggedIn(["card"]), "card")).toBe(false);
  });

  it("logged in, a card claimed just now unlocks straight away", () => {
    expect(isLockedOnWall(loggedIn([], "card"), "card")).toBe(false);
    expect(isLockedWhenZoomed(loggedIn([], "card"), "card")).toBe(false);
  });
});

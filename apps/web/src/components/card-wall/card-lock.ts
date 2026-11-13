/**
 * What the homepage shows as locked or unlocked (HANDOFF.md §4). The unlock
 * rules themselves live in the existing unlock and claim code; this only
 * turns their answers into what each card looks like.
 */

export interface CardLockState {
  /** True when the visitor is signed in. */
  signedIn: boolean;
  /** Ids the existing unlock records say this user has. */
  unlockedIds: ReadonlySet<string>;
  /** Today's claimed achievement, from the existing daily claim. */
  claimedId: string | null;
}

export function isUnlocked(state: CardLockState, id: string): boolean {
  return state.unlockedIds.has(id) || state.claimedId === id;
}

/**
 * Logged-out visitors see the whole wall in colour (agreed with the owner,
 * so the homepage keeps its look). Signed-in users see their locked cards.
 */
export function isLockedOnWall(state: CardLockState, id: string): boolean {
  return state.signedIn && !isUnlocked(state, id);
}

/** Zoomed, a card is locked unless this visitor has really unlocked it. */
export function isLockedWhenZoomed(state: CardLockState, id: string): boolean {
  return !isUnlocked(state, id);
}

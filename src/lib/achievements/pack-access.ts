/** Unassigned legacy achievements and core packs are available to everyone. */
export function achievementPackFilter(packIds: string[]): string {
  return packIds.length > 0
    ? `pack_id.is.null,pack_id.in.(${[...new Set(packIds)].join(",")})`
    : "pack_id.is.null";
}

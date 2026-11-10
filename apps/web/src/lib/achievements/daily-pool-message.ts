/**
 * Toast copy for a daily claim that found nothing to give: the user already
 * has every daily achievement that can be claimed at this moment.
 */
export function dailyPoolExhaustedMessage(
  nextAvailableAt: string | null,
  now = new Date(),
): string {
  const base = "You've claimed every daily achievement available right now.";

  const next = nextAvailableAt ? new Date(nextAvailableAt) : null;

  if (!next || Number.isNaN(next.getTime())) {
    return `${base} The rest unlock on specific days or times, so check back later.`;
  }

  const time = next.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const day =
    next.toDateString() === now.toDateString()
      ? "today"
      : next.toDateString() === tomorrow.toDateString()
        ? "tomorrow"
        : next.toLocaleDateString(undefined, { weekday: "long" });

  return `${base} The next one unlocks ${day} at ${time}.`;
}

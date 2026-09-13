import { expect, it, vi } from "vitest";

const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc, from }),
}));
import { getLeaderboardUsers } from "@/lib/services/leaderboard-service-server";

function queryFor(rows: Record<string, unknown>[]) {
  let after = "";
  const query = {
    select: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    gt: vi.fn((_column: string, value: string) => { after = value; return query; }),
    // Simulate a server cap smaller than the requested batch size.
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({
      data: rows.filter((row) => String(row.id) > after).slice(0, 10),
      error: null,
    }).then(resolve),
  };
  return query;
}

it("includes more than twenty users and history beyond the API row cap", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-12T16:00:00Z"));
  const users = Array.from({ length: 25 }, (_, i) => ({
    id: `user-${String(i).padStart(2, "0")}`,
    username: `User ${i}`, achievement_count: i === 24 ? 12 : 0,
  }));
  const claims = Array.from({ length: 12 }, (_, i) => ({
    id: `claim-${String(i).padStart(2, "0")}`,
    user_id: "user-24",
    achievement_date: `2026-09-${String(i + 1).padStart(2, "0")}`,
  }));
  rpc.mockImplementation(() => queryFor(users));
  from.mockImplementation(() => queryFor(claims));

  const result = await getLeaderboardUsers();
  expect(result).toHaveLength(25);
  expect(result.find((user) => user.id === "user-24")).toMatchObject({
    currentStreak: 12, achievementCount: 12,
  });
  expect(rpc).toHaveBeenCalledWith("get_leaderboard_users", { limit_count: null });
});

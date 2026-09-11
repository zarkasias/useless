import { expect, it } from "vitest";
import { safeLoginRedirect } from "@/lib/auth/safe-redirect";

it.each([
  undefined, null, [], "", "https://attacker.example", "//attacker.example",
  "/\\attacker.example", "/\t/attacker.example", "/\n/attacker.example",
  "javascript:alert(1)", "/somewhere/..//attacker.example",
])("rejects unsafe login destination %j", (destination) => {
  expect(safeLoginRedirect(destination)).toBe("/dashboard");
});

it.each(["/", "/dashboard", "/pro?plan=year#checkout", "/packs/halloween"])(
  "preserves local destination %s", (destination) => {
    expect(safeLoginRedirect(destination)).toBe(destination);
  },
);

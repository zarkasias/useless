import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import {
  createAchievementPack,
  updateAchievementPack,
} from "@/app/admin/achievement-packs/actions";

let db: ReturnType<typeof database>;
const redirectSignal = new Error("Redirect");
const now = "2026-10-07T12:00:00.000Z";

function makeForm(values: Record<string, string> = {}) {
  const form = new FormData();

  for (const [key, value] of Object.entries({
    id: "  pack-1  ",
    name: "  Unnecessary Achievements  ",
    slug: "  unnecessary  ",
    cover_image_path: "",
    ...values,
  })) {
    form.set(key, value);
  }

  return form;
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  db = database();
  mocks.from.mockImplementation(db.from);
  mocks.requireAdmin.mockResolvedValue({ id: "admin-1" });
  mocks.redirect.mockImplementation(() => {
    throw redirectSignal;
  });

  vi.useFakeTimers();
  vi.setSystemTime(new Date(now));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("createAchievementPack", () => {
  it("trims required fields, applies defaults, and redirects", async () => {
    const query = db.enqueue("achievement_packs", {});

    await expect(createAchievementPack(makeForm())).rejects.toBe(
      redirectSignal,
    );

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(query.insert).toHaveBeenCalledWith({
      name: "Unnecessary Achievements",
      slug: "unnecessary",
      description: null,
      pack_type: "seasonal",
      status: "draft",
      starts_at: null,
      ends_at: null,
    });
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/admin/achievement-packs"],
    ]);
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "/admin/achievement-packs",
    );
  });

  it("saves supplied optional fields", async () => {
    const query = db.enqueue("achievement_packs", {});

    await expect(
      createAchievementPack(
        makeForm({
          description: "  Silly awards  ",
          pack_type: "permanent",
          status: "active",
          starts_at: "  2026-10-01T00:00:00Z  ",
          ends_at: "  2026-11-01T00:00:00Z  ",
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(query.insert).toHaveBeenCalledWith({
      name: "Unnecessary Achievements",
      slug: "unnecessary",
      description: "Silly awards",
      pack_type: "permanent",
      status: "active",
      starts_at: "2026-10-01T00:00:00Z",
      ends_at: "2026-11-01T00:00:00Z",
    });
  });
});

describe("updateAchievementPack", () => {
  it("updates the selected pack with defaults and a timestamp", async () => {
    const query = db.enqueue("achievement_packs", {});

    await expect(updateAchievementPack(makeForm())).rejects.toBe(
      redirectSignal,
    );

    expect(query.update).toHaveBeenCalledWith({
      name: "Unnecessary Achievements",
      slug: "unnecessary",
      description: null,
      pack_type: "seasonal",
      theme_key: null,
      cover_image_path: null,
      status: "draft",
      starts_at: null,
      ends_at: null,
      updated_at: now,
    });
    expect(query.eq).toHaveBeenCalledWith("id", "pack-1");
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/admin/achievement-packs"],
      ["/admin/achievement-packs/pack-1"],
    ]);
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "/admin/achievement-packs",
    );
  });

  it("trims and saves supplied optional fields", async () => {
    const query = db.enqueue("achievement_packs", {});

    await expect(
      updateAchievementPack(
        makeForm({
          description: "  Silly awards  ",
          pack_type: "permanent",
          theme_key: "  autumn  ",
          cover_image_path: "  /packs/autumn.png  ",
          status: "active",
          starts_at: "  2026-10-01T00:00:00Z  ",
          ends_at: "  2026-11-01T00:00:00Z  ",
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(query.update).toHaveBeenCalledWith({
      name: "Unnecessary Achievements",
      slug: "unnecessary",
      description: "Silly awards",
      pack_type: "permanent",
      theme_key: "autumn",
      cover_image_path: "/packs/autumn.png",
      status: "active",
      starts_at: "2026-10-01T00:00:00Z",
      ends_at: "2026-11-01T00:00:00Z",
      updated_at: now,
    });
  });
});

describe.each([
  {
    name: "createAchievementPack",
    run: createAchievementPack,
    required: ["name", "slug"],
    validationError: "Name and slug are required.",
    databaseError: "Unable to create achievement pack.",
    log: "Error creating achievement pack:",
  },
  {
    name: "updateAchievementPack",
    run: updateAchievementPack,
    required: ["id", "name", "slug"],
    validationError: "Pack id, name, and slug are required.",
    databaseError: "Unable to update achievement pack.",
    log: "Error updating achievement pack:",
  },
])("$name failures", (testCase) => {
  it("rejects unauthorized requests before accessing the database", async () => {
    const error = new Error("Admin access required");
    mocks.requireAdmin.mockRejectedValue(error);

    await expect(testCase.run(makeForm())).rejects.toBe(error);

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  for (const field of testCase.required) {
    it.each([
      { label: "missing", value: undefined },
      { label: "blank", value: "   " },
    ])(`rejects $label ${field}`, async ({ value }) => {
      const form = makeForm();

      if (value === undefined) {
        form.delete(field);
      } else {
        form.set(field, value);
      }

      await expect(testCase.run(form)).rejects.toThrow(
        testCase.validationError,
      );

      expect(db.from).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
      expect(mocks.redirect).not.toHaveBeenCalled();
    });
  }

  it("logs database errors without revalidating or redirecting", async () => {
    const error = { message: "Database unavailable" };
    db.enqueue("achievement_packs", { error });

    await expect(testCase.run(makeForm())).rejects.toThrow(
      testCase.databaseError,
    );

    expect(console.error).toHaveBeenCalledWith(testCase.log, error);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

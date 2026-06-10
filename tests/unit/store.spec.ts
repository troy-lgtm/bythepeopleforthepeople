import { expect, test } from "@playwright/test";
import {
  __resetMemoryStoreForTests,
  hashGetAll,
  hashIncr,
  kvGet,
  kvSet,
  listPushCapped,
  listRange,
  setAdd,
  setMembers,
  setRemove,
  storeMode,
  windowIncr,
} from "@/lib/store";

test.describe("store memory fallback", () => {
  test.beforeEach(() => {
    __resetMemoryStoreForTests();
  });

  test("runs in memory mode without env vars", () => {
    expect(storeMode()).toBe("memory");
  });

  test("kv roundtrip clones values (no aliasing)", async () => {
    const value = { nested: { count: 1 } };
    await kvSet("k", value);
    value.nested.count = 99;
    const read = await kvGet<typeof value>("k");
    expect(read?.nested.count).toBe(1);
    expect(await kvGet("missing")).toBeNull();
  });

  test("sets add, list, and remove", async () => {
    await setAdd("s", "a");
    await setAdd("s", "b");
    await setAdd("s", "a");
    expect((await setMembers("s")).sort()).toEqual(["a", "b"]);
    await setRemove("s", "a");
    expect(await setMembers("s")).toEqual(["b"]);
  });

  test("capped list keeps newest first and trims", async () => {
    for (let i = 1; i <= 5; i++) {
      await listPushCapped("log", { i }, 3);
    }
    const entries = await listRange<{ i: number }>("log");
    expect(entries.map((e) => e.i)).toEqual([5, 4, 3]);
  });

  test("hash counters accumulate", async () => {
    await hashIncr("evt", "visit:digest");
    await hashIncr("evt", "visit:digest");
    await hashIncr("evt", "visit:embed");
    expect(await hashGetAll("evt")).toEqual({
      "visit:digest": 2,
      "visit:embed": 1,
    });
  });

  test("window counter increments inside the window", async () => {
    expect(await windowIncr("rl", 60)).toBe(1);
    expect(await windowIncr("rl", 60)).toBe(2);
    expect(await windowIncr("rl", 60)).toBe(3);
  });
});

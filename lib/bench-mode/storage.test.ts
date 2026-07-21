import { afterEach, describe, expect, it, vi } from "vitest";
import { clearBenchSession, loadBenchSession } from "./storage";

afterEach(() => vi.unstubAllGlobals());

describe("bench-mode browser storage", () => {
  it("treats malformed localStorage as an empty session", () => {
    const removeItem = vi.fn();
    const localStorage = {
      getItem: () => "{malformed",
      removeItem,
    };
    vi.stubGlobal("window", {
      localStorage,
    });
    vi.stubGlobal("localStorage", localStorage);

    expect(loadBenchSession()).toBeNull();
    expect(() => clearBenchSession()).not.toThrow();
    expect(removeItem).toHaveBeenCalledWith("bindlab-live-bench-demo-v1");
  });
});

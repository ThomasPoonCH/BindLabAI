import { describe, expect, it } from "vitest";
import { acquireConcurrencySlot } from "./concurrency-limit";

describe("concurrency limiter", () => {
  it("rejects work above the limit and releases slots exactly once", () => {
    const first = acquireConcurrencySlot("test", 2);
    const second = acquireConcurrencySlot("test", 2);
    expect(first).toBeTypeOf("function");
    expect(second).toBeTypeOf("function");
    expect(acquireConcurrencySlot("test", 2)).toBeNull();
    first?.();
    first?.();
    const replacement = acquireConcurrencySlot("test", 2);
    expect(replacement).toBeTypeOf("function");
    second?.();
    replacement?.();
  });
});

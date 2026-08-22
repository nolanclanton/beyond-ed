import { describe, expect, it } from "vitest";

import { bandFor, EXIT_BANDS } from "@/lib/rules/versions";

/** Blueprint §4 decision bands. Rules, not judgment calls. */
describe("Exit Ticket decision bands", () => {
  it("does not advance below 50%", () => {
    expect(bandFor(0).outcome).toBe("do_not_advance");
    expect(bandFor(25).outcome).toBe("do_not_advance");
    expect(bandFor(49.9).outcome).toBe("do_not_advance");
  });

  it("advances provisionally from 50 to 69", () => {
    expect(bandFor(50).outcome).toBe("provisional_advance");
    expect(bandFor(69.9).outcome).toBe("provisional_advance");
  });

  it("advances with normal spaced review from 70 to 84", () => {
    expect(bandFor(70).outcome).toBe("advance");
    expect(bandFor(84.9).outcome).toBe("advance");
  });

  it("advances with lower review priority at 85 and above", () => {
    expect(bandFor(85).outcome).toBe("advance_low_priority");
    expect(bandFor(100).outcome).toBe("advance_low_priority");
  });

  it("clamps out-of-range input rather than returning undefined", () => {
    expect(bandFor(-10).outcome).toBe("do_not_advance");
    expect(bandFor(150).outcome).toBe("advance_low_priority");
  });

  it("covers the whole 0-100 range with no gaps", () => {
    for (let p = 0; p <= 100; p += 0.5) {
      expect(bandFor(p), `no band at ${p}`).toBeDefined();
    }
    expect(EXIT_BANDS).toHaveLength(4);
  });
});

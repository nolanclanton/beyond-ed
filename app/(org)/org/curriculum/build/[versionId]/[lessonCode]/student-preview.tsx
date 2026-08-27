"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/lib/design/primitives";

/**
 * The lesson at the width a student meets it (vision §3, §11).
 *
 * A frame, not a second renderer. What is inside it is drawn by the same
 * components the lesson player uses, for the reason ADR 0012 gives: a
 * design-time drawing of a lesson can drift from what a class actually meets,
 * and then the preview is worse than none.
 *
 * The widths are the real ones — 390 pixels is a phone in portrait, and the
 * point of the mobile mode is to find the table that will not fit and the
 * paragraph that becomes a wall. The frame is `max-w`, so on a narrow screen the
 * page never scrolls sideways to show it.
 */
export function StudentPreview({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div>
      <div
        role="group"
        aria-label="Preview width"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <Button
          type="button"
          emphasis={mode === "desktop" ? "secondary" : "quiet"}
          onClick={() => setMode("desktop")}
          aria-pressed={mode === "desktop"}
        >
          Desktop
        </Button>
        <Button
          type="button"
          emphasis={mode === "mobile" ? "secondary" : "quiet"}
          onClick={() => setMode("mobile")}
          aria-pressed={mode === "mobile"}
        >
          Phone
        </Button>
        <p className="text-xs text-ink-muted" aria-live="polite">
          {mode === "mobile"
            ? "390 pixels wide — a phone in portrait."
            : "Full width, as on a laptop."}
        </p>
      </div>

      <div
        className={`mx-auto rounded-xl border border-line-strong bg-canvas p-4 ${
          mode === "mobile" ? "max-w-[390px]" : "w-full"
        }`}
      >
        {children}
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        This is draft content on a draft version. A student meets it only once
        this version is published, and only in a section created on it.
      </p>
    </div>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Reveal-on-scroll for elements marked `.reveal`.
 *
 * One mounted component for the whole page rather than a wrapper around every
 * section: the page stays a server component, and the markup keeps its own
 * shape instead of growing a div per animation.
 *
 * Three rules it will not break:
 *
 *   - **Nothing is hidden that the reader can already see.** Only elements
 *     below the fold at mount are marked pending, so hydration never blinks
 *     content out and back.
 *   - **Nothing is hidden that cannot be un-hidden.** The hidden state lives
 *     entirely in a `data-reveal` attribute this component sets. No script, no
 *     `IntersectionObserver`, or a reduced-motion preference means the page
 *     renders finished, which is also what the server sends.
 *   - **Reduced motion is respected**, and the preference is read at mount.
 *
 * Elements inside a `.reveal-group` resolve in sequence rather than together,
 * which reads as a row settling rather than a row appearing.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fold = window.innerHeight * 0.9;
    const pending = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal"),
    ).filter((el) => el.getBoundingClientRect().top > fold);
    if (pending.length === 0) return;

    for (const el of pending) {
      const group = el.closest(".reveal-group");
      if (group) {
        const index = Array.from(
          group.querySelectorAll<HTMLElement>(".reveal"),
        ).indexOf(el);
        if (index > 0) el.style.setProperty("--rise-delay", `${index * 70}ms`);
      }
      el.dataset.reveal = "pending";
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "shown";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    for (const el of pending) observer.observe(el);

    /*
     * A browser suspends rendering — and with it observer callbacks — while a
     * page is hidden. Anything scrolled into view during that time would still
     * be waiting when the reader comes back, so on return, sweep whatever is
     * already on screen and show it outright.
     */
    const catchUp = () => {
      if (document.visibilityState !== "visible") return;
      for (const el of pending) {
        if (el.dataset.reveal !== "pending") continue;
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.dataset.reveal = "shown";
          observer.unobserve(el);
        }
      }
    };
    document.addEventListener("visibilitychange", catchUp);
    window.addEventListener("pageshow", catchUp);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", catchUp);
      window.removeEventListener("pageshow", catchUp);
    };
  }, []);

  return null;
}

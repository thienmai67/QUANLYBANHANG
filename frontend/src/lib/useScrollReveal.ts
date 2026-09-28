"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook that applies scroll-reveal animation to elements with
 * the `.reveal-on-scroll` class inside the target container.
 * Uses IntersectionObserver for performance (no scroll listeners).
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    const targets = el.querySelectorAll(".reveal-on-scroll");
    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  return ref;
}

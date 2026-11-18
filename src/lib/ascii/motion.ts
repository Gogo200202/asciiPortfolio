"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeToReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export const usePrefersReducedMotion = (): boolean =>
  useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );

const subscribeToVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};

export const useDocumentVisible = (): boolean =>
  useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState === "visible",
    () => true
  );

export const useInView = (
  ref: RefObject<Element | null>,
  { rootMargin = "120px" }: { rootMargin?: string } = {}
): boolean => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
};

export type FrameLoopState = "running" | "paused" | "static";

export type FrameLoopCallback = (time: number, delta: number) => void;

export interface FrameLoopOptions {
  
  target?: RefObject<Element | null>;
  
  enabled?: boolean;
  
  fps?: number;
  
  stillTime?: number;
}

const NO_TARGET: RefObject<Element | null> = { current: null };

const MAX_DELTA = 0.1;

export const useFrameLoop = (
  callback: FrameLoopCallback,
  { target, enabled = true, fps = 30, stillTime = 0 }: FrameLoopOptions = {}
): FrameLoopState => {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const reducedMotion = usePrefersReducedMotion();
  const visible = useDocumentVisible();
  const inView = useInView(target ?? NO_TARGET);
  const onScreen = target ? inView : true;

  const isStatic = reducedMotion || !enabled;
  const isRunning = !isStatic && visible && onScreen;
  const timeRef = useRef(0);

  useEffect(() => {
    if (isStatic) {
      callbackRef.current(stillTime, 0);
      return;
    }
    if (!isRunning) {
      return;
    }
    const interval = 1000 / Math.max(1, fps);
    let frame = 0;
    let lastTick = performance.now();
    let lastDraw = -Infinity;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      const delta = Math.max(0, Math.min((now - lastTick) / 1000, MAX_DELTA));
      lastTick = now;
      timeRef.current += delta;
      
      if (now - lastDraw >= interval - 2) {
        const sinceDraw = Math.min((now - lastDraw) / 1000, MAX_DELTA);
        lastDraw = now;
        callbackRef.current(timeRef.current, sinceDraw);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isStatic, isRunning, fps, stillTime]);

  if (isStatic) {
    return "static";
  }
  return isRunning ? "running" : "paused";
};

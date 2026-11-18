"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

import { readCell } from "@/lib/ascii/measure";
import { cssColor } from "@/lib/ascii/tokens";
import type { AsciiColor, Rgba } from "@/lib/ascii/tokens";

let probe: CanvasRenderingContext2D | null = null;

const getProbe = () => {
  if (!probe) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext("2d", { willReadFrequently: true });
  }
  return probe;
};

export const resolveColor = (value: AsciiColor, el?: Element | null): Rgba => {
  const host = el ?? document.documentElement;
  const span = document.createElement("span");
  span.style.color = cssColor(value);
  span.style.display = "none";
  host.append(span);
  const { color } = getComputedStyle(span);
  span.remove();

  const context = getProbe();
  if (!context) {
    return [0, 0, 0, 1];
  }
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255, a / 255];
};

export const readAsciiCell = (el?: Element | null): number => readCell(el);

export const readGlow = (el?: Element | null): number => {
  if (typeof document === "undefined") {
    return 1;
  }
  const style = getComputedStyle(el ?? document.documentElement);
  for (const name of ["--ascii-glow", "--ascii-bloom"]) {
    const value = Number.parseFloat(style.getPropertyValue(name));
    if (Number.isFinite(value)) {
      return Math.min(1, Math.max(0, value));
    }
  }
  return 1;
};

const themeListeners = new Set<() => void>();
let themeObserver: MutationObserver | null = null;

export const subscribeToTheme = (listener: () => void): (() => void) => {
  themeListeners.add(listener);
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => {
      for (const notify of themeListeners) {
        notify();
      }
    });
    themeObserver.observe(document.documentElement, {
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
      attributes: true,
    });
  }
  return () => {
    themeListeners.delete(listener);
    if (themeListeners.size === 0) {
      themeObserver?.disconnect();
      themeObserver = null;
    }
  };
};

const DEFAULT_NAMES = ["--ascii-ink", "--ascii-paper"] as const;

type ResolvedColors<Names extends readonly AsciiColor[]> = {
  readonly [Index in keyof Names]: Rgba;
};

export function useAsciiColors(
  el?: RefObject<Element | null>
): ResolvedColors<typeof DEFAULT_NAMES> | null;
export function useAsciiColors<const Names extends readonly AsciiColor[]>(
  el: RefObject<Element | null> | undefined,
  names: Names
): ResolvedColors<Names> | null;
export function useAsciiColors(
  el?: RefObject<Element | null>,
  names: readonly AsciiColor[] = DEFAULT_NAMES
): readonly Rgba[] | null {
  const [colors, setColors] = useState<readonly Rgba[] | null>(null);
  const key = names.join("|");

  useEffect(() => {
    const list = key === "" ? [] : key.split("|");
    const read = () =>
      setColors(list.map((name) => resolveColor(name, el?.current)));
    read();
    return subscribeToTheme(read);
  }, [el, key]);

  return colors;
}

/**
 * A ripple at a viewport point, sent by page content to the decorative
 * AsciiCanvas backdrop. `CanvasBackdrop` listens for this and forwards it
 * to the pad as a click, so content can splash the background without
 * intercepting real pointer events.
 */
export const BACKGROUND_RIPPLE_EVENT = "ascii-backdrop:ripple";

export interface BackgroundRippleDetail {
  x: number;
  y: number;
}

export const rippleBackground = (x: number, y: number) => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<BackgroundRippleDetail>(BACKGROUND_RIPPLE_EVENT, {
      detail: { x, y },
    })
  );
};

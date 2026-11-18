
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

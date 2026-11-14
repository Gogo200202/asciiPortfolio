/// <reference types="vite/client" />

declare module "ascii-magic-art/runtime/player.js" {
  export function play(
    target: Element | null,
    piece: unknown,
    options?: Record<string, unknown>,
  ): (() => void) | void;
}

declare module "ascii-magic-art/pieces/*.js" {
  const piece: unknown;
  export = piece;
}

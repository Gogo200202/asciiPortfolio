import { BLUE_NOISE_64_BASE64 } from "@/lib/ascii/blue-noise";

export type DitherMatrix = "bayer2" | "bayer4" | "bayer8" | "blue-noise";

export const DITHER_MATRICES = [
  "bayer2",
  "bayer4",
  "bayer8",
  "blue-noise",
] as const satisfies readonly DitherMatrix[];

export interface ThresholdMap {
  
  readonly size: number;
  
  readonly thresholds: Float32Array;
  
  readonly ranks: Uint8Array;
  
  readonly steps: number;
}

const fromRanks = (size: number, ranks: Uint8Array, steps: number) => ({
  ranks,
  size,
  steps,
  thresholds: Float32Array.from(ranks, (rank) => (rank + 0.5) / steps),
});

const bayerRanks = (size: number): Uint8Array => {
  const ranks = new Uint8Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let rank = 0;
      for (let bit = 1; bit < size; bit *= 2) {
        const xBit = Math.floor(x / bit) % 2;
        const yBit = Math.floor(y / bit) % 2;
        rank = rank * 4 + 2 * ((xBit + yBit) % 2) + yBit;
      }
      ranks[y * size + x] = rank;
    }
  }
  return ranks;
};

const decodeBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
};

export const BAYER_2: ThresholdMap = fromRanks(2, bayerRanks(2), 4);
export const BAYER_4: ThresholdMap = fromRanks(4, bayerRanks(4), 16);
export const BAYER_8: ThresholdMap = fromRanks(8, bayerRanks(8), 64);

export const BLUE_NOISE_64: ThresholdMap = fromRanks(
  64,
  decodeBase64(BLUE_NOISE_64_BASE64),
  256
);

export const getThresholdMap = (matrix: DitherMatrix): ThresholdMap => {
  switch (matrix) {
    case "bayer2": {
      return BAYER_2;
    }
    case "bayer4": {
      return BAYER_4;
    }
    case "bayer8": {
      return BAYER_8;
    }
    case "blue-noise": {
      return BLUE_NOISE_64;
    }
    default: {
      const exhaustive: never = matrix;
      return exhaustive;
    }
  }
};

const wrap = (value: number, size: number) =>
  ((Math.floor(value) % size) + size) % size;

export const thresholdAt = (matrix: DitherMatrix, x: number, y: number) => {
  const map = getThresholdMap(matrix);
  return map.thresholds[wrap(y, map.size) * map.size + wrap(x, map.size)] ?? 0;
};

export const isInked = (
  matrix: DitherMatrix,
  x: number,
  y: number,
  tone: number
) => tone > thresholdAt(matrix, x, y);

import type { CharsetName } from "@/lib/ascii/charsets";
import type { DitherMatrix } from "@/lib/ascii/matrices";
import type {
  Ansi16Name,
  ColorMode,
  Grade,
  PhosphorName,
  RampName,
} from "@/lib/ascii/palettes";

export interface PostFx {
  
  scanlines?: number;
  
  bloom?: number;
  
  curvature?: number;
  
  glitch?: number;
  
  flicker?: number;
  
  vignette?: number;
}

export const NO_FX: Required<PostFx> = {
  bloom: 0,
  curvature: 0,
  flicker: 0,
  glitch: 0,
  scanlines: 0,
  vignette: 0,
};

export const CRT_FX: Required<PostFx> = {
  bloom: 0.55,
  curvature: 0.35,
  flicker: 0.15,
  glitch: 0,
  scanlines: 0.5,
  vignette: 0.45,
};

export const INTERACTIONS = ["none", "repel", "ripple", "trail"] as const;
export type Interaction = (typeof INTERACTIONS)[number];

export interface AsciiLook {
  
  charset?: CharsetName;
  
  chars?: string;
  
  colorMode?: ColorMode;
  
  phosphor?: PhosphorName;
  
  ramp?: RampName | readonly string[];
  
  ansi?: Ansi16Name;
  
  grade?: Grade;
  
  invert?: boolean;
  
  threshold?: number;
  
  edgeThreshold?: number;
  
  dither?: "none" | DitherMatrix;
  
  background?: "paper" | "transparent";
  
  square?: boolean;
  
  fx?: PostFx;
}

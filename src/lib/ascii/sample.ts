"use client";

import { useEffect, useState } from "react";

import { resolveCharset } from "@/lib/ascii/charsets";
import type { Charset, CharsetName } from "@/lib/ascii/charsets";
import type { ToneField } from "@/lib/ascii/frame";
import { luma } from "@/lib/ascii/palettes";

export interface SampleCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SampleOptions {
  
  columns: number;
  
  rows: number;
  
  charset?: CharsetName | Charset;
  
  fit?: "cover" | "contain" | "fill";
  
  mirror?: boolean;
  
  crop?: SampleCrop;
  
  aspect?: number;
  
  into?: ToneField;
}

interface Scratch {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

let scratch: Scratch | null = null;

const getScratch = (): Scratch | null => {
  if (scratch) {
    return scratch;
  }
  if (typeof OffscreenCanvas === "undefined") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    scratch = context ? { canvas, context } : null;
  } else {
    const canvas = new OffscreenCanvas(1, 1);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    scratch = context ? { canvas, context } : null;
  }
  return scratch;
};

export const sourceSize = (
  source: CanvasImageSource
): { width: number; height: number } => {
  if ("videoWidth" in source) {
    return { height: source.videoHeight, width: source.videoWidth };
  }
  if ("naturalWidth" in source) {
    return { height: source.naturalHeight, width: source.naturalWidth };
  }
  if ("displayWidth" in source) {
    return { height: source.displayHeight, width: source.displayWidth };
  }
  const { width, height } = source;
  return {
    height: typeof height === "number" ? height : height.baseVal.value,
    width: typeof width === "number" ? width : width.baseVal.value,
  };
};

const MAX_SUPERSAMPLE = 4;

interface Placement {
  readonly sx: number;
  readonly sy: number;
  readonly sw: number;
  readonly sh: number;
  readonly dx: number;
  readonly dy: number;
  readonly dw: number;
  readonly dh: number;
}

const placeSource = (
  size: { width: number; height: number },
  crop: SampleCrop,
  fit: NonNullable<SampleOptions["fit"]>,
  boxAspect: number
): Placement => {
  const sx = crop.x * size.width;
  const sy = crop.y * size.height;
  const sw = crop.width * size.width;
  const sh = crop.height * size.height;
  const full = { dh: 1, dw: 1, dx: 0, dy: 0, sh, sw, sx, sy };
  const sourceAspect = sw / sh;
  if (fit === "fill") {
    return full;
  }
  const wider = sourceAspect > boxAspect;
  if (fit === "cover") {
    
    return wider
      ? { ...full, sw: sh * boxAspect, sx: sx + (sw - sh * boxAspect) / 2 }
      : { ...full, sh: sw / boxAspect, sy: sy + (sh - sw / boxAspect) / 2 };
  }
  
  const dw = wider ? 1 : sourceAspect / boxAspect;
  const dh = wider ? boxAspect / sourceAspect : 1;
  return { ...full, dh, dw, dx: (1 - dw) / 2, dy: (1 - dh) / 2 };
};

const averageBlocks = (
  data: Uint8ClampedArray,
  pw: number,
  k: number,
  { width, height, tones, colors }: ToneField & { colors: Uint8ClampedArray }
): void => {
  const area = k * k;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let by = 0; by < k; by += 1) {
        let at = ((y * k + by) * pw + x * k) * 4;
        for (let bx = 0; bx < k; bx += 1) {
          const alpha = data[at + 3] ?? 0;
          r += (data[at] ?? 0) * alpha;
          g += (data[at + 1] ?? 0) * alpha;
          b += (data[at + 2] ?? 0) * alpha;
          a += alpha;
          at += 4;
        }
      }
      const index = y * width + x;
      const out = index * 4;
      const weight = a === 0 ? 0 : 1 / a;
      const red = r * weight;
      const green = g * weight;
      const blue = b * weight;
      colors[out] = red;
      colors[out + 1] = green;
      colors[out + 2] = blue;
      colors[out + 3] = a / area;
      tones[index] = luma(red, green, blue) * (a / area / 255);
    }
  }
};

const FULL_CROP: SampleCrop = { height: 1, width: 1, x: 0, y: 0 };

export const sampleToField = (
  source: CanvasImageSource,
  {
    columns,
    rows,
    charset = "standard",
    fit = "cover",
    mirror = false,
    crop = FULL_CROP,
    aspect,
    into,
  }: SampleOptions
): ToneField => {
  const [gx, gy] = resolveCharset(charset).grid;
  const width = Math.max(0, Math.floor(columns)) * gx;
  const height = Math.max(0, Math.floor(rows)) * gy;
  const colors =
    into?.width === width && into.height === height && into.colors
      ? into.colors
      : new Uint8ClampedArray(width * height * 4);
  const field =
    into?.colors === colors
      ? { ...into, colors }
      : { colors, height, tones: new Float32Array(width * height), width };
  const size = sourceSize(source);
  const pad = getScratch();
  if (!pad || width * height === 0 || size.width * size.height === 0) {
    field.tones.fill(0);
    colors.fill(0);
    return field;
  }

  const place = placeSource(
    size,
    crop,
    fit,
    aspect ?? (columns * 0.5) / Math.max(1, rows)
  );
  
  const k = Math.max(
    1,
    Math.min(
      MAX_SUPERSAMPLE,
      Math.floor(
        Math.min(place.sw / (width * place.dw), place.sh / (height * place.dh))
      )
    )
  );
  const pw = width * k;
  const ph = height * k;
  const { canvas, context } = pad;
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, pw, ph);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (mirror) {
    context.setTransform(-1, 0, 0, 1, pw, 0);
  }
  context.drawImage(
    source,
    place.sx,
    place.sy,
    place.sw,
    place.sh,
    place.dx * pw,
    place.dy * ph,
    place.dw * pw,
    place.dh * ph
  );
  averageBlocks(context.getImageData(0, 0, pw, ph).data, pw, k, field);
  return field;
};

export const autoLevels = (field: ToneField, clipPercent = 0.5): ToneField => {
  const { tones, colors } = field;
  const bins = new Uint32Array(256);
  let counted = 0;
  for (let index = 0; index < tones.length; index += 1) {
    if (colors && (colors[index * 4 + 3] ?? 0) === 0) {
      continue;
    }
    const tone = tones[index] ?? 0;
    bins[Math.min(255, Math.max(0, Math.round(tone * 255)))] += 1;
    counted += 1;
  }
  if (counted === 0) {
    return field;
  }
  const clip = Math.floor(
    (counted * Math.max(0, Math.min(49, clipPercent))) / 100
  );
  let low = 0;
  for (let seen = 0; low < 255; low += 1) {
    seen += bins[low] ?? 0;
    if (seen > clip) {
      break;
    }
  }
  let high = 255;
  for (let seen = 0; high > 0; high -= 1) {
    seen += bins[high] ?? 0;
    if (seen > clip) {
      break;
    }
  }
  if (high <= low) {
    return field;
  }
  const from = low / 255;
  const scale = 255 / (high - low);
  for (let index = 0; index < tones.length; index += 1) {
    const stretched = ((tones[index] ?? 0) - from) * scale;
    tones[index] = stretched > 0 ? Math.min(stretched, 1) : 0;
  }
  return field;
};

export type MediaSource = string | Blob | MediaStream | null;

export interface MediaElementState {
  
  element: HTMLImageElement | HTMLVideoElement | null;
  
  kind: "image" | "video" | null;
  
  error: Error | null;
}

export interface MediaElementOptions {
  
  kind?: "image" | "video";
  
  loop?: boolean;
  
  crossOrigin?: "anonymous" | "use-credentials";
}

const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v|ogv|ogg)(\?|#|$)/iu;

const isStream = (value: MediaSource): value is MediaStream =>
  typeof MediaStream !== "undefined" && value instanceof MediaStream;

interface ResolvedSource {
  
  readonly url: string | null;
  
  readonly objectUrl: string | null;
  readonly video: boolean;
}

const resolveSource = (
  source: Exclude<MediaSource, null>,
  kind: MediaElementOptions["kind"]
): ResolvedSource => {
  if (isStream(source)) {
    return { objectUrl: null, url: null, video: true };
  }
  if (typeof source === "string") {
    return {
      objectUrl: null,
      url: source,
      video:
        kind === "video" ||
        (kind === undefined && VIDEO_EXTENSION.test(source)),
    };
  }
  const objectUrl = URL.createObjectURL(source);
  return {
    objectUrl,
    url: objectUrl,
    video:
      kind === "video" ||
      (kind === undefined && source.type.startsWith("video/")),
  };
};

const createVideo = (
  source: Exclude<MediaSource, null>,
  { url, objectUrl }: ResolvedSource,
  { loop, crossOrigin }: Required<Omit<MediaElementOptions, "kind">>
): HTMLVideoElement => {
  const element = document.createElement("video");
  element.muted = true;
  element.playsInline = true;
  element.loop = loop;
  element.autoplay = true;
  if (isStream(source)) {
    element.srcObject = source;
  } else if (url !== null) {
    
    if (objectUrl === null) {
      element.crossOrigin = crossOrigin;
    }
    element.src = url;
  }
  return element;
};

const releaseVideo = (video: HTMLVideoElement) => {
  video.pause();
  video.srcObject = null;
  video.removeAttribute("src");
  video.load();
};

export const useMediaElement = (
  source: MediaSource,
  { kind, loop = true, crossOrigin = "anonymous" }: MediaElementOptions = {}
): MediaElementState => {
  const [state, setState] = useState<MediaElementState>({
    element: null,
    error: null,
    kind: null,
  });

  useEffect(() => {
    if (source === null) {
      setState({ element: null, error: null, kind: null });
      return;
    }
    let cancelled = false;
    const resolved = resolveSource(source, kind);
    const fail = (error: unknown) => {
      if (!cancelled) {
        setState({
          element: null,
          error:
            error instanceof Error
              ? error
              : new Error("ascii: media failed to load"),
          kind: null,
        });
      }
    };

    let video: HTMLVideoElement | null = null;
    let image: HTMLImageElement | null = null;
    if (resolved.video) {
      const element = createVideo(source, resolved, { crossOrigin, loop });
      video = element;
      element.addEventListener(
        "loadeddata",
        async () => {
          if (!cancelled) {
            setState({ element, error: null, kind: "video" });
          }
          try {
            await element.play();
          } catch {
            
          }
        },
        { once: true }
      );
      element.addEventListener("error", () => fail(element.error), {
        once: true,
      });
    } else if (resolved.url !== null) {
      const element = new Image();
      image = element;
      if (resolved.objectUrl === null) {
        element.crossOrigin = crossOrigin;
      }
      element.decoding = "async";
      element.src = resolved.url;
      const load = async () => {
        try {
          await element.decode();
          if (!cancelled) {
            setState({ element, error: null, kind: "image" });
          }
        } catch (error) {
          fail(error);
        }
      };
      load();
    }

    return () => {
      cancelled = true;
      if (video) {
        releaseVideo(video);
      }
      if (image) {
        image.src = "";
      }
      if (resolved.objectUrl !== null) {
        URL.revokeObjectURL(resolved.objectUrl);
      }
    };
  }, [source, kind, loop, crossOrigin]);

  return state;
};

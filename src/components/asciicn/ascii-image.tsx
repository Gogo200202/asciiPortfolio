"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentProps, CSSProperties, RefObject } from "react";

import {
  AsciiGrid,
  autoLevels as stretchLevels,
  CrtOverlay,
  createToneField,
  hexToRgb,
  luma,
  mapTones,
  PHOSPHORS,
  RAMPS,
  resolveCharset,
  sampleToField,
  SPINNERS,
  useAsciiColors,
  usePrefersReducedMotion,
} from "@/lib/ascii";
import type {
  AsciiColor,
  AsciiGridDrawContext,
  AsciiHandle,
  AsciiLook,
  Charset,
  MapOptions,
  MutableFrame,
  Rgb8,
  SampleCrop,
  ToneField,
} from "@/lib/ascii";
import { cn } from "@/lib/utils";

export interface GlyphPaint {
  readonly ink: AsciiColor;
  readonly paper: AsciiColor | "transparent";
  
  readonly darkIsDense: boolean;
  
  readonly palette: readonly Rgb8[];
}

const toBytes = ([r, g, b]: readonly number[]): Rgb8 => [
  Math.round((r ?? 0) * 255),
  Math.round((g ?? 0) * 255),
  Math.round((b ?? 0) * 255),
];

const rampPaper = (ramp: AsciiLook["ramp"]): string => {
  if (ramp === undefined) {
    return RAMPS.mainframe[0];
  }
  if (typeof ramp === "string") {
    return (RAMPS[ramp as keyof typeof RAMPS] ?? RAMPS.mainframe)[0];
  }
  return ramp[0] ?? RAMPS.mainframe[0];
};

export const useGlyphPaint = (
  ref: RefObject<Element | null>,
  {
    colorMode,
    phosphor,
    ramp,
    invert,
    background = "paper",
  }: Pick<
    AsciiLook,
    "colorMode" | "phosphor" | "ramp" | "invert" | "background"
  >
): GlyphPaint => {
  const theme = useAsciiColors(ref);
  const transparent = background === "transparent";
  const themeInk: Rgb8 = theme ? toBytes(theme[0]) : [230, 230, 230];
  const themePaper: Rgb8 = theme ? toBytes(theme[1]) : [10, 10, 10];
  const pageIsLight = luma(...themePaper) > 0.5;

  if (colorMode === "duotone") {
    const paper = rampPaper(ramp);
    return {
      darkIsDense: invert ?? (transparent ? pageIsLight : false),
      ink: "--ascii-ink",
      palette: [hexToRgb(paper), themeInk],
      paper: transparent ? "transparent" : paper,
    };
  }
  if (phosphor && (colorMode === undefined || colorMode === "mono")) {
    const preset = PHOSPHORS[phosphor];
    return {
      darkIsDense: invert ?? (transparent ? pageIsLight : false),
      ink: preset.ink,
      palette: [hexToRgb(preset.paper), hexToRgb(preset.ink)],
      paper: transparent ? "transparent" : preset.paper,
    };
  }
  return {
    darkIsDense: invert ?? pageIsLight,
    ink: "--ascii-ink",
    palette: [themePaper, themeInk],
    paper: transparent ? "transparent" : "--ascii-paper",
  };
};

export const packedDither = (
  look: Pick<AsciiLook, "charset" | "chars">
): "none" | "blue-noise" => {
  const { kind } = resolveCharset(look.charset ?? "standard", look.chars);
  return kind === "braille" || kind === "quadrants" ? "blue-noise" : "none";
};

export const lookToMapOptions = (
  look: AsciiLook,
  paint: GlyphPaint,
  fallbackMode: NonNullable<AsciiLook["colorMode"]> = "truecolor"
): MapOptions => ({
  ansi: look.ansi,
  chars: look.chars,
  charset: look.charset ?? "standard",
  colorMode: look.colorMode ?? fallbackMode,
  dither: look.dither ?? packedDither(look),
  edgeThreshold: look.edgeThreshold,
  grade: look.grade,
  invert: false,
  palette: paint.palette,
  ramp: look.ramp,
  threshold: look.threshold,
});

export const splitLook = <Props extends AsciiLook>({
  charset,
  chars,
  colorMode,
  phosphor,
  ramp,
  ansi,
  grade,
  invert,
  threshold,
  edgeThreshold,
  dither,
  background,
  fx,
  ...rest
}: Props) =>
  [
    {
      ansi,
      background,
      chars,
      charset,
      colorMode,
      dither,
      edgeThreshold,
      fx,
      grade,
      invert,
      phosphor,
      ramp,
      threshold,
    } satisfies AsciiLook,
    rest,
  ] as const;

export type MediaFit = "cover" | "contain" | "fill";

export type MediaTone = "luma" | "alpha";

export interface MediaInput {
  readonly element: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly key: string;
}

export interface MediaSampleOptions {
  readonly columns: number;
  readonly rows: number;
  readonly charset: Charset;
  
  readonly aspect: number;
  readonly fit: MediaFit;
  
  readonly focus: readonly [number, number];
  readonly mirror: boolean;
  readonly tone: MediaTone;
  readonly darkIsDense: boolean;
  
  readonly levels: boolean;
}

const coverCrop = (
  { width, height }: Pick<MediaInput, "width" | "height">,
  aspect: number,
  [focusX, focusY]: readonly [number, number]
): SampleCrop => {
  const sourceAspect = width / Math.max(1, height);
  if (sourceAspect > aspect) {
    const keep = aspect / sourceAspect;
    return { height: 1, width: keep, x: (1 - keep) * focusX, y: 0 };
  }
  const keep = sourceAspect / aspect;
  return { height: keep, width: 1, x: 0, y: (1 - keep) * focusY };
};

export const sampleMedia = (
  source: MediaInput,
  field: ToneField,
  options: MediaSampleOptions
): void => {
  const { aspect, fit } = options;
  sampleToField(source.element, {
    aspect,
    charset: options.charset,
    columns: options.columns,
    crop:
      fit === "cover" ? coverCrop(source, aspect, options.focus) : undefined,
    fit: fit === "cover" ? "fill" : fit,
    into: field,
    mirror: options.mirror,
    rows: options.rows,
  });
  const { tones, colors } = field;
  if (options.tone === "alpha") {
    for (let index = 0; index < tones.length; index += 1) {
      tones[index] = (colors?.[index * 4 + 3] ?? 0) / 255;
    }
    return;
  }
  if (options.levels) {
    stretchLevels(field, 1);
  }
  if (options.darkIsDense) {
    for (let index = 0; index < tones.length; index += 1) {
      const cover = (colors?.[index * 4 + 3] ?? 255) / 255;
      tones[index] = Math.max(0, cover - (tones[index] ?? 0));
    }
  }
};

export type ImageState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly source: MediaInput }
  | { readonly status: "error" };

export const useLoadedImage = (
  src: string | null,
  crossOrigin: ComponentProps<"img">["crossOrigin"] = "anonymous"
): ImageState => {
  const [state, setState] = useState<ImageState>({ status: "loading" });
  useEffect(() => {
    let current = true;
    setState({ status: "loading" });
    if (src === null) {
      return;
    }
    const image = new Image();
    if (crossOrigin !== undefined) {
      image.crossOrigin = crossOrigin;
    }
    image.decoding = "async";
    image.src = src;
    const load = async () => {
      try {
        await image.decode();
      } catch {
        if (current) {
          setState({ status: "error" });
        }
        return;
      }
      if (current) {
        setState({
          source: {
            element: image,
            height: image.naturalHeight || 1,
            key: src,
            width: image.naturalWidth || 1,
          },
          status: "ready",
        });
      }
    };
    load();
    return () => {
      current = false;
    };
  }, [src, crossOrigin]);
  return state;
};

export interface MediaDrawContext extends AsciiGridDrawContext {
  readonly charset: Charset;
  
  readonly box: { readonly width: number; readonly height: number };
}

export type MediaStatus = "loading" | "ready" | "error";

export interface AsciiMediaProps
  extends AsciiLook, Omit<ComponentProps<"div">, "children"> {
  
  source: MediaInput | null;
  
  status?: MediaStatus;
  
  placeholder?: boolean;
  
  message?: string;
  
  fit?: MediaFit;
  
  focus?: readonly [number, number];
  
  mirror?: boolean;
  
  tone?: MediaTone;
  
  autoLevels?: boolean;
  
  live?: boolean;
  
  ink?: AsciiColor;
  
  defaultColorMode?: NonNullable<AsciiLook["colorMode"]>;
  
  shape?: (field: ToneField, context: MediaDrawContext) => void;
  
  finish?: (frame: MutableFrame, context: MediaDrawContext) => void;
  
  cell?: number;
  
  animate?: boolean;
  
  fps?: number;
  
  handle?: RefObject<AsciiHandle | null>;
}

interface FieldCache {
  key: string;
  base: ToneField;
  work: ToneField;
}

const hash = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43_758.5453;
  return value - Math.floor(value);
};

const drawPlaceholder = (
  context: AsciiGridDrawContext,
  status: Exclude<MediaStatus, "ready">,
  message: string
) => {
  const { frame, columns, rows, time } = context;
  const sweep = (time * 0.45) % 1.6;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const u = column / Math.max(1, columns - 1);
      const v = row / Math.max(1, rows - 1);
      const band =
        status === "loading"
          ? Math.exp(-((u + v * 0.35 - sweep + 0.2) ** 2) * 60)
          : 0;
      const grain = hash(column, row);
      const tone = 0.06 + band * 0.5;
      if (grain < tone) {
        frame.put(column, row, grain < tone * 0.4 ? ":" : "·");
      }
    }
  }
  const spinner = SPINNERS.braille;
  const label =
    status === "loading"
      ? `${spinner[Math.floor(time * 12) % spinner.length] ?? ""} loading`
      : `[ ${message} ]`;
  const text = label.slice(0, columns);
  const x = Math.floor((columns - text.length) / 2);
  const y = Math.floor(rows / 2);
  frame.fillRect(x - 1, y, text.length + 2, 1, " ");
  frame.write(x, y, text);
};

const CENTRE = [0.5, 0.5] as const;

export const AsciiMedia = (props: AsciiMediaProps) => {
  const [
    look,
    {
      source,
      status = "ready",
      placeholder = true,
      message = "image unavailable",
      fit = "cover",
      focus = CENTRE,
      mirror = false,
      tone = "luma",
      autoLevels = true,
      live = false,
      ink,
      defaultColorMode = "truecolor",
      shape,
      finish,
      cell = 10,
      animate = false,
      fps = 30,
      handle,
      className,
      ...rest
    },
  ] = splitLook(props);
  const rootRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<FieldCache | null>(null);
  const paint = useGlyphPaint(rootRef, look);
  const options = lookToMapOptions(look, paint, defaultColorMode);
  const resolved = resolveCharset(options.charset, options.chars);
  const mode = options.colorMode ?? "mono";

  const draw = (context: AsciiGridDrawContext) => {
    if (status !== "ready" || !source) {
      if (!placeholder) {
        return;
      }
      drawPlaceholder(
        context,
        status === "ready" ? "loading" : status,
        message
      );
      return;
    }
    const root = rootRef.current;
    const { columns, rows, metrics } = context;
    const box = {
      height: root?.clientHeight || rows * metrics.height,
      width: root?.clientWidth || columns * metrics.width,
    };
    const [gx, gy] = resolved.grid;
    const key = [
      source.key,
      columns,
      rows,
      gx,
      gy,
      metrics.width,
      metrics.height,
      box.width,
      box.height,
      fit,
      focus[0],
      focus[1],
      mirror,
      tone,
      autoLevels,
      paint.darkIsDense,
    ].join("|");
    let cache = cacheRef.current;
    if (!cache || cache.key !== key || live) {
      if (
        !cache ||
        cache.base.width !== columns * gx ||
        cache.base.height !== rows * gy
      ) {
        cache = {
          base: createToneField(columns, rows, resolved, { color: true }),
          key,
          work: createToneField(columns, rows, resolved, { color: true }),
        };
      }
      cache.key = key;
      sampleMedia(source, cache.base, {
        aspect: (columns * metrics.width) / (rows * metrics.height),
        charset: resolved,
        columns,
        darkIsDense: paint.darkIsDense,
        fit,
        focus,
        levels: autoLevels,
        mirror,
        rows,
        tone,
      });
      cacheRef.current = cache;
    }
    const mediaContext: MediaDrawContext = {
      ...context,
      box,
      charset: resolved,
    };
    let field = cache.base;
    if (shape) {
      cache.work.tones.set(cache.base.tones);
      if (cache.work.colors && cache.base.colors) {
        cache.work.colors.set(cache.base.colors);
      }
      shape(cache.work, mediaContext);
      field = cache.work;
    }
    mapTones(field, columns, rows, options, context.frame);
    finish?.(context.frame, mediaContext);
  };

  const grid = (
    <AsciiGrid
      ref={rootRef}
      draw={draw}
      cell={cell}
      ink={ink ?? paint.ink}
      paper={paint.paper}
      colored={mode !== "mono"}
      animate={animate || live || (placeholder && status === "loading")}
      fps={fps}
      handle={handle}
      data-status={status}
      className={cn("size-full", look.fx ? "absolute inset-0" : className)}
      {...(look.fx ? {} : rest)}
    />
  );
  if (!look.fx) {
    return grid;
  }
  
  return (
    <div className={cn("relative", className)} {...rest}>
      {grid}
      <CrtOverlay fx={look.fx} />
    </div>
  );
};


export const IMAGE_REVEALS = ["none", "spotlight", "photo"] as const;
export type ImageReveal = (typeof IMAGE_REVEALS)[number];

export interface AsciiImageProps
  extends AsciiLook, Omit<ComponentProps<"div">, "children"> {
  
  src: string;
  
  alt: string;
  
  fit?: MediaFit;
  
  focus?: readonly [number, number];
  
  autoLevels?: boolean;
  
  reveal?: ImageReveal;
  
  revealRadius?: number;
  
  intro?: boolean;
  
  cell?: number;
  
  animate?: boolean;
  
  crossOrigin?: ComponentProps<"img">["crossOrigin"];
  
  handle?: RefObject<AsciiHandle | null>;
}

const INTRO_MS = 900;

const SCRAMBLE = [..."⠁⠂⠄⡀⠈⠐⠠⢀·:"];

const resolveIn = (frame: MutableFrame, charset: Charset, progress: number) => {
  const { glyphs, columns } = frame;
  const ramp = charset.kind === "ramp" || charset.kind === "edge";
  const pool = ramp ? charset.glyphs.slice(1) : SCRAMBLE;
  for (let index = 0; index < glyphs.length; index += 1) {
    const column = index % columns;
    const row = (index - column) / columns;
    
    const order = hash(column, row) * 0.7 + (row / frame.rows) * 0.3;
    if (order > progress + 0.12) {
      glyphs[index] = " ";
    } else if (order > progress && glyphs[index] !== " ") {
      glyphs[index] =
        pool[Math.floor(hash(row + progress * 31, column) * pool.length)] ??
        "·";
    }
  }
};

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const AsciiImage = (props: AsciiImageProps) => {
  const [
    look,
    {
      src,
      alt,
      fit = "cover",
      focus,
      autoLevels = true,
      reveal = "none",
      revealRadius = 120,
      intro = true,
      cell = 10,
      animate = true,
      crossOrigin = "anonymous",
      handle,
      className,
      style,
      ...rest
    },
  ] = splitLook(props);
  const image = useLoadedImage(src, crossOrigin);
  const reducedMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ eased: 0, inside: false, x: 0, y: 0 });
  const intro0 = useRef({ at: 0, key: "" });
  const [introRunning, setIntroRunning] = useState(false);
  const playIntro = intro && animate && !reducedMotion;

  useEffect(() => {
    if (image.status !== "ready" || !playIntro) {
      setIntroRunning(false);
      return;
    }
    setIntroRunning(true);
    const timer = window.setTimeout(
      () => setIntroRunning(false),
      INTRO_MS + 120
    );
    return () => window.clearTimeout(timer);
  }, [image.status, playIntro]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || reveal === "none") {
      return;
    }
    const move = (event: PointerEvent) => {
      const box = wrapper.getBoundingClientRect();
      pointer.current.x = event.clientX - box.left;
      pointer.current.y = event.clientY - box.top;
      pointer.current.inside = true;
      wrapper.style.setProperty("--reveal-x", `${pointer.current.x}px`);
      wrapper.style.setProperty("--reveal-y", `${pointer.current.y}px`);
      wrapper.style.setProperty("--reveal-r", `${revealRadius}px`);
    };
    const leave = () => {
      pointer.current.inside = false;
      wrapper.style.setProperty("--reveal-r", "0px");
    };
    wrapper.addEventListener("pointermove", move, { passive: true });
    wrapper.addEventListener("pointerdown", move, { passive: true });
    wrapper.addEventListener("pointerleave", leave);
    wrapper.addEventListener("pointercancel", leave);
    return () => {
      wrapper.removeEventListener("pointermove", move);
      wrapper.removeEventListener("pointerdown", move);
      wrapper.removeEventListener("pointerleave", leave);
      wrapper.removeEventListener("pointercancel", leave);
    };
  }, [reveal, revealRadius]);

  const spotlight = (field: ToneField, context: MediaDrawContext) => {
    const state = pointer.current;
    
    const target = state.inside ? 1 : 0;
    const rate = context.delta > 0 ? Math.min(1, context.delta * 6) : 1;
    state.eased += (target - state.eased) * rate;
    if (state.eased < 0.01) {
      return;
    }
    const [gx, gy] = context.charset.grid;
    const sampleWidth = context.metrics.width / gx;
    const sampleHeight = context.metrics.height / gy;
    const floor = 1 - 0.75 * state.eased;
    for (let y = 0; y < field.height; y += 1) {
      const dy = (y + 0.5) * sampleHeight - state.y;
      for (let x = 0; x < field.width; x += 1) {
        const dx = (x + 0.5) * sampleWidth - state.x;
        const light = smoothstep(
          revealRadius,
          revealRadius * 0.35,
          Math.hypot(dx, dy)
        );
        const index = y * field.width + x;
        field.tones[index] =
          (field.tones[index] ?? 0) * (floor + (1 - floor) * light);
      }
    }
  };

  const finish = (frame: MutableFrame, context: MediaDrawContext) => {
    if (!playIntro) {
      return;
    }
    
    if (intro0.current.key !== src) {
      intro0.current = { at: performance.now(), key: src };
    }
    const progress = (performance.now() - intro0.current.at) / INTRO_MS;
    if (progress < 1) {
      resolveIn(frame, context.charset, progress * 1.12);
    }
  };

  const decorative = alt === "";
  const showPhoto = reveal === "photo" && image.status === "ready";

  return (
    <div
      ref={wrapperRef}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative ? true : undefined}
      data-status={image.status}
      className={cn("relative overflow-hidden", className)}
      style={
        {
          "--reveal-r": "0px",
          "--reveal-x": "50%",
          "--reveal-y": "50%",
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {showPhoto ? (
        
        <img
          src={src}
          alt=""
          crossOrigin={crossOrigin}
          className="absolute inset-0 size-full"
          style={{
            objectFit: fit,
            objectPosition: focus
              ? `${focus[0] * 100}% ${focus[1] * 100}%`
              : undefined,
          }}
        />
      ) : null}
      <AsciiMedia
        {...look}
        source={image.status === "ready" ? image.source : null}
        status={image.status}
        fit={fit}
        focus={focus}
        autoLevels={autoLevels}
        cell={cell}
        animate={
          animate &&
          (introRunning || reveal === "spotlight" || image.status === "loading")
        }
        shape={reveal === "spotlight" ? spotlight : undefined}
        finish={finish}
        handle={handle}
        className="absolute inset-0"
        style={
          showPhoto
            ? {
                maskImage:
                  "radial-gradient(circle at var(--reveal-x) var(--reveal-y), transparent calc(var(--reveal-r) * 0.5), black var(--reveal-r))",
              }
            : undefined
        }
      />
    </div>
  );
};

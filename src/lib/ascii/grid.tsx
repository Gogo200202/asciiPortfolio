"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentProps, ReactNode, RefObject } from "react";

import { resolveColor, subscribeToTheme } from "@/lib/ascii/color";
import { CrtOverlay } from "@/lib/ascii/crt";
import { MutableFrame } from "@/lib/ascii/frame";
import type { AsciiFrame, AsciiHandle } from "@/lib/ascii/frame";
import type { PostFx } from "@/lib/ascii/look";
import { gridSize, measureCell, readCell, readFont } from "@/lib/ascii/measure";
import type { CellMetrics } from "@/lib/ascii/measure";
import { useFrameLoop } from "@/lib/ascii/motion";
import type { FrameLoopState } from "@/lib/ascii/motion";
import { paintFrame } from "@/lib/ascii/paint";
import { cssColor } from "@/lib/ascii/tokens";
import type { AsciiColor, Rgba } from "@/lib/ascii/tokens";
import { cn } from "@/lib/utils";

export interface GridPointer {
  x: number;
  y: number;
  
  inside: boolean;
  
  down: boolean;
}

export interface AsciiGridDrawContext {
  
  readonly frame: MutableFrame;
  readonly columns: number;
  readonly rows: number;
  
  readonly time: number;
  
  readonly delta: number;
  
  readonly pointer: Readonly<GridPointer>;
  readonly metrics: CellMetrics;
}

export type AsciiGridState = "fallback" | FrameLoopState;

export interface AsciiGridProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  
  draw: (context: AsciiGridDrawContext) => void;
  
  cell?: number;
  
  square?: boolean;
  
  ink?: AsciiColor;
  
  paper?: AsciiColor | "transparent";
  
  colored?: boolean;
  
  speed?: number;
  
  animate?: boolean;
  
  fps?: number;
  
  dpr?: number;
  
  stillTime?: number;
  
  interactive?: boolean;
  
  fallback?: ReactNode;
  
  handle?: RefObject<AsciiHandle | null>;
  
  fx?: PostFx;
}

const CANVAS_CLASS = "absolute top-0 left-0 block";

const toCss = ([r, g, b, a]: Rgba) =>
  `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;

export const AsciiGrid = ({
  draw,
  cell,
  square = false,
  ink = "--ascii-ink",
  paper = "transparent",
  colored = false,
  speed = 1,
  animate = true,
  fps = 30,
  dpr,
  stillTime = 0,
  interactive = false,
  fallback,
  handle,
  fx,
  className,
  style,
  "aria-hidden": ariaHidden = true,
  ref,
  ...props
}: AsciiGridProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const setRoot = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === "function") {
      return ref(node);
    }
    if (ref) {
      ref.current = node;
    }
  };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(new MutableFrame(0, 0, { color: colored }));
  const metricsRef = useRef<CellMetrics | null>(null);
  const pointerRef = useRef<GridPointer>({
    down: false,
    inside: false,
    x: -1,
    y: -1,
  });
  const timeRef = useRef(stillTime);
  const deltaRef = useRef(0);
  const colorsRef = useRef({ ink: "#fff", paper: null as string | null });
  const [hasFrame, setHasFrame] = useState(false);

  const live = useRef({ colored, draw, speed });
  useEffect(() => {
    live.current = { colored, draw, speed };
  });

  const paint = () => {
    const canvas = canvasRef.current;
    const metrics = metricsRef.current;
    const context = canvas?.getContext("2d");
    if (!(canvas && metrics && context)) {
      return;
    }
    const frame = frameRef.current;
    frame.setColored(live.current.colored);
    frame.clear();
    live.current.draw({
      columns: frame.columns,
      delta: deltaRef.current,
      frame,
      metrics,
      pointer: pointerRef.current,
      rows: frame.rows,
      time: timeRef.current,
    });

    paintFrame(context, frame, metrics, colorsRef.current);
    if (!hasFrame) {
      setHasFrame(true);
    }
  };
  const paintRef = useRef(paint);
  useEffect(() => {
    paintRef.current = paint;
  });

  const loopState = useFrameLoop(
    (time, delta) => {
      if (delta > 0) {
        timeRef.current += delta * live.current.speed;
      } else {
        timeRef.current = time;
      }
      deltaRef.current = delta * live.current.speed;
      paintRef.current();
    },
    { enabled: animate, fps, stillTime, target: rootRef }
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.className = CANVAS_CLASS;
    root.append(canvas);
    canvasRef.current = canvas;

    const resolveColors = () => {
      colorsRef.current = {
        ink: toCss(resolveColor(ink, root)),
        paper:
          paper === "transparent" ? null : toCss(resolveColor(paper, root)),
      };
    };
    const resize = () => {
      const metrics = measureCell({
        cell: cell ?? readCell(root),
        
        dpr:
          dpr === undefined
            ? undefined
            : Math.min(dpr, window.devicePixelRatio || 1),
        font: readFont(root),
        square,
      });
      metricsRef.current = metrics;
      const computed = getComputedStyle(root);
      const width = Number.parseFloat(computed.width) || root.offsetWidth;
      const height = Number.parseFloat(computed.height) || root.offsetHeight;
      const { columns, rows } = gridSize(metrics, width, height);
      frameRef.current.resize(columns, rows);
      canvas.width = columns * metrics.deviceWidth;
      canvas.height = rows * metrics.deviceHeight;
      canvas.style.width = `${columns * metrics.width}px`;
      canvas.style.height = `${rows * metrics.height}px`;
      paintRef.current();
    };
    const onTheme = () => {
      resolveColors();
      paintRef.current();
    };

    const dprWatch = new AbortController();
    const watchDpr = () => {
      const query = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`
      );
      const onChange = () => {
        resize();
        watchDpr();
      };
      query.addEventListener("change", onChange, {
        once: true,
        signal: dprWatch.signal,
      });
    };

    resolveColors();
    resize();
    watchDpr();
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    const unsubscribe = subscribeToTheme(onTheme);
    document.fonts?.addEventListener?.("loadingdone", resize);
    return () => {
      observer.disconnect();
      dprWatch.abort();
      unsubscribe();
      document.fonts?.removeEventListener?.("loadingdone", resize);
      canvas.remove();
      canvasRef.current = null;
      setHasFrame(false);
    };
  }, [cell, square, ink, paper, dpr]);

  useEffect(() => {
    const root = rootRef.current;
    if (!(root && interactive)) {
      return;
    }
    const pointer = pointerRef.current;
    const move = (event: PointerEvent) => {
      const metrics = metricsRef.current;
      if (!metrics) {
        return;
      }
      const box = root.getBoundingClientRect();
      pointer.x = (event.clientX - box.left) / metrics.width;
      pointer.y = (event.clientY - box.top) / metrics.height;
      pointer.inside = true;
    };
    const leave = () => {
      pointer.inside = false;
      pointer.down = false;
    };
    const down = (event: PointerEvent) => {
      pointer.down = true;
      move(event);
    };
    const up = () => {
      pointer.down = false;
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerdown", down);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointerleave", leave);
    };
  }, [interactive]);

  useEffect(() => {
    if (!handle) {
      return;
    }
    const value: AsciiHandle = {
      get canvas() {
        return canvasRef.current;
      },
      capture: (): AsciiFrame | null => {
        const frame = frameRef.current;
        if (frame.columns === 0) {
          return null;
        }
        return {
          colors: frame.colors ? new Uint8ClampedArray(frame.colors) : null,
          columns: frame.columns,
          glyphs: [...frame.glyphs],
          rows: frame.rows,
        };
      },
      colors: () => colorsRef.current,
      metrics: () => metricsRef.current,
    };
    handle.current = value;
    return () => {
      handle.current = null;
    };
  }, [handle]);

  useEffect(() => {
    if (loopState !== "running") {
      paintRef.current();
    }
  });

  const state: AsciiGridState = hasFrame ? loopState : "fallback";

  return (
    <div
      ref={setRoot}
      aria-hidden={ariaHidden}
      data-state={state}
      className={cn(
        "group/ascii relative overflow-hidden",
        interactive ? "touch-none" : "pointer-events-none",
        className
      )}
      style={{ color: cssColor(ink), ...style }}
      {...props}
    >
      {fallback && !hasFrame ? (
        <div className="absolute inset-0">{fallback}</div>
      ) : null}
      {fx ? <CrtOverlay fx={fx} /> : null}
    </div>
  );
};

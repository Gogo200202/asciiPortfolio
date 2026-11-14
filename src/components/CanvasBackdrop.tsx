"use client";

import { useEffect, useRef } from "react";

import { AsciiCanvas } from "@/components/asciicn/ascii-canvas";

/**
 * The asciicn glyph pad used as the page backdrop.
 *
 * The pad sits behind the page with pointer events off, so links and
 * selection keep working. A window listener forwards mouse movement to the
 * pad, which lets its brush follow the cursor, and forwards clicks so they
 * send ripples through the ink. When the cursor stops, the pad's idle ghost
 * brush takes over. `inert` keeps the decorative pad out of focus order.
 */
export function CanvasBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pad = hostRef.current?.querySelector<HTMLElement>(
      '[role="application"]'
    );
    if (!pad) {
      return;
    }

    let frame = 0;
    let pending: { x: number; y: number } | null = null;
    let pressed = false;

    const send = (
      type: "pointermove" | "pointerdown" | "pointerup",
      x: number,
      y: number,
      buttons: number
    ) => {
      pad.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          button: 0,
          buttons,
          clientX: x,
          clientY: y,
          // An impossible id: the pad's setPointerCapture then throws and is
          // ignored, so the real pointer keeps hitting links and text.
          pointerId: 99999,
          pointerType: "mouse",
        })
      );
    };

    const forwardMove = () => {
      frame = 0;
      if (!pending) {
        return;
      }
      const { x, y } = pending;
      pending = null;
      send("pointermove", x, y, 0);
    };

    const onMove = (event: PointerEvent) => {
      // Ignore the synthetic events this effect dispatches back into the pad.
      if (!event.isTrusted) {
        return;
      }
      // A release outside the window can be missed; reset before hovering.
      if (pressed && event.buttons === 0) {
        pressed = false;
        send("pointerup", event.clientX, event.clientY, 0);
      }
      // Touch is for scrolling; a held button is for selecting or dragging.
      if (event.pointerType !== "mouse" || event.buttons !== 0) {
        return;
      }
      pending = { x: event.clientX, y: event.clientY };
      if (frame === 0) {
        frame = requestAnimationFrame(forwardMove);
      }
    };

    const onDown = (event: PointerEvent) => {
      if (!event.isTrusted) {
        return;
      }
      if (event.pointerType !== "mouse" || event.button !== 0) {
        return;
      }
      pressed = true;
      send("pointerdown", event.clientX, event.clientY, 1);
    };

    const onUp = (event: PointerEvent) => {
      if (!event.isTrusted || !pressed) {
        return;
      }
      pressed = false;
      send("pointerup", event.clientX, event.clientY, 0);
    };

    const release = () => {
      if (!pressed) {
        return;
      }
      pressed = false;
      send("pointerup", -1, -1, 0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      inert
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <AsciiCanvas
        aria-hidden="true"
        tabIndex={-1}
        background="transparent"
        cell={14}
        speed={0.8}
        fps={30}
        dpr={1.5}
        inks={["--foreground"]}
        ripples
        clearButton={false}
        hint={false}
        className="h-full w-full opacity-70"
      />
    </div>
  );
}

export default CanvasBackdrop;

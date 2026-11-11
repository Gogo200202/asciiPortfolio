import { useEffect, useRef } from "react";
import { play } from "ascii-magic-art/runtime/player.js";
import { CELL_W, cellAspect } from "ascii-magic-art/runtime/canvas.js";
import { dot } from "ascii-magic-art/lib/kit";

function AsciiBackground({ piece }) {
  const ref = useRef(null);

  useEffect(() => {
    const pre = ref.current;
    if (!pre) return;

    const { cols, rows } = piece.meta;
    const aspect = cellAspect(piece.meta);

    const fit = () => {
      const px = Math.max(
        window.innerWidth / (cols * CELL_W),
        window.innerHeight / (rows * CELL_W * aspect),
      );
      pre.style.fontSize = `${px}px`;
    };

    fit();
    const stop = play(ref.current, piece, {
      look: { look: "squares", gamma: 1 },
    });
    const canvas = pre._canvas;
    if (canvas) {
      canvas.style.maxWidth = "none";
      canvas.style.position = "absolute";
      canvas.style.top = "50%";
      canvas.style.left = "50%";
      canvas.style.transform = "translate(-50%, -50%)";
    }

    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      stop();
      canvas?.remove();
      delete pre._canvas;
    };
  }, [piece]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <pre ref={ref} aria-hidden="true" style={{ margin: 0 }} />
    </div>
  );
}

export default AsciiBackground;

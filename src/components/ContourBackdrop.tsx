"use client";

import { AsciiShader } from "@/lib/ascii/shader";

const CONTOUR_FIELD =  `
float contourHeight(vec2 p, float t) {
  float h = snoise(p * vec2(1.15, 0.85) + vec2(t * 0.014, -t * 0.009));
  h += 0.34 * snoise(p * vec2(2.35, 1.95) + vec2(-t * 0.021, t * 0.012));
  h += 0.38 * (p.y - 0.5);
  return h;
}

float contourLine(float h, float hx, float hy, float count, float width) {
  float v = h * count;
  float offset = abs(fract(v + 0.5) - 0.5);
  float perSample = max(length(vec2(hx - h, hy - h)) * count, 1e-4);
  float d = offset / perSample;
  return (1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, d))
       * (1.0 - smoothstep(0.06, 0.11, offset));
}

float field(vec2 uv, vec2 res, float t) {
  float aspect = res.x / res.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float px = 1.0 / res.y;

  float h = contourHeight(p, t);
  float hx = contourHeight(p + vec2(px, 0.0), t);
  float hy = contourHeight(p + vec2(0.0, px), t);
  float lines = contourLine(h, hx, hy, 9.0, 1.4);

  vec2 q = vec2((uv.x - 0.5) * 2.0, (uv.y - 0.48) * 1.35);
  float core = smoothstep(0.16, 0.95, length(q));
  float mask = mix(0.3, 1.0, core);

  mask *= smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x);
  mask *= smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.86, uv.y);

  return lines * mask;
}
`;

export function ContourBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <AsciiShader
        field={CONTOUR_FIELD}
        charset="braille"
        colorMode="palette"
        palette={["--ascii-paper", "--ascii-color-blue", "--ascii-ink"]}
        background="transparent"
        cell={12}
        speed={0.85}
        stillTime={42}
        grade={{ contrast: 1.12 }}
        fx={{ vignette: 0.18 }}
        className="absolute inset-0 opacity-[0.78]"
      />
    </div>
  );
}

export default ContourBackdrop;

import { useEffect, useRef } from "react";

/**
 * Living dithered background (WebGL). Thin ridged light-veins drift upward through a domain-warped field,
 * bend away from the cursor like a lens and ring outward on click. The result is quantised with an 8x8
 * Bayer matrix so it reads as chunky monochrome dots. Pauses off-screen / hidden and renders one still
 * frame when the visitor prefers reduced motion.
 */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;      // 0..1, y up
uniform float uMouseOn;   // 0..1 fade
uniform vec3 uClick;      // x, y (0..1), age in seconds
uniform float uDim;       // centre dimming strength (keeps text readable)

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; }
  return v;
}
float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main(){
  float aspect = uRes.x / uRes.y;
  vec2 st = gl_FragCoord.xy / uRes;
  vec2 uv = vec2(st.x * aspect, st.y);

  // Cursor acts as a repelling lens.
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  vec2 d = uv - m;
  float r = length(d);
  uv += normalize(d + 1e-4) * 0.16 * uMouseOn * exp(-r * r * 9.0);

  // Click shockwave.
  vec2 c = vec2(uClick.x * aspect, uClick.y);
  float cr = length(uv - c);
  float ring = exp(-pow((cr - uClick.z * 0.9) * 11.0, 2.0)) * exp(-uClick.z * 1.4);
  uv += normalize(uv - c + 1e-4) * ring * 0.05;

  float t = uTime * 0.07;
  vec2 p = uv * vec2(1.35, 1.9);
  p.y -= t * 2.2;                       // upward drift
  p.x += sin(uv.y * 2.4 + uTime * 0.18) * 0.18;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 w = vec2(fbm(p + 2.6 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p + 2.6 * q + vec2(8.3, 2.8) - t * 0.5));
  float n = fbm(p + 2.8 * w);

  float ridges = pow(1.0 - abs(n * 2.0 - 1.0), 5.0);        // thin glowing veins
  float body = smoothstep(0.55, 1.0, n) * 0.32;            // soft mass under the veins
  float v = pow(max(ridges * 0.9, body), 1.25) + ring * 0.7;

  // Keep the middle calm so headline text stays legible.
  vec2 cc = (st - 0.5) * vec2(0.85, 1.6);
  float centre = smoothstep(0.12, 0.78, length(cc));
  v *= mix(1.0, 0.04 + 0.96 * centre, uDim);
  // Fade towards the bottom edge.
  v *= smoothstep(0.0, 0.22, st.y) * 0.65 + 0.35;
  v = clamp(v, 0.0, 1.0);

  float th = bayer8(gl_FragCoord.xy);
  float on = step(th, v);
  // Halloween: deep ember in the shadows, pumpkin orange to hot yellow in the veins.
  vec3 fg = mix(vec3(0.50, 0.12, 0.02), vec3(1.0, 0.45, 0.04), smoothstep(0.1, 0.6, v));
  fg = mix(fg, vec3(1.0, 0.82, 0.35), smoothstep(0.75, 1.0, v));
  vec3 col = on * fg;
  gl_FragColor = vec4(col, 1.0);
}
`;

type Props = {
  className?: string;
  /** CSS pixels per dither dot. */
  cell?: number;
  /** 0..1, how much the centre is dimmed. */
  dim?: number;
  /** Follow the pointer and ripple on click. */
  interactive?: boolean;
};

export function DitherBackground({ className = "", cell = 4, dim = 1, interactive = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uTime = u("uTime"), uMouse = u("uMouse"), uMouseOn = u("uMouseOn"), uClick = u("uClick"), uDim = u("uDim");
    gl.uniform1f(uDim, dim);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, on: 0, ton: 0 };
    const click = { x: 0.5, y: 0.5, at: -100 };
    let visible = true;
    let raf = 0;
    const start = performance.now();

    const resize = () => {
      const w = Math.max(2, Math.ceil(canvas.clientWidth / cell));
      const h = Math.max(2, Math.ceil(canvas.clientHeight / cell));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const frame = (now: number) => {
      resize();
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      mouse.on += (mouse.ton - mouse.on) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 12 : (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uMouseOn, mouse.on);
      gl.uniform3f(uClick, click.x, click.y, Math.min(8, (now - click.at) / 1000));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame);
      else raf = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => { if (!document.hidden) kick(); };
    document.addEventListener("visibilitychange", onVis);

    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      mouse.tx = p.x; mouse.ty = p.y; mouse.ton = p.inside ? 1 : 0;
    };
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e);
      if (!p.inside) return;
      click.x = p.x; click.y = p.y; click.at = performance.now();
      kick();
    };
    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
    }

    kick();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [cell, dim, interactive]);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} style={{ imageRendering: "pixelated" }} aria-hidden="true" />;
}

export default DitherBackground;

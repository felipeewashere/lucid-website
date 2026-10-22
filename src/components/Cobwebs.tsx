import { useEffect, useRef } from "react";

/**
 * Cobwebs hanging in the top corners of the page (they scroll away with the page). Swipe the mouse (or a finger) across a strand to cut it; every strand that
 * loses its connection to the corner falls away. Webs grow back a while after the last cut.
 */

const RADIALS = 8;
const RINGS = 6;
const GRAVITY = 700;
const FALL_TIME = 1.6;
const REGROW_AFTER = 30; // seconds since the last cut
const FADE_IN = 1.5;

interface Node { x: number; y: number }
interface Seg { a: number; b: number; spiral: boolean; cut: boolean; cutAt: number; drift: number; grownAt: number }
interface Web { nodes: Node[]; segs: Seg[]; spider?: { node: number; len: number; cut: boolean; cutAt: number; grownAt: number; phase: number } }

/** Small deterministic noise so the web looks hand-spun but never jumps between renders. */
const noise = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function buildWeb(side: "left" | "right", ox: number, oy: number, size: number, spider: boolean, seed: number): Web {
  const dir = side === "left" ? 1 : -1;
  const nodes: Node[] = [{ x: ox, y: oy }];
  const index = (i: number, k: number) => 1 + i * RINGS + (k - 1);
  for (let i = 0; i < RADIALS; i++) {
    const theta = (i / (RADIALS - 1)) * (Math.PI / 2);
    for (let k = 1; k <= RINGS; k++) {
      const r = size * Math.pow(k / RINGS, 0.92);
      const j = (noise(seed + i * 13 + k * 7) - 0.5) * (k === RINGS ? 14 : 8);
      nodes.push({ x: ox + dir * Math.cos(theta) * (r + j), y: oy + Math.sin(theta) * (r + j) });
    }
  }
  const segs: Seg[] = [];
  const add = (a: number, b: number, spiral: boolean) =>
    segs.push({ a, b, spiral, cut: false, cutAt: 0, drift: (noise(a * 3 + b + seed) - 0.5) * 80, grownAt: -99 });
  for (let i = 0; i < RADIALS; i++) {
    add(0, index(i, 1), false);
    for (let k = 2; k <= RINGS; k++) add(index(i, k - 1), index(i, k), false);
  }
  for (let i = 0; i < RADIALS - 1; i++) for (let k = 2; k <= RINGS; k++) add(index(i, k), index(i + 1, k), true);

  return { nodes, segs, spider: spider ? { node: index(Math.floor(RADIALS / 2), RINGS - 1), len: 80, cut: false, cutAt: 0, grownAt: -99, phase: seed } : undefined };
}

function ccw(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
}
function crosses(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  return ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) && ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy);
}

/** Mark every strand not connected to the corner anchor as fallen. */
function settle(web: Web, now: number) {
  const reach = new Set<number>([0]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const s of web.segs) {
      if (s.cut) continue;
      if (reach.has(s.a) && !reach.has(s.b)) { reach.add(s.b); grew = true; }
      else if (reach.has(s.b) && !reach.has(s.a)) { reach.add(s.a); grew = true; }
    }
  }
  for (const s of web.segs) {
    if (!s.cut && !reach.has(s.a) && !reach.has(s.b)) { s.cut = true; s.cutAt = now; }
  }
  if (web.spider && !web.spider.cut && !reach.has(web.spider.node)) {
    web.spider.cut = true;
    web.spider.cutAt = now;
  }
}

function drawSpider(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(20,12,30,0.95)";
  ctx.lineWidth = 1.2;
  for (let s = -1; s <= 1; s += 2) {
    for (let l = 0; l < 4; l++) {
      const wiggle = Math.sin(t * 6 + l) * 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s * (7 + l), -5 + l * 3.2 + wiggle);
      ctx.lineTo(s * (11 + l * 1.4), -2 + l * 4.5 + wiggle);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#14091f";
  ctx.shadowColor = "rgba(255,120,20,0.8)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(0, 2, 5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -5, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff7a1a";
  ctx.beginPath();
  ctx.arc(-1.2, -5.6, 0.8, 0, Math.PI * 2);
  ctx.arc(1.2, -5.6, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function Cobwebs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let webs: Web[] = [];
    let W = 0;
    let H = 0;
    let lastCut = -999;
    let raf = 0;
    const t0 = performance.now();
    const clock = () => (performance.now() - t0) / 1000;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const desktop = window.innerWidth >= 768;
      const left = desktop ? 64 : 0; // sit beside the side bar / under the mobile bar
      const top = desktop ? 0 : 56;
      const size = Math.max(170, Math.min(330, Math.min(W, 900) * 0.3));
      webs = [
        buildWeb("left", left, top, size, false, 11),
      ];
    };
    build();
    window.addEventListener("resize", build);

    let prev: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      // The canvas scrolls with the page, so work in canvas coordinates.
      const rect = canvas.getBoundingClientRect();
      const cur = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (prev && Math.hypot(cur.x - prev.x, cur.y - prev.y) > 1.5) {
        const now = clock();
        for (const w of webs) {
          let any = false;
          for (const s of w.segs) {
            if (s.cut) continue;
            const A = w.nodes[s.a], B = w.nodes[s.b];
            if (crosses(prev.x, prev.y, cur.x, cur.y, A.x, A.y, B.x, B.y)) { s.cut = true; s.cutAt = now; any = true; }
          }
          const sp = w.spider;
          if (sp && !sp.cut) {
            const N = w.nodes[sp.node];
            const sway = Math.sin(now * 1.3 + sp.phase) * 6;
            if (crosses(prev.x, prev.y, cur.x, cur.y, N.x, N.y, N.x + sway, N.y + sp.len)) { sp.cut = true; sp.cutAt = now; any = true; }
          }
          if (any) { settle(w, now); lastCut = now; }
        }
      }
      prev = cur;
    };
    const onLeave = () => { prev = null; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    const frame = () => {
      const now = clock();
      ctx.clearRect(0, 0, W, H);

      if (lastCut > 0 && now - lastCut > REGROW_AFTER) {
        for (const w of webs) {
          for (const s of w.segs) if (s.cut) { s.cut = false; s.grownAt = now; }
          if (w.spider?.cut) { w.spider.cut = false; w.spider.grownAt = now; }
        }
        lastCut = -999;
      }

      ctx.lineCap = "round";
      for (const w of webs) {
        const anchor = w.nodes[0];
        for (const s of w.segs) {
          const A = w.nodes[s.a], B = w.nodes[s.b];
          let ox = 0, oy = 0, alpha = 0.42;
          if (s.cut) {
            const age = now - s.cutAt;
            if (age > FALL_TIME) continue;
            oy = 0.5 * GRAVITY * age * age;
            ox = s.drift * age;
            alpha = 0.42 * (1 - age / FALL_TIME);
          } else {
            alpha *= Math.min(1, (now - s.grownAt) / FADE_IN);
          }
          ctx.strokeStyle = `rgba(232,222,255,${alpha})`;
          ctx.lineWidth = s.spiral ? 0.8 : 1.1;
          ctx.beginPath();
          ctx.moveTo(A.x + ox, A.y + oy);
          if (s.spiral) {
            // spiral threads sag a little towards the corner
            const mx = (A.x + B.x) / 2 + (anchor.x - (A.x + B.x) / 2) * 0.1;
            const my = (A.y + B.y) / 2 + (anchor.y - (A.y + B.y) / 2) * 0.1;
            ctx.quadraticCurveTo(mx + ox, my + oy, B.x + ox, B.y + oy);
          } else {
            ctx.lineTo(B.x + ox, B.y + oy);
          }
          ctx.stroke();
        }

        const sp = w.spider;
        if (sp) {
          const N = w.nodes[sp.node];
          if (!sp.cut) {
            const sway = Math.sin(now * 1.3 + sp.phase) * 6;
            const bob = Math.sin(now * 0.9 + sp.phase) * 4;
            const len = sp.len + bob;
            const fade = Math.min(1, (now - sp.grownAt) / FADE_IN);
            ctx.strokeStyle = `rgba(232,222,255,${0.5 * fade})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(N.x, N.y);
            ctx.lineTo(N.x + sway, N.y + len);
            ctx.stroke();
            drawSpider(ctx, N.x + sway, N.y + len + 6, now, fade);
          } else {
            const age = now - sp.cutAt;
            if (age < FALL_TIME + 0.8) {
              const sway = Math.sin(sp.cutAt * 1.3 + sp.phase) * 6;
              const y = N.y + sp.len + 6 + 0.5 * GRAVITY * age * age;
              drawSpider(ctx, N.x + sway, y, now, Math.max(0, 1 - age / (FALL_TIME + 0.8)));
            }
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-[480px] w-full" aria-hidden="true" />;
}

export default Cobwebs;

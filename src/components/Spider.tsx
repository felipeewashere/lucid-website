import { useEffect, useRef } from "react";

/**
 * A spider that lives in the browser window: it drops in on a silk thread, then wanders the viewport on eight legs.
 * Feet are planted in screen space and step in two alternating groups of four (the real spider gait), each leg solved
 * with two-segment IK, so it walks instead of sliding. It pauses, grooms, runs from the cursor, and now and then climbs
 * back up its thread and drops in somewhere else. Purely decorative: click-through, hidden for reduced motion, paused
 * while the tab is hidden. Everything is drawn by mutating SVG attributes in one rAF loop (no React renders per frame).
 */

type V = { x: number; y: number };
type Leg = {
  side: -1 | 1;
  row: number;
  group: 0 | 1;
  hip: V; // local, body space (forward = -y)
  home: V; // local resting foot
  foot: V; // world, where the foot is planted
  from: V;
  to: V;
  t: number; // swing progress, 1 = planted
  line: SVGPathElement;
  rim: SVGPathElement;
  shade: SVGPathElement;
};

const FEMUR = 15;
const TIBIA = 21;
const STEP_TIME = 0.11;

const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const len = (a: V) => Math.hypot(a.x, a.y);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: V, b: V, t: number): V => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const f = (n: number) => n.toFixed(1);

const SVG = "http://www.w3.org/2000/svg";
function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
}

export function Spider() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    // ── drawing ──────────────────────────────────────────────────────────
    const silk = el("line", { stroke: "hsl(30 30% 85%)", "stroke-width": 0.8, opacity: 0, "stroke-linecap": "round" }, svg);
    const shadowLayer = el("g", { opacity: 0.45 }, svg);
    const legLayer = el("g", {}, svg);
    const body = el("g", {}, svg);
    el("ellipse", { cx: 2.5, cy: 10, rx: 9, ry: 12, fill: "#000", opacity: 0.35, filter: "url(#spider-blur)" }, body);
    const abdomen = el("g", {}, body);
    el("ellipse", { cx: 0, cy: 10, rx: 8.6, ry: 11.2, fill: "url(#spider-abdomen)", stroke: "hsl(25 100% 55% / 0.55)", "stroke-width": 0.7 }, abdomen);
    // An orange hourglass-ish marking so it reads as a spider at a glance.
    el("path", { d: "M-2.6 5 L2.6 5 L0.9 9.5 L2.8 14.5 L-2.8 14.5 L-0.9 9.5Z", fill: "hsl(25 100% 55%)", opacity: 0.85 }, abdomen);
    el("path", { d: "M-5 2Q0 4 5 2M-6 18Q0 20.5 6 18", fill: "none", stroke: "hsl(25 60% 70%)", "stroke-width": 0.5, opacity: 0.3 }, abdomen);
    el("ellipse", { cx: 0, cy: -4, rx: 6, ry: 6.8, fill: "url(#spider-head)", stroke: "hsl(25 100% 55% / 0.5)", "stroke-width": 0.6 }, body);
    const palps = el("path", { d: "M-2.5 -9.5Q-4.5 -13 -3 -15.5M2.5 -9.5Q4.5 -13 3 -15.5", fill: "none", stroke: "#2a1d16", "stroke-width": 1.6, "stroke-linecap": "round" }, body);
    for (const [x, y, r] of [[-1.4, -8.6, 0.85], [1.4, -8.6, 0.85], [-3, -7.6, 0.55], [3, -7.6, 0.55]] as const)
      el("circle", { cx: x, cy: y, r, fill: "hsl(25 100% 62%)", filter: "url(#spider-glow)" }, body);

    const legs: Leg[] = [];
    for (const side of [-1, 1] as const)
      for (let row = 0; row < 4; row++) {
        const hip = { x: side * 3.2, y: [-5.5, -2.5, 0.5, 3.5][row] };
        const home = { x: side * [21, 27, 27, 22][row], y: [-24, -9, 7, 22][row] };
        legs.push({
          side, row, group: ((row + (side > 0 ? 1 : 0)) % 2) as 0 | 1, hip, home,
          foot: { x: 0, y: 0 }, from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, t: 1,
          shade: el("path", { fill: "none", stroke: "#000", "stroke-width": 3.4, "stroke-linecap": "round", "stroke-linejoin": "round" }, shadowLayer),
          line: el("path", { fill: "none", stroke: "url(#spider-leg)", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, legLayer),
          // Thin orange rim light so the legs read on the near-black page.
          rim: el("path", { fill: "none", stroke: "hsl(25 100% 60% / 0.55)", "stroke-width": 0.6, "stroke-linecap": "round", "stroke-linejoin": "round", transform: "translate(-0.5 -0.5)" }, legLayer),
        });
      }

    // ── state ────────────────────────────────────────────────────────────
    let W = innerWidth;
    let H = innerHeight;
    let scale = W < 640 ? 1.15 : 1.9;
    const s = {
      pos: { x: W * 0.7, y: -60 },
      heading: Math.PI / 2,
      speed: 0,
      mode: "descend" as "descend" | "walk" | "pause" | "climb",
      target: { x: 0, y: 0 },
      timer: 0,
      anchor: { x: W * 0.7, y: 0 },
      dropTo: 0,
      time: 0,
      groom: 0,
      wanderLeft: rand(35, 60),
      onSilk: true, // the thread stays attached until the spider walks off it
      silkEnd: { x: 0, y: 0 },
    };
    const mouse = { x: -9999, y: -9999, seen: 0 };

    const toWorld = (p: V): V => {
      // Local forward is -y, so rotate by heading + 90°.
      const a = s.heading + Math.PI / 2, c = Math.cos(a), n = Math.sin(a);
      return { x: s.pos.x + (p.x * c - p.y * n) * scale, y: s.pos.y + (p.x * n + p.y * c) * scale };
    };
    const toLocal = (p: V): V => {
      const a = s.heading + Math.PI / 2, c = Math.cos(a), n = Math.sin(a);
      const x = (p.x - s.pos.x) / scale, y = (p.y - s.pos.y) / scale;
      return { x: x * c + y * n, y: -x * n + y * c };
    };
    const margin = () => 40 * scale;
    const pickTarget = () => {
      const m = margin();
      for (let i = 0; i < 6; i++) {
        const t = { x: rand(m, W - m), y: rand(m + 40, H - m) };
        if (len(sub(t, s.pos)) > Math.min(W, H) * 0.3) return t;
      }
      return { x: rand(m, W - m), y: rand(m, H - m) };
    };
    const startDescent = () => {
      s.anchor = { x: rand(W * 0.15, W * 0.85), y: 0 };
      s.pos = { x: s.anchor.x, y: -50 * scale };
      s.heading = Math.PI / 2; // head down the thread
      s.dropTo = rand(H * 0.22, H * 0.5);
      s.mode = "descend";
      s.onSilk = true;
      s.wanderLeft = rand(35, 60);
    };
    const plantAll = () => legs.forEach((l) => { l.foot = toWorld(l.home); l.t = 1; });

    // ── legs ─────────────────────────────────────────────────────────────
    const solve = (leg: Leg, footLocal: V, lift: number) => {
      const d = sub(footLocal, leg.hip);
      const dist = Math.min(len(d), FEMUR + TIBIA - 0.5);
      const base = Math.atan2(d.y, d.x);
      const bend = Math.acos(Math.max(-1, Math.min(1, (FEMUR * FEMUR + dist * dist - TIBIA * TIBIA) / (2 * FEMUR * dist || 1))));
      const k1 = { x: leg.hip.x + Math.cos(base + bend) * FEMUR, y: leg.hip.y + Math.sin(base + bend) * FEMUR };
      const k2 = { x: leg.hip.x + Math.cos(base - bend) * FEMUR, y: leg.hip.y + Math.sin(base - bend) * FEMUR };
      // Knees point away from the body; a lifted leg's knee rises (reads as further out from above).
      const knee = k1.x * leg.side > k2.x * leg.side ? k1 : k2;
      knee.x += leg.side * lift * 3;
      const foot = { x: footLocal.x + leg.side * lift * 1.5, y: footLocal.y };
      const path = `M${f(leg.hip.x)} ${f(leg.hip.y)}L${f(knee.x)} ${f(knee.y)}L${f(foot.x)} ${f(foot.y)}`;
      leg.line.setAttribute("d", path);
      leg.rim.setAttribute("d", path);
      leg.shade.setAttribute("d", path);
    };

    const updateLegs = (dt: number, airborne: boolean) => {
      const transform = `translate(${f(s.pos.x)} ${f(s.pos.y)}) rotate(${f(((s.heading + Math.PI / 2) * 180) / Math.PI)}) scale(${scale})`;
      legLayer.setAttribute("transform", transform);
      shadowLayer.setAttribute("transform", transform + " translate(2.5 3.5)");
      if (airborne) {
        // Hanging on silk: legs drawn in and paddling a little.
        legs.forEach((l, i) => {
          const wiggle = Math.sin(s.time * 7 + i) * 2;
          solve(l, { x: l.home.x * 0.72, y: l.home.y * 0.8 + wiggle }, 0.6);
        });
        return;
      }
      const stride = 13 * scale;
      const swinging = [0, 0];
      legs.forEach((l) => { if (l.t < 1) swinging[l.group]++; });
      const velocity = { x: Math.cos(s.heading) * s.speed, y: Math.sin(s.heading) * s.speed };
      for (const l of legs) {
        const homeWorld = toWorld(l.home);
        if (l.t < 1) {
          l.t = Math.min(1, l.t + dt / STEP_TIME);
          const e = l.t * l.t * (3 - 2 * l.t);
          l.foot = mix(l.from, l.to, e);
        } else {
          const off = len(sub(l.foot, homeWorld));
          const other = swinging[1 - l.group] > 0;
          const needed = s.speed > 1 ? off > stride : off > 5 * scale;
          if (needed && !other) {
            l.from = { ...l.foot };
            // Land ahead of the home spot so the body walks into the step.
            l.to = { x: homeWorld.x + velocity.x * STEP_TIME * 1.6, y: homeWorld.y + velocity.y * STEP_TIME * 1.6 };
            l.t = 0;
            swinging[l.group]++;
          } else if (off > stride * 2.6) {
            l.foot = homeWorld; // after a hard turn, never stretch a leg across the screen
          }
        }
        let local = toLocal(l.foot);
        // Grooming: the front pair lifts and rubs while the others hold.
        if (s.groom > 0 && l.row === 0) local = { x: l.home.x * 0.45, y: l.home.y * 0.75 + Math.sin(s.time * 16 + l.side) * 2.5 };
        solve(l, local, l.t < 1 ? Math.sin(l.t * Math.PI) : s.groom > 0 && l.row === 0 ? 1 : 0);
      }
    };

    // ── loop ─────────────────────────────────────────────────────────────
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      s.time += dt;
      s.timer -= dt;
      s.groom = Math.max(0, s.groom - dt);

      const fleeing = s.mode !== "descend" && s.mode !== "climb" && now - mouse.seen < 1500 && len(sub(mouse, s.pos)) < 130 * scale;
      if (fleeing) {
        const away = Math.atan2(s.pos.y - mouse.y, s.pos.x - mouse.x);
        const m = margin();
        s.target = { x: Math.max(m, Math.min(W - m, s.pos.x + Math.cos(away) * 260)), y: Math.max(m, Math.min(H - m, s.pos.y + Math.sin(away) * 260)) };
        s.mode = "walk";
        s.onSilk = false;
        s.groom = 0;
      }

      if (s.mode === "descend") {
        s.pos.y = Math.min(s.dropTo, s.pos.y + (s.pos.y < s.dropTo - 30 ? 95 : 35) * scale * dt);
        s.pos.x = s.anchor.x + Math.sin(s.time * 1.4) * 2;
        if (s.pos.y >= s.dropTo) {
          plantAll();
          s.mode = "pause";
          s.timer = rand(0.6, 1.4);
        }
      } else if (s.mode === "climb") {
        s.pos.y -= 80 * scale * dt;
        s.pos.x = s.anchor.x;
        s.heading = wrap(s.heading + wrap(-Math.PI / 2 - s.heading) * Math.min(1, dt * 6));
        if (s.pos.y < -60 * scale) startDescent();
      } else if (s.mode === "pause") {
        s.speed = Math.max(0, s.speed - 400 * dt);
        if (s.timer <= 0) {
          s.wanderLeft -= 1;
          s.onSilk = false;
          if (s.wanderLeft <= 0 && !fleeing) {
            // Head for the top edge, then climb out on a fresh thread.
            s.target = { x: s.pos.x, y: 8 };
            s.anchor = { x: s.pos.x, y: 0 };
            s.mode = "walk";
            s.timer = -1;
          } else {
            s.target = pickTarget();
            s.mode = "walk";
          }
        }
      } else {
        const d = sub(s.target, s.pos);
        const dist = len(d);
        const goal = Math.atan2(d.y, d.x);
        const turn = wrap(goal - s.heading);
        s.heading = wrap(s.heading + turn * Math.min(1, dt * (fleeing ? 10 : 5)));
        const cruise = (fleeing ? 230 : 70 + Math.sin(s.time * 1.7) * 18) * scale;
        // Slow into sharp turns and near the target; spiders move in short bursts.
        const want = cruise * Math.max(0.25, 1 - Math.abs(turn) * 0.5) * Math.min(1, dist / (40 * scale) + 0.15);
        s.speed = lerp(s.speed, want, Math.min(1, dt * 6));
        const step = Math.min(dist, s.speed * dt);
        s.pos.x += Math.cos(s.heading) * step;
        s.pos.y += Math.sin(s.heading) * step;
        if (dist < 3) {
          if (s.wanderLeft <= 0 && s.target.y <= 8) {
            s.anchor = { x: s.pos.x, y: 0 };
            s.mode = "climb";
            s.onSilk = true;
          } else {
            s.mode = "pause";
            s.timer = Math.random() < 0.18 ? rand(3, 6) : rand(0.3, 1.8);
            if (s.timer > 2.5) s.groom = s.timer * 0.6;
          }
        }
      }

      const airborne = s.mode === "descend" || s.mode === "climb";
      const bob = s.speed > 1 ? Math.sin(s.time * 22) * 0.35 : Math.sin(s.time * 2.2) * 0.15;
      body.setAttribute("transform", `translate(${f(s.pos.x)} ${f(s.pos.y + bob)}) rotate(${f(((s.heading + Math.PI / 2) * 180) / Math.PI)}) scale(${scale})`);
      abdomen.setAttribute("transform", `rotate(${f(Math.sin(s.time * (s.speed > 1 ? 9 : 1.5)) * (s.speed > 1 ? 3 : 1.5))} 0 0)`);
      palps.setAttribute("transform", `rotate(${f(Math.sin(s.time * 12) * 4)})`);
      updateLegs(dt, airborne);

      // The silk follows the spider while it hangs on it; once it walks off, the loose thread stays put and fades.
      if (s.onSilk) s.silkEnd = { x: s.pos.x, y: s.pos.y - 8 * scale };
      const silkOpacity = Number(silk.getAttribute("opacity"));
      silk.setAttribute("opacity", f(Math.max(0, Math.min(0.75, silkOpacity + (s.onSilk ? 3 : -0.5) * dt))));
      silk.setAttribute("x1", f(s.anchor.x));
      silk.setAttribute("y1", "0");
      silk.setAttribute("x2", f(s.silkEnd.x));
      silk.setAttribute("y2", f(s.silkEnd.y));
    };

    const resize = () => {
      W = innerWidth;
      H = innerHeight;
      scale = W < 640 ? 1.15 : 1.9;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const m = margin();
      if (s.mode !== "descend" && s.mode !== "climb") {
        s.pos = { x: Math.max(m, Math.min(W - m, s.pos.x)), y: Math.max(m, Math.min(H - m, s.pos.y)) };
        s.target = pickTarget();
        plantAll();
      }
    };
    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = performance.now(); };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };

    resize();
    startDescent();
    frame = requestAnimationFrame(tick);
    addEventListener("resize", resize);
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const node of Array.from(svg.childNodes)) if (node.nodeName !== "defs") svg.removeChild(node);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-screen w-screen select-none motion-reduce:hidden"
      style={{ filter: "drop-shadow(0 0 6px hsl(var(--pumpkin) / 0.35))" }}
    >
      <defs>
        <radialGradient id="spider-abdomen" cx="35%" cy="25%" r="75%">
          <stop offset="0" stopColor="#5a4234" />
          <stop offset="0.35" stopColor="#24170f" />
          <stop offset="1" stopColor="#070505" />
        </radialGradient>
        <radialGradient id="spider-head" cx="35%" cy="25%" r="80%">
          <stop offset="0" stopColor="#4f3a2d" />
          <stop offset="0.5" stopColor="#1c130e" />
          <stop offset="1" stopColor="#060404" />
        </radialGradient>
        <linearGradient id="spider-leg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6e5242" />
          <stop offset="1" stopColor="#2b1f18" />
        </linearGradient>
        <filter id="spider-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id="spider-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

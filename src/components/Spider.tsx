import { useEffect, useRef } from "react";

/**
 * A spider that lives in the browser window: it drops in on a silk thread, then wanders the viewport on eight legs.
 * Feet are planted in screen space and step in two alternating groups of four (the real spider gait), each leg solved
 * with three-segment IK (femur, tibia, tarsus), so it walks instead of sliding. It pauses, grooms, runs from the cursor, and now and then climbs
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
  segs: [SVGPathElement, SVGPathElement, SVGPathElement]; // femur, tibia, tarsus (thick to thin)
  shine: SVGPathElement;
  joints: [SVGCircleElement, SVGCircleElement];
  shade: SVGPathElement;
};

const FEMUR = 14;
const TIBIA = 16;
const TARSUS = 9;
const STEP_TIME = 0.17;
// Speeds in px per second at scale 1 (multiplied by the size scale).
const WALK_SPEED = 32;
const FLEE_SPEED = 90;
const TURN_RATE = 3.2; // radians per second
const TURN_IN_PLACE = 0.9; // turns sharper than this stop and pivot first

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
    // Realistic brown wolf/house spider: hairy, no markings. Local space faces -y; the abdomen is behind (+y).
    const silk = el("line", { stroke: "hsl(30 20% 88%)", "stroke-width": 0.7, opacity: 0, "stroke-linecap": "round" }, svg);
    const shadowLayer = el("g", { opacity: 0.5, filter: "url(#spider-blur)" }, svg);
    const legLayer = el("g", {}, svg);
    const body = el("g", {}, svg);
    el("ellipse", { cx: 1.5, cy: 8, rx: 10, ry: 18, fill: "#000", opacity: 0.45, filter: "url(#spider-blur)" }, body);

    // Short hairs around an ellipse's edge.
    const fringe = (cx: number, cy: number, rx: number, ry: number, count: number, length: number) => {
      let d = "";
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.sin(i * 7.3) * 0.08;
        const x = cx + Math.cos(a) * rx * 0.97, y = cy + Math.sin(a) * ry * 0.97;
        const l = length * (0.7 + ((i * 37) % 10) / 25);
        d += `M${f(x)} ${f(y)}l${f(Math.cos(a + 0.25) * l)} ${f(Math.sin(a + 0.25) * l)}`;
      }
      return d;
    };

    const abdomen = el("g", {}, body);
    el("ellipse", { cx: 0, cy: 23.6, rx: 1.3, ry: 1.2, fill: "#1a110c" }, abdomen); // spinnerets
    el("ellipse", { cx: 0, cy: 12.5, rx: 9.2, ry: 12, fill: "url(#spider-abdomen)" }, abdomen);
    el("path", { d: fringe(0, 12.5, 9.2, 12, 64, 1.6), stroke: "#8f715a", "stroke-width": 0.32, opacity: 0.55, fill: "none" }, abdomen);
    // A faint darker heart stripe, as on a real wolf spider (kept subtle so it never reads as a logo).
    el("path", { d: "M0 1.8C1.8 4 1.9 8 0 11.5C-1.9 8 -1.8 4 0 1.8Z", fill: "#160e0a", opacity: 0.3 }, abdomen);
    for (const [x, y] of [[-4.6, 6], [4.4, 6.5], [-6, 12], [6.1, 12.4], [-3, 20.5], [3.2, 20.2]])
      el("circle", { cx: x, cy: y, r: 0.55, fill: "#b8977a", opacity: 0.35 }, abdomen);
    el("ellipse", { cx: -3, cy: 6.5, rx: 3.2, ry: 4.5, fill: "#fff", opacity: 0.05 }, abdomen); // soft sheen

    el("ellipse", { cx: 0, cy: 0.6, rx: 1.6, ry: 1.4, fill: "#1f1510" }, body); // pedicel
    el("ellipse", { cx: 0, cy: -4.5, rx: 6.6, ry: 7.4, fill: "url(#spider-head)" }, body);
    el("path", { d: fringe(0, -4.5, 6.6, 7.4, 40, 1.1), stroke: "#8f715a", "stroke-width": 0.28, opacity: 0.5, fill: "none" }, body);
    el("path", { d: "M0 -6.5L0 -3.2M-1.6 -2.6L-4.6 -1.2M1.6 -2.6L4.6 -1.2M-2 -5L-5.2 -5.6M2 -5L5.2 -5.6", stroke: "#130c09", "stroke-width": 0.55, opacity: 0.6, "stroke-linecap": "round" }, body);
    el("path", { d: "M-1.2 -11C-1.2 -6.8 1.2 -6.8 1.2 -11", fill: "none", stroke: "#a98a70", "stroke-width": 0.35, opacity: 0.35 }, body);

    // Chelicerae with small fangs, then the eight glossy eyes (big rear pair, small front row).
    for (const side of [-1, 1]) {
      el("ellipse", { cx: side * 1.55, cy: -11.6, rx: 1.65, ry: 2.1, fill: "url(#spider-head)", stroke: "#100a07", "stroke-width": 0.3 }, body);
      el("path", { d: `M${side * 1.4} -13.4q${side * -0.5} 1 ${side * -1.1} 0.6`, fill: "none", stroke: "#0a0605", "stroke-width": 0.5, "stroke-linecap": "round" }, body);
    }
    for (const [x, y, r] of [[-1.7, -8.2, 1.05], [1.7, -8.2, 1.05], [-3.6, -7.1, 0.6], [3.6, -7.1, 0.6], [-0.85, -9.9, 0.55], [0.85, -9.9, 0.55], [-2.3, -9.6, 0.45], [2.3, -9.6, 0.45]] as const) {
      el("circle", { cx: x, cy: y, r, fill: "#040303" }, body);
      el("circle", { cx: x - r * 0.3, cy: y - r * 0.3, r: r * 0.2, fill: "#fff", opacity: 0.45 }, body);
    }
    const palps = el("g", {}, body);
    for (const side of [-1, 1]) {
      el("path", { d: `M${side * 2.6} -10.4Q${side * 4.6} -12.6 ${side * 4.1} -15.2`, fill: "none", stroke: "#4c3628", "stroke-width": 1.45, "stroke-linecap": "round" }, palps);
      el("circle", { cx: side * 4.1, cy: -15.3, r: 0.95, fill: "#2a1c14" }, palps);
    }

    const legs: Leg[] = [];
    const stroke = (parent: Element, color: string, width: number, extra: Record<string, string | number> = {}) =>
      el("path", { fill: "none", stroke: color, "stroke-width": width, "stroke-linecap": "round", "stroke-linejoin": "round", ...extra }, parent);
    for (const side of [-1, 1] as const)
      for (let row = 0; row < 4; row++) {
        const hip = { x: side * 4.6, y: [-7.5, -5, -2.4, 0.2][row] };
        const home = { x: side * [22, 30, 30, 24][row], y: [-29, -11, 8, 27][row] };
        legs.push({
          side, row, group: ((row + (side > 0 ? 1 : 0)) % 2) as 0 | 1, hip, home,
          foot: { x: 0, y: 0 }, from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, t: 1,
          shade: stroke(shadowLayer, "#000", 3.2),
          segs: [stroke(legLayer, "#4a3628", 2.7), stroke(legLayer, "#3a2a1f", 2.0), stroke(legLayer, "#241911", 1.15)],
          shine: stroke(legLayer, "#a3836a", 0.35, { opacity: 0.18, transform: "translate(-0.3 -0.3)" }),
          joints: [el("circle", { r: 1.45, fill: "#24180f" }, legLayer), el("circle", { r: 1.05, fill: "#1d140d" }, legLayer)],
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
      fleeUntil: 0, // a flee target is kept until then, so it never re-aims every frame
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
      const foot = { x: footLocal.x + leg.side * lift * 1.5, y: footLocal.y };
      // Tarsus: the last segment points back toward the hip, angled slightly outward.
      const toHip = sub(leg.hip, foot);
      const reach = len(toHip) || 1;
      const ankle = { x: foot.x + (toHip.x / reach) * TARSUS + leg.side * 1.6, y: foot.y + (toHip.y / reach) * TARSUS };
      // Femur + tibia: two-bone IK from the hip to the ankle, knee bending away from the body.
      const d = sub(ankle, leg.hip);
      const dist = Math.max(4, Math.min(len(d), FEMUR + TIBIA - 0.5));
      const base = Math.atan2(d.y, d.x);
      const bend = Math.acos(Math.max(-1, Math.min(1, (FEMUR * FEMUR + dist * dist - TIBIA * TIBIA) / (2 * FEMUR * dist))));
      const k1 = { x: leg.hip.x + Math.cos(base + bend) * FEMUR, y: leg.hip.y + Math.sin(base + bend) * FEMUR };
      const k2 = { x: leg.hip.x + Math.cos(base - bend) * FEMUR, y: leg.hip.y + Math.sin(base - bend) * FEMUR };
      const knee = k1.x * leg.side > k2.x * leg.side ? k1 : k2;
      knee.x += leg.side * lift * 3; // a lifted leg's knee rises, which reads as further out from above
      const P = (q: V) => `${f(q.x)} ${f(q.y)}`;
      leg.segs[0].setAttribute("d", `M${P(leg.hip)}L${P(knee)}`);
      leg.segs[1].setAttribute("d", `M${P(knee)}L${P(ankle)}`);
      leg.segs[2].setAttribute("d", `M${P(ankle)}L${P(foot)}`);
      leg.shine.setAttribute("d", `M${P(leg.hip)}L${P(knee)}L${P(ankle)}`);
      leg.shade.setAttribute("d", `M${P(leg.hip)}L${P(knee)}L${P(ankle)}L${P(foot)}`);
      leg.joints[0].setAttribute("cx", f(knee.x));
      leg.joints[0].setAttribute("cy", f(knee.y));
      leg.joints[1].setAttribute("cx", f(ankle.x));
      leg.joints[1].setAttribute("cy", f(ankle.y));
    };

    const updateLegs = (dt: number, airborne: boolean) => {
      const transform = `translate(${f(s.pos.x)} ${f(s.pos.y)}) rotate(${f(((s.heading + Math.PI / 2) * 180) / Math.PI)}) scale(${scale})`;
      legLayer.setAttribute("transform", transform);
      shadowLayer.setAttribute("transform", transform + " translate(2 3)");
      if (airborne) {
        // Hanging on silk: legs drawn in and paddling a little.
        legs.forEach((l, i) => {
          const wiggle = Math.sin(s.time * 7 + i) * 2;
          solve(l, { x: l.home.x * 0.72, y: l.home.y * 0.8 + wiggle }, 0.6);
        });
        return;
      }
      const stride = 14 * scale;
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

      const near = s.mode !== "descend" && s.mode !== "climb" && now - mouse.seen < 1500 && len(sub(mouse, s.pos)) < 110 * scale;
      if (near && s.time > s.fleeUntil) {
        // Pick the open spot furthest from the cursor (inside the margins), so a corner never traps it.
        const m = margin();
        let best = pickTarget();
        let score = -Infinity;
        for (let i = 0; i < 12; i++) {
          const t = { x: rand(m, W - m), y: rand(m, H - m) };
          const value = len(sub(t, mouse)) - len(sub(t, s.pos)) * 0.35;
          if (value > score) { score = value; best = t; }
        }
        s.target = best;
        s.fleeUntil = s.time + 1.2;
        s.mode = "walk";
        s.onSilk = false;
        s.groom = 0;
      }
      const fleeing = s.time < s.fleeUntil;

      if (s.mode === "descend") {
        s.pos.y = Math.min(s.dropTo, s.pos.y + (s.pos.y < s.dropTo - 30 ? 55 : 22) * scale * dt);
        s.pos.x = s.anchor.x + Math.sin(s.time * 1.4) * 2;
        if (s.pos.y >= s.dropTo) {
          plantAll();
          s.mode = "pause";
          s.timer = rand(0.6, 1.4);
        }
      } else if (s.mode === "climb") {
        s.pos.y -= 45 * scale * dt;
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
        // Turn at a capped rate; a sharp turn stops and pivots on the spot instead of circling the target.
        const maxTurn = TURN_RATE * (fleeing ? 1.6 : 1) * dt;
        s.heading = wrap(s.heading + Math.max(-maxTurn, Math.min(maxTurn, turn)));
        const cruise = (fleeing ? FLEE_SPEED : WALK_SPEED + Math.sin(s.time * 1.7) * 6) * scale;
        const facing = Math.abs(turn) > TURN_IN_PLACE ? 0 : 1 - Math.abs(turn) / TURN_IN_PLACE * 0.7;
        const want = cruise * facing * Math.min(1, dist / (50 * scale) + 0.2);
        s.speed = lerp(s.speed, want, Math.min(1, dt * 4));
        const step = Math.min(dist, s.speed * dt);
        s.pos.x += Math.cos(s.heading) * step;
        s.pos.y += Math.sin(s.heading) * step;
        if (dist < 6 * scale) {
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
      style={{ filter: "drop-shadow(0 0 5px rgba(255, 150, 70, 0.16))" }}
    >
      <defs>
        <radialGradient id="spider-abdomen" cx="38%" cy="28%" r="78%">
          <stop offset="0" stopColor="#7d5f49" />
          <stop offset="0.3" stopColor="#4d3627" />
          <stop offset="0.72" stopColor="#24170f" />
          <stop offset="1" stopColor="#0d0806" />
        </radialGradient>
        <radialGradient id="spider-head" cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#6e523f" />
          <stop offset="0.45" stopColor="#3a281c" />
          <stop offset="1" stopColor="#100a07" />
        </radialGradient>
        <filter id="spider-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
    </svg>
  );
}

/* Coordinator layer for the full essay (Halftime system): title header, the telestrator underline
 * on every normal-mode prompt (ported from Film Study), and the opening's one typographic touch.
 * Loads after views.js and before the section files. */
(function () {
  "use strict";
  const JB = window.JB, D = JB.data, h = JB.h, V = window.DIRECTION_VIEWS;
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- header */
  V.header = (doc) => h("header", { class: "hp-header" },
    h("p", { class: "hp-kicker", text: doc.workingTitle }),
    h("h1", { class: "hp-title", text: doc.title }),
    doc.subtitle && h("p", { class: "hp-dek", html: JB.inline(doc.subtitle) }));

  /* ---------------------------------------------------------------- opening: ha-ha / aha / ah */
  const basePara = V.para || JB.baseViews.para;
  V.para = (b) => {
    const el = basePara(b);
    if (/gets a "ha-ha,"/.test(b.md)) {
      el.innerHTML = el.innerHTML.replace(/(?:"|&quot;)(ha-ha|aha|ah)([,.]?)(?:"|&quot;)/g, '<span class="hp-koestler">"$1$2"</span>');
    }
    return el;
  };

  /* ---------------------------------------------------------------- telestrator underline */
  const ns = "http://www.w3.org/2000/svg";
  const rng = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const n1 = (v) => (Math.round(v * 10) / 10).toString();
  const smooth = (pts) => {
    let d = `M${n1(pts[0][0])},${n1(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${n1(p1[0] + (p2[0] - p0[0]) / 6)},${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)},${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])},${n1(p2[1])}`;
    }
    return d;
  };
  /** One hand-drawn stroke under each line box, lifting a little at the end. */
  const underlinePath = (rects, seed) => {
    const r = rng(seed);
    return rects.map(([x, y, w, hh]) => {
      const by = y + hh + 2, pts = [];
      for (let i = 0; i <= 6; i++) pts.push([x - 3 + ((w + 6) * i) / 6, by + (r() - 0.5) * 1.6 - (i === 6 ? 2.5 : 0)]);
      return smooth(pts);
    });
  };
  const seen = new Set(); // items whose underline has already been drawn on once
  function telestrate(card, line, key) {
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "hp-ink"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    card.append(svg);
    const draw = (animate) => {
      if (!svg.isConnected) return;
      const cr = card.getBoundingClientRect(); if (!cr.width) return;
      svg.setAttribute("viewBox", `0 0 ${n1(cr.width)} ${n1(cr.height)}`);
      svg.setAttribute("width", n1(cr.width)); svg.setAttribute("height", n1(cr.height));
      const rects = [...line.getClientRects()].map((b) => [b.left - cr.left, b.top - cr.top, b.width, b.height]);
      svg.replaceChildren();
      underlinePath(rects, 7 + key.length).forEach((d, i) => {
        const p = document.createElementNS(ns, "path"); p.setAttribute("d", d); p.setAttribute("class", "hp-ink-stroke"); svg.append(p);
        if (animate && !reduced() && p.animate) {
          const len = p.getTotalLength();
          p.style.strokeDasharray = `${len} ${len + 20}`;
          const a = p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 420, delay: 160 + i * 380, easing: "cubic-bezier(.35,.6,.25,1)", fill: "both" });
          a.onfinish = () => { p.style.strokeDasharray = ""; a.cancel(); };
        }
      });
    };
    const first = () => { const anim = !seen.has(key); seen.add(key); draw(anim); };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (seen.has(key) || !("IntersectionObserver" in window)) return first();
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); first(); } }, { threshold: 0.5 });
      io.observe(line);
    }));
    if (window.ResizeObserver) {
      let w = 0, hh = 0;
      new ResizeObserver(() => { const b = card.getBoundingClientRect(); const nw = Math.round(b.width), nh = Math.round(b.height); if ((nw !== w || nh !== hh) && seen.has(key)) draw(false); w = nw; hh = nh; }).observe(card);
    }
    // the scene line reflows when the web fonts arrive: redraw so the stroke spans the whole line
    if (document.fonts) {
      document.fonts.ready.then(() => seen.has(key) && draw(false));
      document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", () => seen.has(key) && draw(false));
    }
  }
  /** For section files that render a scene line of their own: HP.telestrate(hostWithPositionRelative, lineEl, key). */
  window.HP = Object.assign(window.HP || {}, { telestrate });
  const basePrompt = V.promptCard;
  V.promptCard = (b, mode, L) => {
    const card = basePrompt(b, mode, L);
    if (mode !== "normal") return card;
    const p = [...card.querySelectorAll(".hp-feed-p")].find((x) => /^At timestamp/.test(x.textContent));
    const cut = p ? p.innerHTML.indexOf("<br>") : -1;
    if (cut > 0) {
      p.innerHTML = `${p.innerHTML.slice(0, cut + 4)}<span class="hp-keyline">${p.innerHTML.slice(cut + 4)}</span>`;
      card.classList.add("has-ink");
      telestrate(card, p.querySelector(".hp-keyline"), L.state.itemId);
    }
    return card;
  };
})();

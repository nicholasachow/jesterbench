/* Halftime Package — view overrides.
 * The prose column stays plain magazine; every interactive speaks broadcast graphics
 * (lower-thirds, stat lines, score bugs, a review booth). Built on the engine's headless
 * controllers; gold text only ever comes from L.reveal / the shelf controller, never pre-rendered. */
(function () {
  "use strict";
  const JB = window.JB, D = JB.data, h = JB.h;
  const V = {};

  /* ---------------------------------------------------------------- small parts */
  const svg = (markup, cls) => h("span", { class: `hp-ico ${cls || ""}`, "aria-hidden": "true", html: markup });
  const ICON = {
    play: '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>',
    out: '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M4 2h6v6M10 2 3 9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    prev: '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M8 1.5 3.5 6 8 10.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    next: '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M4 1.5 8.5 6 4 10.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  };
  const tag = (text, cls) => h("span", { class: `hp-tag ${cls || ""}`, text });
  const strip = (tagText, meta, cls) => h("div", { class: `hp-strip ${cls || ""}` }, tag(tagText), meta && h("span", { class: "hp-strip-meta" }, meta));
  /** Mark a freshly built node for its one entrance (CSS turns it off under reduced motion). */
  const enter = (el, kind) => { if (el) el.classList.add(kind || "hp-in"); return el; };
  const verdictWord = (v) => (v ? JB.verdictLabel[v] : "No answer");
  const vcls = (v) => (v ? `is-${v.toLowerCase()}` : "is-none");
  const labOf = (model) => ((D.scores.models || []).find((m) => m.model === model) || {}).lab || "";
  const bookTitle = (it) => it.evidence.replace(/^A book titled\s*/i, "").replace(/\.$/, "").replace(/^["“]|["”]$/g, "");

  /* ---------------------------------------------------------------- prose */
  V.header = (doc) => h("header", { class: "hp-header" },
    h("p", { class: "hp-kicker" }, "Excerpt for review", h("span", { "aria-hidden": "true", text: " / " }), "“LeBron vs. Steph” through “The basic mechanics”"),
    h("h1", { class: "hp-title", text: doc.title }),
    doc.subtitle && h("p", { class: "hp-dek", html: JB.inline(doc.subtitle) }));

  V.heading = (sec) => h("h2", { class: "jb-h2 hp-h2", id: sec.id, html: JB.inline(sec.title) });

  V.figure = (b, key, opts) => {
    const im = D.images[key];
    if (!im) return null;
    const owners = Object.values(D.items).filter((i) => (D.itemFrames[i.id] || []).includes(key));
    const own = owners.length === 1 ? owners[0] : null;
    return h("figure", { class: `jb-figure hp-figure${opts && opts.wide ? " hp-wide" : ""}` },
      h("div", { class: "hp-shot" },
        h("img", { src: im.src, width: im.w, height: im.h, alt: JB.altFor(key) }),
        opts && opts.badge),
      own && h("figcaption", { class: "hp-figcap" }, h("span", { class: "hp-tc", text: own.timestamp }), "Still from the episode"));
  };

  V.sidenote = (n, blocks) => {
    const words = blocks.map((b) => (b.md || (b.items || []).join(" ") || "")).join(" ").split(/\s+/).length;
    const long = words > 90;
    const aside = h("aside", { class: `sidenote${long ? " is-long" : ""}`, id: `sn-${n}`, "data-n": n });
    const more = long && h("button", { class: "sn-more", type: "button", "aria-expanded": "false", text: "Read the whole note" });
    if (more) more.addEventListener("click", () => {
      const open = aside.getAttribute("data-open") !== "true";
      aside.setAttribute("data-open", open);
      more.setAttribute("aria-expanded", open); more.textContent = open ? "Show less" : "Read the whole note";
      const ref = document.querySelector(`.sn-ref[aria-controls="sn-${n}"]`);
      if (ref) ref.setAttribute("aria-expanded", open);
      JB.layoutSidenotes();
    });
    aside.append(h("span", { class: "sidenote-n", text: `Note ${n}` }),
      h("div", { class: "sidenote-body" }, blocks.map((b) => JB.views.block(b))));
    if (more) aside.append(more);
    // the superscript in the text toggles the same state; keep the button label in sync
    new MutationObserver(() => {
      if (!more) return;
      const open = aside.getAttribute("data-open") === "true";
      more.setAttribute("aria-expanded", open); more.textContent = open ? "Show less" : "Read the whole note";
    }).observe(aside, { attributes: true, attributeFilter: ["data-open"] });
    return aside;
  };

  /* ---------------------------------------------------------------- video: an "up next" lower-third */
  V.video = () => {
    const v = D.video, poster = D.images["frame-20250519184606"];
    if (D.config.video && D.config.video.embed) return JB.baseViews.video();
    const [series, episode] = v.title.includes(": ") ? v.title.split(": ") : ["", v.title];
    const [yy, mm] = String(v.released || "").split("-");
    const month = mm ? new Date(+yy, +mm - 1, 1).toLocaleString("en-US", { month: "long" }) + " " + yy : "";
    return h("figure", { class: "hp-video hp-wide" },
      h("a", { class: "hp-video-link", href: JB.ytUrl(0), target: "_blank", rel: "noopener" },
        h("span", { class: "hp-shot" }, h("img", { src: poster.src, width: poster.w, height: poster.h, alt: `${v.title}, ${v.publisher}. Opens on YouTube.` })),
        h("span", { class: "hp-l3 is-stacked" },
          h("span", { class: "hp-l3-tag" }, svg(ICON.play), "Full episode"),
          h("span", { class: "hp-l3-main" },
            series && h("span", { class: "hp-l3-kicker", text: series }),
            h("span", { class: "hp-l3-title", text: episode }),
            h("span", { class: "hp-l3-sub" }, [v.publisher, month, JB.fmtTime(v.duration_sec)].filter(Boolean).join(" · "), h("span", { class: "hp-l3-go" }, "Watch on YouTube", svg(ICON.out)))))));
  };

  /* ---------------------------------------------------------------- timeline: play-by-play strip + game clock */
  V.timeline = () => {
    const T = JB.createTimeline(), ns = "http://www.w3.org/2000/svg";
    const fig = h("figure", { class: "hp-tl hp-panel hp-wide" });
    const stat = (n, label, sw) => h("div", { class: "hp-stat" }, h("span", { class: "hp-stat-n", text: n }), h("span", { class: "hp-stat-l" }, sw && h("span", { class: `hp-sw ${sw}`, "aria-hidden": "true" }), label));
    const head = strip("Play-by-play", `${T.total} moments in ${JB.fmtTime(T.duration)}`);
    const stats = h("div", { class: "hp-stats", "aria-hidden": "true" }, stat(String(T.total), "Moments"), stat(JB.fmtTime(T.duration), "Runtime"), stat(String(T.publicCount), "Public", "is-public"), stat(String(T.total - T.publicCount), "Held out", "is-held"));
    const plot = h("div", { class: "hp-tl-plot", tabindex: "0", role: "group", "aria-roledescription": "timeline",
      "aria-label": `All ${T.total} moments in the episode. Drag to scrub; arrow keys step through the ${T.publicCount} public moments.` });
    const clockT = h("span", { class: "hp-clock-t is-idle", text: "0:00" });
    const clock = h("div", { class: "hp-clock", "aria-hidden": "true" }, h("span", { class: "hp-clock-l", text: "Clock" }), clockT);
    const card = h("div", { class: "hp-pbp", "aria-live": "polite" });
    const prevB = h("button", { type: "button", class: "hp-btn hp-btn-ghost hp-tl-prev", "aria-label": "Previous public moment", onclick: () => T.step(-1) }, svg(ICON.prev), h("span", { text: "Prev" }));
    const nextB = h("button", { type: "button", class: "hp-btn hp-btn-ghost hp-tl-next", "aria-label": "Next public moment", onclick: () => T.step(1) }, h("span", { text: "Next" }), svg(ICON.next));
    let dots = [], rects = [], head2 = null, geo = null, entered = false;
    const draw = () => {
      const width = plot.clientWidth || 600;
      const r = width < 520 ? 2.9 : 3.6;
      const sw = JB.swarm({ width, r, gap: 1.4 });
      dots = sw.dots;
      const top = 6, H = top + sw.height + 26, base = H - 22, pad = r + 1;
      const xOf = (t) => pad + (t / T.duration) * (width - 2 * pad);
      const s = document.createElementNS(ns, "svg");
      s.setAttribute("viewBox", `0 0 ${width} ${H}`); s.setAttribute("width", width); s.setAttribute("height", H); s.setAttribute("aria-hidden", "true");
      const el = (tag, attrs) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); s.append(e); return e; };
      for (let t = 0; t <= T.duration; t += 15) {
        const major = t % 60 === 0;
        el("line", { x1: xOf(t), x2: xOf(t), y1: base + 1, y2: base + (major ? 8 : 4), class: major ? "hp-tick is-major" : "hp-tick" });
      }
      el("line", { x1: 0, x2: width, y1: base + 0.5, y2: base + 0.5, class: "hp-baseline" });
      [0, 60, 120, 180, T.duration].forEach((t) => {
        const tx = el("text", { x: xOf(t), y: H - 2, class: "hp-tick-label", "text-anchor": t === 0 ? "start" : t === T.duration ? "end" : "middle" });
        tx.textContent = JB.fmtTime(t);
      });
      head2 = el("line", { x1: 0, x2: 0, y1: top - 4, y2: base, class: "hp-playhead", visibility: "hidden" });
      rects = dots.map((p) => el("rect", { x: p.x - r, y: base - 2 * r - 1 - p.y, width: 2 * r, height: 2 * r, class: `hp-dot ${p.heldOut ? "is-held" : "is-public"}` }));
      plot.replaceChildren(s);
      geo = { base, r };
      mark(T.state);
    };
    const mark = (S) => {
      rects.forEach((c, i) => c.classList.toggle("is-sel", i === S.sel));
      if (head2) {
        const p = S.sel != null && dots[S.sel];
        head2.setAttribute("visibility", p ? "visible" : "hidden");
        if (p) { head2.setAttribute("x1", p.x); head2.setAttribute("x2", p.x); head2.setAttribute("y1", geo.base - 2 * geo.r - 1 - p.y - 5); }
      }
    };
    const pick = (ev) => {
      if (!geo) return;
      const rc = plot.getBoundingClientRect();
      const x = ev.clientX - rc.left, y = geo.base - geo.r - (ev.clientY - rc.top);
      const i = T.nearest(dots, x, y);
      if (i !== T.state.sel) T.select(i);
    };
    plot.addEventListener("pointerdown", (e) => { try { plot.setPointerCapture(e.pointerId); } catch (_) {} pick(e); });
    plot.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "mouse") pick(e); });
    plot.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { T.step(1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { T.step(-1); e.preventDefault(); }
    });
    // a public moment: its still as a small thumbnail (when the page ships that frame), then the line
    const pbpLine = (m) => {
      const key = (D.itemFrames[m.item.id] || []).find((k) => D.images[k]), im = key && D.images[key];
      return h("div", { class: `hp-pbp-line${im ? " has-thumb" : ""}` },
        im && h("a", { class: "hp-pbp-thumb hp-shot", href: JB.ytUrl(m.t), target: "_blank", rel: "noopener", tabindex: "-1", "aria-hidden": "true" },
          h("img", { src: im.src, width: im.w, height: im.h, alt: "", decoding: "async" })),
        h("div", { class: "hp-pbp-text" },
          h("p", { class: "hp-pbp-meta" }, h("span", { class: "hp-pbp-t", text: JB.fmtTime(m.t) })),
          h("p", { class: "hp-pbp-ev", text: m.item.evidence }),
          h("a", { class: "hp-pbp-go", href: JB.ytUrl(m.t), target: "_blank", rel: "noopener" }, `Watch at ${JB.fmtTime(m.t)}`, svg(ICON.out))));
    };
    T.subscribe((S) => {
      mark(S);
      if (S.sel == null) {
        clockT.textContent = "0:00"; clockT.classList.add("is-idle");
        card.replaceChildren(h("p", { class: "hp-pbp-hint", text: "Drag across the strip, or step through the public moments." }));
        return;
      }
      const m = T.moment(S.sel);
      // held-out moments carry no label at all, not even their time
      clockT.textContent = m.heldOut ? "–:––" : JB.fmtTime(m.t); clockT.classList.toggle("is-idle", m.heldOut);
      const body = m.heldOut
        ? h("div", { class: "hp-pbp-line is-held" }, h("p", { class: "hp-pbp-held", text: "Held out." }))
        : pbpLine(m);
      if (!entered) { entered = true; enter(body); }
      card.replaceChildren(body);
    });
    fig.append(head, h("div", { class: "hp-tl-area" }, plot, stats), h("div", { class: "hp-tl-foot" }, prevB, clock, nextB, card));
    requestAnimationFrame(draw);
    if (window.ResizeObserver) { let w = 0; new ResizeObserver(() => { if (plot.clientWidth !== w) { w = plot.clientWidth; draw(); } }).observe(plot); }
    return fig;
  };

  /* ---------------------------------------------------------------- bookshelf: wide shot + two iso cams */
  V.bookshelf = () => {
    const shelf = JB.createShelf();
    const frame = D.images[D.shelf.frame];
    const spots = {};
    const iso = (key, n, label) => {
      const im = D.images[key];
      const pic = h("div", { class: "hp-iso-pic" }, h("img", { src: im.src, width: im.w, height: im.h, alt: "Detail from the right edge of the frame.", draggable: "false" }));
      shelf.hotspots.filter((hs) => hs.shelf === key.replace("shelf-", "")).forEach((hs) => {
        const p = shelf.place(hs, key);
        const b = h("button", { class: "jb-hotspot hp-hotspot", type: "button", "aria-label": `A book on the shelf (${hs.item.timestamp})`,
          style: { left: p.left + "%", top: p.top + "%", width: p.width + "%", height: p.height + "%" }, onclick: () => shelf.find(hs.id) });
        spots[hs.id] = b; pic.append(b);
      });
      return h("div", { class: "hp-iso", style: { flexGrow: (im.w / im.h).toFixed(4) } },
        h("p", { class: "hp-cam", "aria-hidden": "true" }, h("span", { class: "hp-cam-n", text: `Iso ${n}` }), label), pic);
    };
    const pips = h("div", { class: "hp-pips", "aria-hidden": "true" });
    const countText = h("p", { class: "hp-count jb-shelf-count", "aria-live": "polite" });
    const roster = h("div", { class: "hp-found" });
    const l3 = h("div", { class: "hp-shelf-l3", "aria-live": "polite" });
    const showAll = h("button", { class: "hp-btn hp-btn-ghost jb-shelf-show", type: "button", text: "Show me the four", onclick: () => shelf.revealAll() });
    let lastOpen = null;
    shelf.subscribe((S) => {
      // the essay keeps the count vague ("over 15"), so the widget never shows the exact total (Nick, 24 Oct)
      const nPub = shelf.hotspots.length;
      countText.textContent = `${S.found.size} of ${nPub} found · the rest held out`;
      pips.replaceChildren(...Array.from({ length: nPub }, (_, i) => h("span", { class: `hp-pip ${i < S.found.size ? "is-found" : "is-open"}` })));
      Object.entries(spots).forEach(([id, b]) => { b.classList.toggle("is-found", S.found.has(id)); b.classList.toggle("is-open", S.open === id); });
      roster.replaceChildren(...[...S.found].map((id) => h("button", { type: "button", class: `hp-chip-btn${S.open === id ? " is-on" : ""}`, "aria-pressed": S.open === id ? "true" : "false",
        text: bookTitle(D.items[id]), onclick: () => shelf.find(id) })));
      showAll.hidden = S.found.size >= nPub;
      const hs = shelf.hotspots.find((x) => x.id === S.open);
      if (!hs) {
        lastOpen = null;
        l3.replaceChildren(h("p", { class: "hp-shelf-hint", text: S.found.size >= nPub
          ? "All four public books are marked. Tap a title to open it again."
          : "Four of the references in this frame are public. They're all books. Find them in the two iso cams." }));
        return;
      }
      if (hs.id === lastOpen) return;
      lastOpen = hs.id;
      const it = hs.item;
      const body = hs.kind === "reveal"
        ? h("dl", { class: "hp-l3-dl" }, h("dt", { text: "Referent" }), h("dd", { text: it.referent.join("; ") }), h("dt", { text: "Mechanism" }), h("dd", { text: it.mechanism }))
        : h("p", { class: "hp-l3-note" }, shelf.copy[hs.kind], hs.kind === "jump" && [" ", h("a", { href: "#jb-erm", text: "Go there" })]);
      l3.replaceChildren(enter(h("div", { class: "hp-l3 is-stacked hp-l3-book" },
        h("span", { class: "hp-l3-tag", text: "Found" }),
        h("div", { class: "hp-l3-main" },
          h("span", { class: "hp-l3-kicker", text: `${it.timestamp} · ${JB.jokeTypeLabel(it.joke_type)}` }),
          h("span", { class: "hp-l3-title", text: bookTitle(it) }),
          h("div", { class: "hp-l3-body" }, body)))));
    });
    return h("figure", { class: "jb-shelf hp-shelf hp-panel hp-wide" },
      strip("Isolation cam", "0:10 · over 15 references in one frame"),
      h("div", { class: "hp-wideshot" }, h("p", { class: "hp-cam", "aria-hidden": "true" }, h("span", { class: "hp-cam-n", text: "Wide" }), "0:10"),
        h("div", { class: "hp-shot" }, h("img", { src: frame.src, width: frame.w, height: frame.h, alt: JB.altFor(D.shelf.frame) }))),
      h("div", { class: "hp-bug-row" }, pips, countText),
      h("div", { class: "hp-isos" }, iso("shelf-top", 1, "Top shelf"), iso("shelf-bottom", 2, "Bottom shelf")),
      l3,
      h("div", { class: "hp-shelf-foot" }, roster, showAll));
  };

  /* ---------------------------------------------------------------- erm: a three-part replay breakdown */
  /** Word-level swap between an on-screen title and the original it parodies (only when they share most words). */
  const swapOf = (it) => {
    const shown = (it.evidence.match(/["“]([^"”]+)["”]/) || [])[1];
    const orig = (it.referent[0] || "").split(", ").pop();
    if (!shown || !orig) return null;
    const a = shown.split(" "), b = orig.split(" ");
    let pre = 0; while (pre < a.length && pre < b.length && a[pre].toLowerCase() === b[pre].toLowerCase()) pre++;
    let suf = 0; while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf].toLowerCase() === b[b.length - 1 - suf].toLowerCase()) suf++;
    if (pre + suf < 2 || pre + suf === a.length) return null;
    const line = (words, cls) => h("span", { class: `hp-swap-line ${cls}` },
      words.slice(0, pre).join(" "), pre ? " " : "", h("mark", { text: words.slice(pre, words.length - suf).join(" ") }), suf ? " " : "", words.slice(words.length - suf).join(" "));
    return h("div", { class: "hp-swap", "aria-label": `${orig} became ${shown}` },
      h("span", { class: "hp-swap-k", text: "Original" }), line(b, "is-orig"),
      h("span", { class: "hp-swap-k", text: "On screen" }), line(a, "is-shown"));
  };
  /** The book's own spine, cropped from the iso cam and turned to read left to right. */
  const spineOf = (id) => {
    const hs = D.shelf.hotspots.find((x) => x.id === id);
    if (!hs) return null;
    const im = D.images["shelf-" + hs.shelf], rg = im.region, k = im.w / (rg[2] - rg[0]);
    const inset = 3;
    const cx = (hs.box[0] - rg[0] + inset) * k, cy = (hs.box[1] - rg[1]) * k, cw = (hs.box[2] - hs.box[0] - 2 * inset) * k, ch = (hs.box[3] - hs.box[1]) * k;
    const c = h("canvas", { class: "hp-spine", width: Math.round(ch), height: Math.round(cw), "aria-hidden": "true" });
    const img = new Image();
    img.onload = () => { const x = c.getContext("2d"); x.translate(0, c.height); x.rotate(-Math.PI / 2); x.drawImage(img, cx, cy, cw, ch, 0, 0, c.height, c.width); };
    img.src = im.src;
    return c;
  };
  V.erm = (rule) => {
    const it = D.items[rule.item];
    const steps = [
      { key: "evidence", label: "Evidence", sub: "On screen", body: () => [spineOf(it.id), h("p", { class: "hp-erm-text", text: it.evidence })] },
      { key: "referent", label: "Referent", sub: "What it points at", body: () => [h("ul", { class: "hp-erm-refs" }, it.referent.map((r) => h("li", { text: r }))), swapOf(it)] },
      { key: "mechanism", label: "Mechanism", sub: "Why it's funny", body: () => h("p", { class: "hp-erm-text", text: it.mechanism }) },
    ];
    let step = 0;
    const track = h("ol", { class: "hp-track", "aria-label": "Breakdown steps" },
      steps.map((s, i) => h("li", { class: "hp-track-seg", "data-i": i }, h("span", { class: "hp-track-n", text: String(i + 1) }), s.label)));
    const body = h("div", { class: "hp-erm-steps", "aria-live": "polite" });
    const btn = h("button", { class: "hp-btn jb-erm-next", type: "button" });
    const panel = (s, i) => h("div", { class: `hp-erm-step is-${s.key}` },
      h("p", { class: "hp-erm-label" }, h("span", { class: "hp-erm-n", text: String(i + 1) }), s.label, h("span", { class: "hp-erm-sub", text: s.sub })),
      h("div", { class: "hp-erm-body" }, s.body()));
    const sync = () => {
      track.querySelectorAll(".hp-track-seg").forEach((li, i) => { li.classList.toggle("is-on", i <= step); li.toggleAttribute("aria-current", i === step); if (i === step) li.setAttribute("aria-current", "step"); });
      btn.textContent = step < steps.length - 1 ? `Show the ${steps[step + 1].label.toLowerCase()}` : "Run it back";
    };
    btn.onclick = () => {
      if (step < steps.length - 1) { step++; body.append(enter(panel(steps[step], step))); }
      else { step = 0; body.replaceChildren(panel(steps[0], 0)); }
      sync(); JB.layoutSidenotes();
    };
    body.append(panel(steps[0], 0));
    sync();
    return h("figure", { class: "jb-erm hp-erm hp-panel hp-wide", id: "jb-erm" },
      strip("Breakdown", `${it.timestamp} · ${JB.jokeTypeLabel(it.joke_type)}`),
      track, body, h("div", { class: "hp-erm-foot" }, btn));
  };

  /* ---------------------------------------------------------------- the review booth (3-1 loop) */
  const MODE = { normal: "Normal mode", referent: "Referent mode" };

  V.verdict = (result, stage) => {
    const live = result.source === "claude";
    const counts = result.verdict === "CORRECT" ? "Counts" : result.verdict === "PARTIAL" ? "Shown, but only Correct counts" : "No credit";
    return h("div", { class: `jb-verdict hp-ruling ${vcls(result.verdict)}` },
      h("div", { class: "hp-ruling-bar" },
        h("p", { class: "jb-verdict-word hp-ruling-word", text: JB.verdictLabel[result.verdict] }),
        h("p", { class: "hp-ruling-counts", text: counts })),
      live && stage === "normal" && result.ident && h("p", { class: "hp-ruling-split" },
        h("span", { class: `hp-mini ${vcls(result.ident)}` }, `Referent: ${JB.verdictLabel[result.ident]}`),
        h("span", { class: `hp-mini ${vcls(result.verdict)}` }, `Explanation: ${JB.verdictLabel[result.verdict]}`)),
      result.feedback && h("p", { class: "jb-verdict-feedback hp-ruling-fb", text: result.feedback }),
      h("p", { class: "jb-verdict-source hp-src", text: live ? "Graded by Claude against Nick's rubric" : "Self-graded against Nick's rubric" }));
  };

  const yourAnswer = (text) => text && h("blockquote", { class: "hp-yours" }, h("span", { class: "hp-yours-k", text: "Your answer" }), h("p", { text }));

  V.answerBox = (stage, L, placeholder) => {
    const st = L.state[stage], it = L.state.item;
    const id = `jb-${L.state.itemId}-${stage}`;
    const live = L.state.gradeMode === "live";
    const ta = h("textarea", { id, class: "jb-answer", rows: 4, maxlength: 1200, placeholder: "At most three sentences, like the models.", autocomplete: "off", autocapitalize: "sentences", spellcheck: "true", enterkeyhint: "enter" });
    ta.value = st.draft ?? st.answer ?? "";
    const warn = h("p", { class: "hp-warn", "aria-live": "polite" });
    ta.addEventListener("input", () => { st.draft = ta.value; JB.autosize(ta); if (ta.value.trim()) warn.textContent = ""; });
    const go = () => { if (!ta.value.trim()) { warn.textContent = "Write something first, even a guess."; ta.focus(); return; } L.submit(stage, ta.value); };
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); go(); } });
    requestAnimationFrame(() => JB.autosize(ta));
    const submit = h("button", { class: "hp-btn jb-submit", type: "button", "data-submit": "", onclick: go,
      text: live ? (stage === "normal" ? "Grade my call" : "Grade my explanation") : (stage === "normal" ? "Check my call" : "Check my explanation") });
    return h("div", { class: "hp-call jb-answer-wrap" },
      strip(stage === "normal" ? "Your call" : "Your explanation", `${MODE[stage]} · ${it.timestamp}`),
      h("label", { for: id, class: "hp-call-q", text: placeholder }),
      ta, warn,
      h("div", { class: "hp-actions" }, submit,
        live && h("button", { class: "hp-link", type: "button", text: "Grade it myself", onclick: () => L.gradeMyself(stage, ta.value) }),
        h("button", { class: "hp-link", type: "button", text: "Skip", onclick: () => L.skip(stage) })),
      h("p", { class: "hp-fine", text: live
        ? (it.id === D.config.loop_item && stage === "normal"
          ? "Claude grades you the way the judge graded the models. (Yes, Claude is also three of the contestants.) Only Correct counts."
          : "Claude grades you the way the judge graded the models. Only Correct counts.")
        : "You'll see the answer key and grade yourself." }));
  };

  V.stage = (stage, L) => {
    const st = L.state[stage];
    if (st.status === "idle") return V.answerBox(stage, L, stage === "normal" ? "Name what it references, and say why it's funny." : "Now explain why it's funny.");
    if (st.status === "grading") return h("div", { class: "hp-call is-grading jb-grading", role: "status" },
      strip("Under review", MODE[stage], "is-live"),
      yourAnswer(st.answer),
      h("div", { class: "hp-review" }, h("span", { class: "hp-review-bar", "aria-hidden": "true" }), h("p", { class: "hp-review-t", text: "Grading against Nick's rubric…" })),
      h("div", { class: "hp-actions" }, h("button", { class: "hp-link", type: "button", text: "Stop", onclick: () => L.cancel() })));
    if (st.status === "self") {
      const key = L.reveal.selfKey(stage);
      return h("div", { class: "hp-call is-self jb-self" },
        st.note && h("p", { class: "hp-notice jb-note", text: st.note }),
        strip(stage === "normal" ? "The replay" : "The answer key", `${MODE[stage]} · grade yourself`),
        yourAnswer(st.answer),
        enter(h("div", { class: "hp-key" },
          h("p", { class: "hp-key-h jb-self-heading", text: key.heading }),
          key.lines.map((l, i) => h("p", { class: `hp-key-line jb-self-line${stage === "referent" ? " is-sentence" : ""}${i ? " is-alt" : ""}`, text: l })),
          // normal-only rounds show the whole key at once: the referent above, the mechanism here
          key.mechanism && h("p", { class: "hp-key-h jb-self-heading", text: "Why it's funny" }),
          key.mechanism && h("p", { class: "hp-key-line jb-self-line is-sentence", text: key.mechanism }),
          ...(key.mechanism ? key.alt || [] : []).map((a) => h("p", { class: "hp-key-line jb-self-line is-sentence is-alt", text: a })),
          key.criteria && h("p", { class: "hp-key-crit jb-self-criteria" }, h("span", { class: "hp-key-k", text: "Rubric: " }), key.criteria)), "hp-wipe-in"),
        h("p", { class: "hp-ask jb-self-ask", text: key.ask }),
        h("div", { class: "hp-self-btns jb-self-buttons" }, [["CORRECT", "Got it"], ["PARTIAL", "Half"], ["WRONG", "Missed it"]].map(([v, t]) =>
          h("button", { type: "button", class: `hp-self jb-self-btn is-${v.toLowerCase()}`, "data-self": v, onclick: () => L.selfGrade(stage, v) },
            h("span", { class: "hp-self-t", text: t }), h("span", { class: "hp-self-v", text: JB.verdictLabel[v] })))),
        h("p", { class: "hp-fine", text: "Only Got it counts, same as the models." }));
    }
    if (st.status === "done") return h("div", { class: "hp-call is-done jb-done" },
      strip("Ruling", MODE[stage]),
      yourAnswer(st.answer),
      enter(V.verdict(st.result, stage), "hp-slam"));
    if (st.status === "skipped") return h("div", { class: "hp-call is-skipped jb-skipped" }, strip("Skipped", MODE[stage]), h("p", { class: "hp-fine", text: "No answer, no grade." }));
    return null;
  };

  V.promptCard = (b, mode, L) => {
    const { paras, locked } = JB.promptLines(b, mode, L);
    const card = h("div", { class: `hp-feed is-${mode}${locked ? " is-locked" : ""}` },
      strip(mode === "normal" ? "The prompt" : "Replay angle", mode === "normal" ? "Normal mode · what the model sees" : "Referent mode"));
    if (mode === "referent" && !locked) {
      // first line is the framing; the rest is the referent itself, which lands first
      const [first, ...rest] = paras[0];
      card.append(h("p", { class: "hp-feed-p", html: JB.inline(first) }), h("p", { class: "hp-feed-ref", html: rest.map(JB.inline).join("<br>") }),
        ...paras.slice(1).map((lines) => h("p", { class: "hp-feed-p", html: lines.map(JB.inline).join("<br>") })));
      return enter(card, "hp-wipe");
    }
    card.append(...paras.map((lines) => h("p", { class: "hp-feed-p", html: lines.map(JB.inline).join("<br>") })));
    if (locked) card.append(h("p", { class: "hp-feed-lock" }, h("span", { class: "hp-lock-bar", "aria-hidden": "true" }), h("span", { text: "Unlocks after your call." })));
    return card;
  };

  /** How the ten models did on this joke, with the reader on top. */
  const fieldBox = (L) => {
    const it = L.state.item;
    const fN = JB.field(it.id, "normal"), fR = JB.field(it.id, "referent");
    const n = fN.length;
    const c = (f) => f.filter((x) => x.verdict === "CORRECT").length;
    const yours = (stage) => { const s = L.state[stage]; return s.status === "done" ? s.result.verdict : null; };
    const cell = (v, skipped) => h("td", { class: `hp-cell ${vcls(v)}` }, h("span", { class: "hp-cell-sq", "aria-hidden": "true" }), skipped ? "Skipped" : verdictWord(v));
    const yN = yours("normal"), yR = yours("referent");
    const bug = (who, a, b2, cls) => h("div", { class: `hp-fbug ${cls || ""}` }, h("span", { class: "hp-fbug-who", text: who }),
      h("span", { class: "hp-fbug-v" }, h("span", { class: "hp-fbug-k", text: "Normal" }), a), h("span", { class: "hp-fbug-v" }, h("span", { class: "hp-fbug-k", text: "Referent" }), b2));
    const missing = fN.some((x) => !x.verdict) || fR.some((x) => !x.verdict);
    return enter(h("figure", { class: "hp-field hp-panel hp-wide" },
      strip("The field", `${n} models on this joke`),
      h("div", { class: "hp-fbugs" },
        bug("You", L.state.normal.status === "skipped" ? "Skipped" : verdictWord(yN), L.state.referent.status === "skipped" ? "Skipped" : verdictWord(yR), "is-you"),
        bug(`${n} models`, `${c(fN)}/${n}`, `${c(fR)}/${n}`)),
      h("div", { class: "hp-roster-wrap" }, h("table", { class: "hp-roster" },
        h("caption", { class: "hp-sr", text: `Explanation grades for ${JB.shortName(it.id)}: you and ${n} models, normal and referent mode.` }),
        h("thead", null, h("tr", null, h("th", { scope: "col", text: "Contestant" }), h("th", { scope: "col", text: "Normal" }), h("th", { scope: "col", text: "Referent" }))),
        h("tbody", null,
          h("tr", { class: "is-you" }, h("th", { scope: "row" }, h("span", { class: "hp-who", text: "You" })), cell(yN, L.state.normal.status === "skipped"), cell(yR, L.state.referent.status === "skipped")),
          fN.map((m, i) => h("tr", null, h("th", { scope: "row" }, h("span", { class: "hp-who", text: m.model }), h("span", { class: "hp-lab", text: labOf(m.model) })), cell(m.verdict), cell(fR[i].verdict)))))),
      h("figcaption", { class: "hp-src" }, `Explanation grades, ${n} models, this one joke. Only Correct counts.${missing ? " “No answer” means the answer was dropped as off-target." : ""}`)), "hp-in");
  };

  V.loop = (ctx) => {
    const { L, frameBlock, lead, normalPrompt, between, referentPrompt, debrief } = ctx;
    const it = L.state.item;
    const root = h("section", { class: "jb-loop hp-loop", "aria-label": `Play the joke at ${it.timestamp}` });
    const fig = V.figure(frameBlock, D.essayImageMap[frameBlock.file], { wide: true, badge: h("span", { class: "hp-badge", "aria-hidden": "true" }, h("span", { class: "hp-badge-tag", text: "Review" }), it.timestamp) });
    const slotN = h("div", { class: "jb-stage is-normal hp-wide" });
    const slotR = h("div", { class: "jb-stage is-referent hp-wide" });
    const pN = h("div", { class: "hp-wide" }), pR = h("div", { class: "hp-wide" });
    const fieldSlot = h("div", { class: "hp-field-slot" });
    const debriefSlot = h("div", { class: "jb-debrief hp-debrief" });
    let debriefShown = false;
    /* QA (keyboard path): a stage's box is replaced when the call is graded, self-graded or skipped, which
     * dropped focus to <body>. If the reader was working in that stage, land them on the result instead
     * (the same rule as the quiz round). Captured before the swap, applied after it. */
    const keep = (slot, stage) => {
      let was = L.state[stage].status, engaged = false;
      return () => {
        const now = L.state[stage].status, a = document.activeElement;
        engaged = slot.contains(a) || (engaged && (!a || a === document.body));
        return () => {
          if (engaged && was !== now && ["done", "skipped", "self"].includes(now)) {
            const f = slot.querySelector(now === "done" ? ".hp-ruling-word" : now === "self" ? ".hp-key" : ".hp-call");
            if (f) { f.setAttribute("tabindex", "-1"); f.classList.add("hp-landing"); f.focus({ preventScroll: true }); }
            engaged = false;
          }
          was = now;
        };
      };
    };
    const keepN = keep(slotN, "normal"), keepR = keep(slotR, "referent");
    L.subscribe(() => {
      const afterN = keepN(), afterR = keepR();
      JB.swap(pN, () => V.promptCard(normalPrompt, "normal", L), "n" + L.referentRevealed);
      JB.swap(slotN, () => V.stage("normal", L), JB.stageKey(L, "normal"));
      JB.swap(pR, () => V.promptCard(referentPrompt, "referent", L), "r" + L.referentRevealed);
      JB.swap(slotR, () => (L.referentRevealed ? V.stage("referent", L) : null), JB.stageKey(L, "referent"));
      afterN(); afterR();
      if (L.done && !debriefShown) {
        debriefShown = true;
        fieldSlot.replaceChildren(fieldBox(L));
        debriefSlot.replaceChildren(...debrief.flat(Infinity).filter(Boolean));
      }
      if (!L.done) debriefSlot.replaceChildren(h("p", { class: "hp-locked", text: "The models' answers appear after yours." }));
      JB.layoutSidenotes();
    });
    root.append(fig, ...lead, pN, slotN, ...between, pR, slotR, fieldSlot);
    return [root, debriefSlot];
  };

  V.answer = (b, rule) => {
    const a = D.answers[rule.answer];
    const chip = (label, v) => v && h("span", { class: `hp-mini ${vcls(v)}` }, `${label}: ${JB.verdictLabel[v] || v}`);
    return h("figure", { class: `jb-model-answer hp-answer ${vcls(a.explanation)}` },
      h("figcaption", { class: "hp-answer-head" },
        h("span", { class: "hp-answer-who" }, h("span", { class: "jb-model-name hp-answer-model", text: a.model }), h("span", { class: "hp-lab", text: `${a.lab || labOf(a.model)} · ${a.condition} mode` })),
        h("span", { class: "hp-answer-chips" }, chip("Referent", a.identification), chip("Explanation", a.explanation))),
      h("blockquote", null, b.paras.map((p) => h("p", { html: JB.inline(p) }))));
  };

  window.DIRECTION_VIEWS = V;
  /* Shared parts for the section files (views-*.js). Locked with the system after checkpoint 1. */
  window.HP = { svg, ICON, tag, strip, enter, verdictWord, vcls, labOf, bookTitle, fieldBox };
})();

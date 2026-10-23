/* Final score section (thread A, prefix hf-): the "now you try" round and the paired results chart.
 * Built in the Halftime language from views.js: title card + wide/iso cams, the prompt feed, "Your call",
 * the ruling, the ERM breakdown and the field roster. Only one joke panel is in the DOM at a time, and a
 * joke's referent and mechanism come only from L.reveal (gold stays out of the DOM until its reveal).
 * The only thing marked on a frame is the public item's JB.focus() box. */
(function () {
  "use strict";
  const JB = window.JB, D = JB.data, h = JB.h, V = window.DIRECTION_VIEWS, HP = window.HP;
  const { strip, enter, svg, ICON } = HP;
  const reduced = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const LOOP = D.config.loop_item;
  const POOL = D.config.quiz_pool;
  const LEDGER = [LOOP, ...POOL.filter((id) => id !== LOOP)]; // the reader's 7 jokes, in play order
  const colLabel = (id) => (id === LOOP ? "3-1" : String(POOL.indexOf(id) + 1));
  const MODES = ["normal", "referent"];
  const MODE_SHORT = { normal: "Normal", referent: "Referent" };
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const DOWN = '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M1.5 4 6 8.5 10.5 4" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

  /* ---------------------------------------------------------------- verdict squares (shape + color) */
  const SQ = { CORRECT: "is-correct", PARTIAL: "is-partial", WRONG: "is-wrong", none: "is-none", skip: "is-skip" };
  const SQ_WORD = { CORRECT: "Correct", PARTIAL: "Partial", WRONG: "Wrong", none: "No answer", skip: "Skipped" };
  const sq = (state) => h("span", { class: `hf-sq ${SQ[state] || "is-open"}`, "aria-hidden": "true" });
  const sqWord = (state) => SQ_WORD[state] || "not played";
  /** The reader's state on one joke and mode: a verdict, "skip", or null (not played yet). */
  const readerCell = (id, mode) => {
    const r = (JB.reader.results[id] || {})[mode];
    if (r && r.verdict) return r.verdict;
    const L = JB.loops[id];
    return L && L.state[mode].status === "skipped" ? "skip" : null;
  };
  /** A model's grade on one joke and mode: a verdict, or "none" when the answer was dropped as off-target. */
  const modelCell = (id, mode, model) => {
    const v = ((D.verdicts[id] || {})[mode] || {})[model];
    return v && v.ex ? v.ex : "none";
  };
  const legend = (states, labels) => h("ul", { class: "hf-legend" },
    states.map((s, i) => h("li", null, sq(s), h("span", { text: labels[i] }))));

  /* ---------------------------------------------------------------- cams: wide shot + isolation crop */
  /** The public item's box, cropped from the sharpest image that holds it (a shelf detail is 2x the frame). */
  function isoCrop(id) {
    const f = JB.focus(id);
    if (!f) return null;
    const [key, box] = f;
    const fr = D.images[key];
    let srcKey = key, region = [0, 0, fr.orig_w, Math.min(880, fr.orig_h)];
    for (const k of ["shelf-top", "shelf-bottom"]) {
      const r = D.images[k] && D.images[k].region;
      if (r && box[0] >= r[0] && box[1] >= r[1] && box[2] <= r[2] && box[3] <= r[3]) { srcKey = k; region = r; }
    }
    const im = D.images[srcKey], k = im.w / (region[2] - region[0]);
    const spine = (box[3] - box[1]) / (box[2] - box[0]) > 2.5; // a book spine: turn it to read left to right
    // spines: trim the neighbours' edges off the narrow sides, and give the title a little room at the ends
    const inset = spine ? 3 : 0, run = spine ? 5 : 0;
    const y0 = Math.max(region[1], box[1] - run), y1 = Math.min(region[3], box[3] + run);
    const sx = (box[0] - region[0] + inset) * k, sy = (y0 - region[1]) * k;
    const sw = (box[2] - box[0] - 2 * inset) * k, sh = (y1 - y0) * k;
    const scale = Math.min(3, 960 / Math.max(sw, sh));
    const outW = Math.round((spine ? sh : sw) * scale), outH = Math.round((spine ? sw : sh) * scale);
    const c = h("canvas", { class: `hf-iso-c${spine ? " is-spine" : ""}`, width: outW, height: outH, role: "img",
      "aria-label": `Close-up from the same still: ${JB.shortName(id).replace(/^"|"$/g, "")}.` });
    const img = new Image();
    img.onload = () => {
      const x = c.getContext("2d");
      x.imageSmoothingQuality = "high";
      if (spine) { x.translate(0, outH); x.rotate(-Math.PI / 2); x.drawImage(img, sx, sy, sw, sh, 0, 0, outH, outW); }
      else x.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    };
    img.src = im.src;
    return { el: c, spine, ratio: outW / outH, key, box };
  }

  function cams(it, i, n) {
    const f = JB.focus(it.id);
    const key = f ? f[0] : (D.itemFrames[it.id] || [])[0];
    const im = D.images[key];
    const iso = isoCrop(it.id);
    const shot = h("div", { class: "hp-shot hf-shot" }, h("img", { src: im.src, width: im.w, height: im.h, alt: JB.altFor(key) }));
    if (f) {
      const [x0, y0, x1, y1] = f[1], W = im.orig_w, H = Math.min(880, im.orig_h);
      const trk = h("span", { class: "hf-trk", "aria-hidden": "true",
        style: { left: `${(x0 / W) * 100}%`, top: `${(y0 / H) * 100}%`, width: `${((x1 - x0) / W) * 100}%`, height: `${((y1 - y0) / H) * 100}%` } });
      // corners sit just outside the box, except where the box meets the frame's edge
      [["--il", x0 <= 6], ["--it", y0 <= 6], ["--ir", x1 >= W - 6], ["--ib", y1 >= H - 6]].forEach(([k, edge]) => edge && trk.style.setProperty(k, "0px"));
      shot.append(trk);
    }
    const wide = h("div", { class: "hf-feed", style: { flexGrow: (im.w / im.h).toFixed(3) } },
      h("p", { class: "hp-cam", "aria-hidden": "true" }, h("span", { class: "hp-cam-n", text: "Wide" }), it.timestamp), shot);
    const isoFeed = iso && h("div", { class: "hf-feed", style: { flexGrow: iso.ratio.toFixed(3) } },
      h("p", { class: "hp-cam", "aria-hidden": "true" }, h("span", { class: "hp-cam-n", text: "Iso" }), iso.spine ? "The spine, turned" : "Close-up"),
      h("div", { class: "hf-iso-pic" }, iso.el));
    return h("div", { class: "hp-panel hp-wide hf-cams" },
      strip(`Joke ${i + 1} of ${n}`, it.timestamp),
      h("h3", { class: "hf-title", id: `hf-t-${it.id}`, tabindex: "-1", text: JB.shortName(it.id) }),
      h("div", { class: `hf-feeds${iso && iso.spine ? " is-spine" : ""}${iso ? "" : " is-solo"}` }, wide, isoFeed));
  }

  /* ---------------------------------------------------------------- the prompt, with the repeated boilerplate folded */
  /** Normal-mode prompt as the models got it. In the round the framing and instructions are the same as the
   *  3-1 prompt, so they fold away behind one toggle; the scene line (with the red underline) always shows. */
  function normalFeed(block, L, full, toggle) {
    const card = V.promptCard(block, "normal", L);
    const ps = [...card.querySelectorAll(".hp-feed-p")];
    const scene = ps.find((p) => /^At timestamp/.test(p.textContent));
    if (!full && scene) ps.forEach((p) => p !== scene && p.remove());
    card.append(h("p", { class: "hf-fold" },
      h("button", { type: "button", class: "hf-fold-btn", id: `hf-fold-${L.state.itemId}`, "aria-expanded": String(full), onclick: toggle },
        full ? "Fold the instructions" : "Show the full prompt"),
      !full && h("span", { class: "hf-fold-note", text: "Same framing and instructions as the 3-1." })));
    return card;
  }

  /* ---------------------------------------------------------------- after both passes: the breakdown */
  /** Word-level swap between an on-screen parody title and the original (the same device as the ERM card). */
  function swapOf(it) {
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
  }
  /** Run an entrance when the node is first on screen (the reveal usually lands below the fold on a phone).
   *  Rests visible: without IntersectionObserver, or with reduced motion, nothing waits. */
  function onSight(el, cls) {
    if (reduced() || !("IntersectionObserver" in window)) return el;
    el.classList.add(cls, "is-held");
    const go = () => { el.classList.remove("is-held"); io.disconnect(); clearTimeout(t); };
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && go(), { threshold: 0.15 });
    requestAnimationFrame(() => io.observe(el));
    const t = setTimeout(go, 5000); // never leave it hidden
    return el;
  }
  function breakdown(L) {
    const g = L.reveal.gold();
    if (!g) return null;
    const it = L.state.item;
    const step = (n, key, label, sub, body) => h("div", { class: `hp-erm-step is-${key}` },
      h("p", { class: "hp-erm-label" }, h("span", { class: "hp-erm-n", text: String(n) }), label, h("span", { class: "hp-erm-sub", text: sub })),
      h("div", { class: "hp-erm-body" }, body));
    return onSight(h("div", { class: "hp-panel hp-wide hf-bd" },
      strip("The key", `${JB.jokeTypeLabel(it.joke_type)} · ${JB.statusLabel[it.gold_status] || ""}`),
      h("div", { class: "hp-erm-steps" },
        step(1, "evidence", "Evidence", "On screen", h("p", { class: "hp-erm-text", text: it.evidence })),
        step(2, "referent", "Referent", "What it points at", [h("ul", { class: "hp-erm-refs" }, g.referent.map((r) => h("li", { text: r }))), swapOf(it)]),
        step(3, "mechanism", "Mechanism", "Why it's funny", [h("p", { class: "hp-erm-text", text: g.mechanism }),
          ...(g.alt || []).map((a) => h("p", { class: "hp-erm-text hf-alt" }, h("span", { class: "hf-alt-k", text: "Also accepted: " }), a))])),
      null), "hf-bd-in");
  }

  /* ---------------------------------------------------------------- one joke */
  function jokePanel(L, i, n) {
    const it = L.state.item;
    const pN = h("div", { class: "hp-wide" }), sN = h("div", { class: "jb-stage is-normal hp-wide" });
    const pR = h("div", { class: "hp-wide" }), sR = h("div", { class: "jb-stage is-referent hp-wide" });
    const after = h("div", { class: "hf-after" });
    const nb = JB.syntheticPrompt(it.id, "normal"), rb = JB.syntheticPrompt(it.id, "referent");
    let full = false;
    const drawN = () => JB.swap(pN, () => normalFeed(nb, L, full, () => { full = !full; drawN(); JB.layoutSidenotes(); }), "n" + full);
    L.subscribe(() => {
      drawN();
      JB.swap(sN, () => V.stage("normal", L), JB.stageKey(L, "normal"));
      JB.swap(pR, () => V.promptCard(rb, "referent", L), "r" + L.referentRevealed);
      JB.swap(sR, () => (L.referentRevealed ? V.stage("referent", L) : null), JB.stageKey(L, "referent"));
      JB.swap(after, () => (L.done ? [breakdown(L), HP.fieldBox(L)] : null), "a" + L.done);
    });
    return h("article", { class: "jb-round-joke hf-joke", "data-item": it.id, "aria-labelledby": `hf-t-${it.id}` },
      cams(it, i, n), pN, sN, pR, sR, after);
  }

  /* ---------------------------------------------------------------- the reader's linescore (also the round's navigation) */
  function linescore(R, go) {
    const el = h("div", { class: "hf-ls-wrap" });
    const seen = {}; let fresh = new Set(), visible = false;
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible && fresh.size) render();
    }, { threshold: 0.6 }).observe(el);
    const render = () => {
      const cur = R.items[R.state.index];
      const tot = { normal: { c: 0, p: 0, g: 0 }, referent: { c: 0, p: 0, g: 0 } };
      const pop = new Set();
      const cols = LEDGER.map((id) => {
        const st = {};
        MODES.forEach((m) => {
          const s = (st[m] = readerCell(id, m));
          if (s && s !== "skip") { tot[m].g++; if (s === "CORRECT") tot[m].c++; if (s === "PARTIAL") tot[m].p++; }
          const k = `${id}|${m}`;
          if (s && seen[k] === undefined && s !== "skip") fresh.add(k);
          seen[k] = s || undefined;
          if (visible && fresh.has(k) && !reduced()) pop.add(k);
        });
        const isLoop = id === LOOP;
        const name = JB.shortName(id);
        const label = `${isLoop ? "The 3-1 joke, played earlier" : `Joke ${colLabel(id)}, ${name}`}: normal ${sqWord(st.normal)}, referent ${sqWord(st.referent)}.`;
        const kids = [h("span", { class: "hf-ls-h", text: colLabel(id) }),
          ...MODES.map((m) => h("span", { class: `hf-ls-c${pop.has(`${id}|${m}`) ? " is-new" : ""}` }, sq(st[m])))];
        const cls = `hf-ls-col${id === cur ? " is-current" : ""}${isLoop ? " is-loop" : ""}`;
        return isLoop
          ? h("a", { class: cls, href: "#the-basic-mechanics", "aria-label": `${label} Go back to it.` }, kids)
          : h("button", { type: "button", class: cls, id: `hf-ls-${id}`, "aria-label": `${label}${id === cur ? " On screen." : " Go to this joke."}`,
            "aria-current": id === cur ? "step" : null, onclick: () => go(R.items.indexOf(id)) }, kids);
      });
      pop.forEach((k) => fresh.delete(k));
      const total = (m) => h("span", { class: "hf-ls-t" }, tot[m].g ? [h("strong", { text: String(tot[m].c) }), h("span", { text: `/${tot[m].g}` })] : h("span", { text: "–" }));
      const grid = h("div", { class: "hf-ls", role: "group", "aria-label": "Your score on your seven jokes. Pick a joke to play it." },
        h("div", { class: "hf-ls-lab", "aria-hidden": "true" }, h("span", { class: "hf-ls-h" }), h("span", { text: "Normal" }), h("span", { text: "Referent" })),
        cols,
        h("div", { class: "hf-ls-tot", "aria-hidden": "true" }, h("span", { class: "hf-ls-h", text: "Total" }), total("normal"), total("referent")));
      const sum = h("p", { class: "hp-sr" }, `Correct so far: normal ${tot.normal.c} of ${tot.normal.g}, referent ${tot.referent.c} of ${tot.referent.g}.`);
      JB.swap(el, () => [grid, sum]);
    };
    return { el, render };
  }

  /* ---------------------------------------------------------------- the round */
  V.round = (rule) => {
    const R = JB.createRound(rule.items);
    const n = R.loops.length;
    const panels = [];
    const panel = (i) => (panels[i] = panels[i] || jokePanel(R.loops[i], i, n));
    const stage = h("div", { class: "hf-stage" });
    const nav = h("div", { class: "hf-nav-slot" });
    const root = h("section", { class: "jb-round hf-round", id: "jb-round", "aria-label": "Now you try" });
    const go = (i, focus) => {
      R.go(i);
      const head = root.querySelector(".hf-head") || root;
      const t = panels[i] && panels[i].querySelector(".hf-title");
      requestAnimationFrame(() => {
        head.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
        if (focus !== false && t) t.focus({ preventScroll: true });
      });
    };
    const ls = linescore(R, (i) => go(i));
    const head = h("div", { class: "hp-panel hp-wide hf-head" },
      strip("Now you try"),
      h("p", { class: "hf-intro", text: "Same prompts the models got. Make your call cold, then get the referent and explain it again." }),
      ls.el,
      legend(["CORRECT", "PARTIAL", "WRONG", "skip"], ["Correct, counts", "Partial, doesn't count", "Wrong", "Skipped"]),
      h("p", { class: "hf-head-foot" }, h("a", { class: "hf-skip", href: "#jb-results" }, "Skip the round, see the results")));

    const tally = () => {
      const t = { normal: { c: 0, p: 0, g: 0 }, referent: { c: 0, p: 0, g: 0 } };
      LEDGER.forEach((id) => MODES.forEach((m) => { const s = readerCell(id, m); if (s && s !== "skip") { t[m].g++; if (s === "CORRECT") t[m].c++; if (s === "PARTIAL") t[m].p++; } }));
      return t;
    };
    const prevBtn = (i) => i > 0 && h("button", { type: "button", class: "hp-btn hp-btn-ghost hf-prev", "aria-label": `Previous joke: ${JB.shortName(R.items[i - 1])}`, onclick: () => go(i - 1) },
      svg(ICON.prev), h("span", { text: "Prev" }));
    let wrapSeen = false;
    /** Once all six are played the up-next bar turns into the wrap: the reader's two totals and a pointer to the chart. */
    const wrapBar = (i) => {
      const t = tally();
      const stat = (m) => h("span", { class: "hf-wrap-stat" }, h("span", { class: "hf-wrap-k", text: MODE_SHORT[m] }),
        h("span", { class: "hf-wrap-v" }, h("strong", { text: String(t[m].c) }), ` of ${t[m].g}`),
        h("span", { class: "hf-wrap-p", text: t[m].p ? `+${t[m].p} partial, not counted` : " " }));
      const bar = h("div", { class: "hp-panel hp-wide hf-nav is-wrap" },
        strip("Round over", `Correct, on your ${plural(Math.max(t.normal.g, t.referent.g), "joke")}`),
        h("p", { class: "hf-wrap-stats" }, stat("normal"), stat("referent")),
        h("div", { class: "hf-wrap-foot" },
          h("a", { class: "hf-wrap-go", href: "#jb-results" }, "Find your line on the chart below", svg(DOWN)),
          h("span", { class: "hf-wrap-nav" }, prevBtn(i),
            i < n - 1 && h("button", { type: "button", class: "hp-btn hp-btn-ghost hf-next", "data-next": "", "aria-label": `Joke ${i + 2}: ${JB.shortName(R.items[i + 1])}`, onclick: () => go(i + 1) },
              h("span", { text: "Next" }), svg(ICON.next)))));
      if (!wrapSeen) { wrapSeen = true; enter(bar, "hp-in"); }
      return bar;
    };
    const navBar = (S) => {
      const i = S.index, L = R.current;
      if (R.finished) return wrapBar(i);
      const unplayed = R.loops.findIndex((x) => !x.done);
      const nextI = i < n - 1 ? i + 1 : (unplayed >= 0 && unplayed !== i ? unplayed : -1);
      const prev = prevBtn(i);
      if (nextI < 0) return prev ? h("div", { class: "hp-panel hp-wide hf-nav is-end" }, prev) : null;
      const nid = R.items[nextI], nit = D.items[nid];
      return h("div", { class: `hp-panel hp-wide hf-nav${L.done ? " is-ready" : ""}` },
        prev,
        h("div", { class: "hf-upnext", "aria-hidden": "true" },
          h("span", { class: "hf-upnext-k", text: i < n - 1 ? "Up next" : "Not played yet" }),
          h("span", { class: "hf-upnext-t" }, h("span", { class: "hf-upnext-n", text: `${nextI + 1} · ${nit.timestamp}` }), JB.shortName(nid))),
        h("button", { type: "button", class: `hp-btn hf-next${L.done ? "" : " hp-btn-ghost"}`, "data-next": "",
          "aria-label": `${L.done ? "Next joke" : "Skip to joke"} ${nextI + 1}: ${JB.shortName(nid)}`, onclick: () => go(nextI) },
          h("span", { text: L.done ? "Next joke" : "Skip ahead" }), svg(ICON.next)));
    };
    const drawNav = () => JB.swap(nav, () => navBar(R.state), `${R.state.index}|${R.current.done}|${R.finished}|${R.finished ? JSON.stringify(tally()) : ""}`);
    R.subscribe((S) => {
      ls.render();
      JB.swap(stage, () => panel(S.index), `j${S.index}`);
      drawNav();
      JB.layoutSidenotes();
    });
    // the 3-1 column follows the earlier loop too (a skip there changes no result, so listen to the loop itself)
    const L0 = JB.loops[LOOP];
    if (L0) L0.subscribe(() => { ls.render(); drawNav(); });
    JB.on("result", () => ls.render());
    root.append(head, stage, nav);
    return root;
  };

  /* ---------------------------------------------------------------- results: the paired chart */
  /* The round asks the reader the normal-mode (cold) call only. So on "your jokes" each model is still a line,
   * normal → referent, computed on exactly the jokes the reader answered in normal mode (JB.compare().coldItems,
   * rows[i].referentOnCold), and the reader is ONE dot: their normal-mode score on those same jokes. A referent
   * call the reader made earlier (the 3-1) shows in the readout grid, never as a referent end on the chart. */
  const pct = (a, b) => (b ? (100 * a) / b : null);
  const fmtPct = (x) => (x == null ? "–" : `${Math.round(x)}%`);
  const signed = (x, d) => (Math.abs(x) < 1e-9 ? "0" : (x > 0 ? "+" : "−") + Math.abs(x).toFixed(d));
  const cellWord = (s) => (s === "na" ? "Not asked" : sqWord(s));

  /** Rows for a view. "same": the ten models on exactly the reader's normal-mode jokes (answers.json), graded in
   *  both modes; the reader's dot on the same jokes. "all": scores.json, 45 jokes per model; the reader's dot is
   *  kept apart and labelled with its own n. */
  function viewData(view) {
    const cmp = JB.compare();
    const n = cmp.n.cold;
    const played = n > 0;
    const items = [...LEDGER.filter((id) => cmp.coldItems.includes(id)), ...cmp.coldItems.filter((id) => !LEDGER.includes(id))];
    const refCalls = items.filter((id) => { const s = readerCell(id, "referent"); return s && s !== "skip"; });
    const you = played && {
      key: "you", you: true, solo: true, name: "You", lab: `normal mode · ${view === "all" ? "your " : ""}${plural(n, "joke")}`,
      x0: pct(cmp.you.normal, n), x1: null, c0: cmp.you.normal, n0: n, c1: null, n1: null, delta: "",
      partial: items.filter((id) => readerCell(id, "normal") === "PARTIAL").length,
    };
    let rows;
    if (view === "all") {
      rows = D.scores.models.map((m) => ({ key: m.model, name: m.model, lab: m.lab, x0: m.normal_pct, x1: m.referent_pct,
        c0: m.normal_correct, c1: m.referent_correct, n0: m.n, n1: m.n, delta: signed(m.lift_pp, 1), rec: m.recovered, lost: m.lost }));
      if (you) { you.apart = true; rows.push(you); }
    } else {
      rows = cmp.rows.map((r) => ({ key: r.model, name: r.model, lab: r.lab, x0: pct(r.normal, n), x1: pct(r.referentOnCold, n),
        c0: r.normal, c1: r.referentOnCold, n0: n, n1: n, delta: played ? signed(r.referentOnCold - r.normal, 0) : "–" }));
      if (you) rows.push(you);
      const order = (r) => D.modelOrder.indexOf(r.key);
      // by normal mode; the reader first among equals, so their dot sits beside the models it ties
      rows.sort((a, b) => (b.x0 ?? -1) - (a.x0 ?? -1) || (b.you ? 1 : 0) - (a.you ? 1 : 0) || (b.x1 ?? -1) - (a.x1 ?? -1) || order(a) - order(b));
    }
    return { rows, unit: view === "all" ? "pts" : "jokes", cmp, played, items, n, refCalls };
  }

  function rowEl(key) {
    const el = h("button", { type: "button", class: "hf-row", "data-key": key });
    el.append(
      h("span", { class: "hf-row-name" }, h("span", { class: "hf-row-model" }), h("span", { class: "hf-row-lab" })),
      h("span", { class: "hf-row-track", "aria-hidden": "true" }, h("span", { class: "hf-row-in" },
        h("span", { class: "hf-seg" }), h("span", { class: "hf-dot is-n" }), h("span", { class: "hf-dot is-r" }), h("span", { class: "hf-dot-lab", hidden: true }))),
      h("span", { class: "hf-row-val", "aria-hidden": "true" }));
    return el;
  }
  function paintRow(el, r, unit) {
    el.classList.toggle("is-you", !!r.you);
    el.querySelector(".hf-row-model").textContent = r.name;
    el.querySelector(".hf-row-lab").textContent = r.lab || "";
    el.querySelector(".hf-row-val").textContent = r.delta;
    const seg = el.querySelector(".hf-seg"), dn = el.querySelector(".hf-dot.is-n"), dr = el.querySelector(".hf-dot.is-r"), lab = el.querySelector(".hf-dot-lab");
    const has0 = r.x0 != null, has1 = r.x1 != null;
    dn.hidden = !has0; dr.hidden = !has1; seg.hidden = !(has0 && has1);
    if (has0) dn.style.left = `${r.x0}%`;
    if (has1) dr.style.left = `${r.x1}%`;
    if (has0 && has1) { seg.style.left = `${Math.min(r.x0, r.x1)}%`; seg.style.width = `${Math.abs(r.x1 - r.x0)}%`; }
    el.classList.toggle("is-flat", has0 && has1 && Math.abs(r.x1 - r.x0) < 0.01);
    // the reader's single dot says what it is, right beside it
    lab.hidden = !(r.solo && has0);
    if (r.solo && has0) {
      lab.textContent = `${r.c0}/${r.n0} · normal mode`;
      lab.style.left = `${r.x0}%`;
      lab.classList.toggle("is-left", r.x0 > 55);
    }
    const v = (c, n, x) => (x == null ? "not answered" : `${c} of ${n}, ${fmtPct(x)}`);
    el.setAttribute("aria-label", r.solo
      ? `You, on ${plural(r.n0, "joke")}. Normal mode ${v(r.c0, r.n0, r.x0)}. Not asked in referent mode, so no change.`
      : `${r.name}${r.lab ? `, ${r.lab}` : ""}. Normal mode ${v(r.c0, r.n0, r.x0)}. Referent mode ${v(r.c1, r.n1, r.x1)}. Change ${r.delta.replace("−", "minus ")} ${unit === "pts" ? "points" : "jokes"}.`);
  }

  /** The readout under the chart: whichever line is picked, with its numbers and (on your jokes) a joke-by-joke grid. */
  function readout(view, d, key) {
    const r = d.rows.find((x) => x.key === key);
    if (!r) return h("p", { class: "hf-ro-hint", text: d.played ? "Pick a line to see its numbers." : "Pick a line to see its numbers. Play the round above and your dot joins the chart." });
    const head = h("p", { class: "hf-ro-h" }, h("span", { class: "hf-ro-name", text: r.name }), r.lab && h("span", { class: "hf-ro-lab", text: r.lab }));
    const val = (c, n, x) => h("span", { class: "hf-ro-v" }, x == null ? "–" : `${c}/${n}`, x == null ? null : h("small", { text: ` ${fmtPct(x)}` }));
    const nums = r.solo
      ? h("p", { class: "hf-ro-nums" },
        h("span", { class: "hf-ro-n" }, h("span", { class: "hf-ro-k", text: "Normal" }), val(r.c0, r.n0, r.x0)),
        h("span", { class: "hf-ro-n is-delta" }, h("span", { class: "hf-ro-k", text: "Partial, not counted" }), h("span", { class: "hf-ro-v", text: String(r.partial) })))
      : h("p", { class: "hf-ro-nums" },
        h("span", { class: "hf-ro-n" }, h("span", { class: "hf-ro-k", text: "Normal" }), val(r.c0, r.n0, r.x0)),
        h("span", { class: "hf-ro-arrow", "aria-hidden": "true" }, svg(ICON.next)),
        h("span", { class: "hf-ro-n" }, h("span", { class: "hf-ro-k", text: "Referent" }), val(r.c1, r.n1, r.x1)),
        h("span", { class: "hf-ro-n is-delta" }, h("span", { class: "hf-ro-k", text: d.unit === "pts" ? "Change, pts" : "Change" }), h("span", { class: "hf-ro-v", text: r.delta })));
    if (view === "all" && !r.you) return [head, nums,
      h("p", { class: "hf-ro-note", text: `With the referent it got ${plural(r.rec, "joke")} it had missed in normal mode, and lost ${r.lost}. All 45 jokes.` })];
    if (view === "all") return [head, nums, h("p", { class: "hf-ro-note", text: `Your number rests on your ${plural(d.n, "joke")}, in normal mode. Switch to “Your ${plural(d.n, "joke")}” to compare like with like.` })];
    // your jokes: a joke-by-joke grid, you against the picked model. The reader's referent row appears only if they
    // made a referent call on one of these jokes (the 3-1); the round doesn't ask for one.
    const youN = { label: "You", you: true, cells: d.items.map((id) => readerCell(id, "normal")) };
    const youR = d.refCalls.length ? { label: "You", you: true, cells: d.items.map((id) => readerCell(id, "referent") || "na") } : null;
    const rowsSpec = r.you
      ? [{ group: "Normal mode", ...youN }, youR && { group: "Referent mode", ...youR }]
      : [{ group: "Normal mode", ...youN }, { label: r.name, cells: d.items.map((id) => modelCell(id, "normal", r.key)) },
        { group: "Referent mode", label: r.name, cells: d.items.map((id) => modelCell(id, "referent", r.key)) }, youR];
    const spec = rowsSpec.filter(Boolean);
    const grid = h("div", { class: "hf-ro-scroll" }, h("table", { class: "hf-ro-grid" },
      h("caption", { class: "hp-sr", text: `${r.you ? "Your grades" : `You and ${r.name}`}, joke by joke` }),
      h("thead", null, h("tr", null, h("th", { scope: "col" }, h("span", { class: "hp-sr", text: "Contestant" })),
        d.items.map((id) => h("th", { scope: "col", class: "hf-ro-th", title: JB.shortName(id) }, colLabel(id), h("span", { class: "hp-sr", text: ` ${JB.shortName(id)}` }))))),
      h("tbody", null, spec.map((s) => [
        s.group && h("tr", { class: "hf-ro-group" }, h("th", { scope: "rowgroup", colspan: String(d.items.length + 1), text: s.group })),
        h("tr", { class: s.you ? "is-you" : null },
          h("th", { scope: "row", class: "hf-ro-who", text: s.label }),
          s.cells.map((c) => h("td", { class: "hf-ro-td" }, sq(c === "na" ? null : c), h("span", { class: "hp-sr", text: cellWord(c) }))))]))));
    const all = spec.flatMap((s) => s.cells);
    const keys = [["CORRECT", "Correct"], ["PARTIAL", "Partial"], ["WRONG", "Wrong"],
      all.includes("none") && ["none", "No answer (off-target, counts as wrong)"], all.includes("skip") && ["skip", "Skipped"], all.includes("na") && [null, "Not asked"]].filter(Boolean);
    return [head, nums, grid, legend(keys.map((k) => k[0]), keys.map((k) => k[1])),
      r.you && h("p", { class: "hf-ro-note hf-ro-after", text: "Pick a model to see its grades next to yours, joke by joke." })];
  }

  function numbersTable(d) {
    return h("div", { class: "hp-roster-wrap" }, h("table", { class: "hp-roster hf-tbl" },
      h("caption", { class: "hp-sr", text: "Paired results as a table" }),
      h("thead", null, h("tr", null, ["Contestant", "Normal", "Referent", d.unit === "pts" ? "Change, pts" : "Change"].map((t) => h("th", { scope: "col", text: t })))),
      h("tbody", null, d.rows.map((r) => h("tr", { class: r.you ? "is-you" : null },
        h("th", { scope: "row" }, h("span", { class: "hp-who", text: r.name }), h("span", { class: "hp-lab", text: r.lab || "" })),
        h("td", { text: r.x0 == null ? "–" : `${r.c0}/${r.n0} · ${fmtPct(r.x0)}` }),
        h("td", { text: r.solo ? "Not asked" : r.x1 == null ? "–" : `${r.c1}/${r.n1} · ${fmtPct(r.x1)}` }),
        h("td", { text: r.solo ? "–" : r.delta }))))));
  }

  V.results = () => {
    const fig = h("figure", { class: "jb-results hf-res hp-panel hp-wide", id: "jb-results" });
    let view = null, sel = null, table = false, lastPlayed = false;
    const rowsEls = new Map();
    const tabs = h("div", { class: "hf-tabs", role: "group", "aria-label": "Which jokes" });
    const keyRow = h("ul", { class: "hf-key", "aria-hidden": "true" });
    const colHead = h("div", { class: "hf-row hf-row-head", "aria-hidden": "true" },
      h("span", { class: "hf-row-name", text: "Contestant" }), h("span", { class: "hf-row-track", text: "Correct explanations" }), h("span", { class: "hf-row-val" }));
    const list = h("div", { class: "hf-rows", role: "group", "aria-label": "Contestants, normal mode to referent mode" });
    const axis = h("div", { class: "hf-row hf-axis", "aria-hidden": "true" }, h("span", { class: "hf-row-name" }),
      h("span", { class: "hf-row-track" }, h("span", { class: "hf-row-in" }, [0, 25, 50, 75, 100].map((t) => h("span", { class: "hf-tick", style: { left: `${t}%` }, text: `${t}%` })))),
      h("span", { class: "hf-row-val" }));
    const ro = h("div", { class: "hf-ro" });
    const tblBtn = h("button", { type: "button", class: "hf-tbl-btn", "aria-expanded": "false" });
    const tblSlot = h("div", { class: "hf-tbl-slot" });
    const cap = h("figcaption", { class: "hp-src hf-cap" });
    const head = h("div", { class: "hf-res-head" });
    tblBtn.onclick = () => { table = !table; render(); };

    const render = () => {
      const probe = viewData("same");
      if (probe.played && !lastPlayed && view !== "all") sel = sel || "you";
      lastPlayed = probe.played;
      const v = view || (probe.played ? "same" : "all");
      const d = v === "same" ? probe : viewData("all");
      JB.swap(head, () => strip("Final score", v === "all"
        ? `Context · the full benchmark, ${D.scores.models[0].n} jokes per model`
        : `Explanation grades · normal → referent · on the ${plural(d.n, "joke")} you answered`), `${v}|${d.n}`);
      if (sel === "you" && !d.played) sel = null;
      // tabs
      const tab = (id, text, disabled) => h("button", { type: "button", class: "hf-tab", "aria-pressed": String(v === id), disabled: disabled || null,
        onclick: () => { if (view !== id) { view = id; render(); } } }, text);
      JB.swap(tabs, () => [tab("same", probe.played ? `Your ${plural(probe.n, "joke")}` : "Your jokes", !probe.played), tab("all", "All 45 jokes")], `${v}|${probe.n}|${probe.played}`);
      keyRow.replaceChildren(...[
        h("li", null, h("span", { class: "hf-k-dot is-n" }), "Normal mode"),
        h("li", null, h("span", { class: "hf-k-dot is-r" }), "Referent mode"),
        d.played && h("li", { class: "is-you" }, h("span", { class: "hf-k-dot is-n is-you" }), "You, normal mode")].filter(Boolean));
      colHead.lastChild.textContent = d.unit === "pts" ? "Change, pts" : "Change";
      // rows, kept by key so a view switch can glide them (FLIP) instead of redrawing
      const before = new Map();
      rowsEls.forEach((el, k) => el.isConnected && before.set(k, el.getBoundingClientRect().top));
      const els = d.rows.map((r) => {
        let el = rowsEls.get(r.key);
        if (!el) { el = rowEl(r.key); rowsEls.set(r.key, el); el.addEventListener("click", () => { sel = el.dataset.key; render(); }); }
        el.classList.toggle("is-sel", sel === r.key);
        el.setAttribute("aria-pressed", String(sel === r.key));
        return el;
      });
      const kids = [];
      d.rows.forEach((r, i) => {
        if (r.apart) kids.push(h("p", { class: "hf-apart", text: `You, on your ${plural(d.n, "joke")}, in normal mode. Not the same test as the 45.` }));
        kids.push(els[i]);
      });
      if (!d.played) kids.push(h("div", { class: "hf-row is-you is-empty" },
        h("span", { class: "hf-row-name" }, h("span", { class: "hf-row-model", text: "You" }), h("span", { class: "hf-row-lab", text: "not played yet" })),
        h("span", { class: "hf-row-track" }, h("a", { class: "hf-empty-go", href: "#jb-round" }, "Play the round to add your dot")), h("span", { class: "hf-row-val" })));
      list.replaceChildren(...kids);
      const glide = !reduced() && before.size;
      d.rows.forEach((r, i) => {
        const el = els[i];
        if (glide && before.has(r.key)) {
          const dy = before.get(r.key) - el.getBoundingClientRect().top;
          if (Math.abs(dy) > 1 && el.animate) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
          requestAnimationFrame(() => paintRow(el, r, d.unit)); // let the dots slide to their new values
        } else paintRow(el, r, d.unit);
      });
      JB.swap(ro, () => readout(v, d, sel), `${v}|${sel}|${JSON.stringify(d.rows.find((x) => x.key === sel) || null)}|${d.items.join()}|${d.refCalls.join()}`);
      tblBtn.textContent = table ? "Hide the table" : "Show as a table";
      tblBtn.setAttribute("aria-expanded", String(table));
      tblSlot.replaceChildren(...(table ? [numbersTable(d)] : []));
      // the 45-joke view has no footnote (Nick, 24 Oct); the per-joke view keeps its how-to-read note
      cap.hidden = v === "all";
      cap.textContent = v === "all"
        ? ""
        : `The ten models on exactly the ${plural(d.n, "joke")} you answered, each graded in normal mode and in referent mode. ${d.refCalls.length ? `Your dot is your normal-mode score; your ${plural(d.refCalls.length, "referent-mode call")} ${d.refCalls.length === 1 ? "is" : "are"} shown joke by joke below, not on the chart.` : "You answered in normal mode only, so you're a single dot."} Answers dropped as off-target count as wrong, as in the benchmark. With ${plural(d.n, "joke")}, one answer moves a line ${Math.round(100 / d.n)} points.`;
      JB.layoutSidenotes();
    };
    fig.append(
      head,
      tabs, keyRow, colHead, list, axis, ro,
      h("div", { class: "hf-res-foot" }, tblBtn), tblSlot, cap);
    JB.on("result", render);
    render();
    return fig;
  };
})();

/* Round variant A, "compact" (prefix rva-): the cold call only, one card per joke.
 * One Halftime package: a scorebug row (the six jokes and your Correct count, which is also the navigation),
 * the whole still on top, the joke's iso crop beside its scene line, the full prompt one tap away,
 * and the answer box. Grading swaps the bottom of the same card to the ruling, the key and a one-line field
 * summary that opens the roster only on tap.
 * Privacy: the only thing cropped or marked on a frame is the public item's JB.focus() box. Gold (referent,
 * mechanism) comes only from L.reveal, so it enters the DOM when that joke is graded or skipped. */
(function () {
  "use strict";
  const JB = window.JB, D = JB.data, h = JB.h, HP = window.HP;
  const { strip, svg, ICON, vcls } = HP;
  const reduced = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const DOWN = '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M1.5 4 6 8.5 10.5 4" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const SQ = { CORRECT: "is-correct", PARTIAL: "is-partial", WRONG: "is-wrong", none: "is-none", skip: "is-skip" };
  const sq = (state) => h("span", { class: `hf-sq ${SQ[state] || "is-open"}`, "aria-hidden": "true" });
  const WORD = { CORRECT: "Correct", PARTIAL: "Partial", WRONG: "Wrong", none: "No answer", skip: "Skipped" };
  const name = (id) => JB.shortName(id).replace(/^"|"$/g, "");

  /** The reader's state on one round joke: a verdict, "skip", or null. */
  const stateOf = (L) => (L.state.normal.status === "done" ? L.state.normal.result.verdict : L.state.normal.status === "skipped" ? "skip" : null);

  /* ---------------------------------------------------------------- the public item, cropped from its still */
  function crop(id) {
    const f = JB.focus(id);
    if (!f) return null;
    const [key, box] = f;
    const fr = D.images[key];
    let srcKey = key, region = [0, 0, fr.orig_w, Math.min(880, fr.orig_h)];
    // a book on the shelf: the shelf details are twice as sharp as the frame
    if (key === D.shelf.frame) for (const k of ["shelf-top", "shelf-bottom"]) {
      const r = D.images[k] && D.images[k].region;
      if (r && box[0] >= r[0] && box[1] >= r[1] && box[2] <= r[2] && box[3] <= r[3]) { srcKey = k; region = r; }
    }
    const im = D.images[srcKey], k = im.w / (region[2] - region[0]);
    const spine = (box[3] - box[1]) / (box[2] - box[0]) > 2.5; // turn a spine to read left to right
    const inset = spine ? 3 : 0, run = spine ? 5 : 0;           // trim the neighbours' edges, give the title room
    const y0 = Math.max(region[1], box[1] - run), y1 = Math.min(region[3], box[3] + run);
    const sx = (box[0] - region[0] + inset) * k, sy = (y0 - region[1]) * k;
    const sw = (box[2] - box[0] - 2 * inset) * k, sh = (y1 - y0) * k;
    const scale = Math.min(3, 520 / Math.max(sw, sh));
    const outW = Math.round((spine ? sh : sw) * scale), outH = Math.round((spine ? sw : sh) * scale);
    const c = h("canvas", { class: "rva-crop", width: outW, height: outH, "aria-hidden": "true" });
    const img = new Image();
    img.onload = () => {
      const x = c.getContext("2d");
      x.imageSmoothingQuality = "high";
      if (spine) { x.translate(0, outH); x.rotate(-Math.PI / 2); x.drawImage(img, sx, sy, sw, sh, 0, 0, outH, outW); }
      else x.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    };
    img.src = im.src;
    return { el: c, spine, key, box };
  }

  /** The whole still, as the models saw it; the public item's box gets the four tracking corners, nothing else. */
  function wideStill(id) {
    const f = JB.focus(id);
    const key = f ? f[0] : (D.itemFrames[id] || [])[0];
    const im = D.images[key];
    const shot = h("div", { class: "hp-shot rva-shot" }, h("img", { src: im.src, width: im.w, height: im.h, alt: JB.altFor(key), decoding: "async" }));
    if (f) {
      const [x0, y0, x1, y1] = f[1], W = im.orig_w, H = Math.min(880, im.orig_h);
      const trk = h("span", { class: "hf-trk", "aria-hidden": "true",
        style: { left: `${(x0 / W) * 100}%`, top: `${(y0 / H) * 100}%`, width: `${((x1 - x0) / W) * 100}%`, height: `${((y1 - y0) / H) * 100}%` } });
      [["--il", x0 <= 6], ["--it", y0 <= 6], ["--ir", x1 >= W - 6], ["--ib", y1 >= H - 6]].forEach(([p, edge]) => edge && trk.style.setProperty(p, "0px"));
      shot.append(trk);
    }
    return shot;
  }

  /* ---------------------------------------------------------------- the top of the card: scene, prompt, still */
  function feed(L, i, n) {
    const it = L.state.item, id = it.id;
    const c = crop(id);
    const stillId = `rva-still-${id}`, promptId = `rva-prompt-${id}`;
    // the whole still is always shown (Nick: "available immediately and not hidden at first")
    const still = h("div", { class: "rva-still", id: stillId }, wideStill(id));
    const prompt = h("div", { class: "rva-prompt", id: promptId, hidden: true });
    const toggles = [];
    const toggle = (btn, panel, fill, on, off) => {
      const open = panel.hidden;
      if (open && !panel.childElementCount) panel.append(...[].concat(fill()));
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (btn.dataset.label) btn.querySelector(".rva-tg-t").textContent = open ? off : on;
      JB.layoutSidenotes();
    };
    const fillPrompt = () => [
      ...JB.syntheticPrompt(id, "normal").lines.map((lines) => h("p", { class: "rva-prompt-p", html: lines.map(JB.inline).join("<br>") })),
      h("p", { class: "hp-src", text: "The same framing and instructions every model got, here and in the 3-1." })];
    const promptBtn = h("button", { type: "button", class: "rva-tg", "aria-expanded": "false", "aria-controls": promptId, "data-label": "1" },
      h("span", { class: "rva-tg-t", text: "Full prompt" }));
    promptBtn.onclick = () => toggle(promptBtn, prompt, fillPrompt, "Full prompt", "Hide the prompt");
    toggles.push(promptBtn);

    // the thumbnail: the item's own crop, or (no box on record) the still, unmarked
    const frameKey = (D.itemFrames[id] || [])[0];
    const thumbPic = c ? c.el : null; void frameKey;
    // no close-up box on record (e.g. a line of dialogue): the still above is enough, so no thumbnail
    const thumb = c && h("div", { class: `rva-thumb${c ? (c.spine ? " is-spine" : " is-crop") : " is-frame"}`, role: "img",
      "aria-label": c ? "Close-up of the joke from the still above." : "The still." },
    thumbPic, h("span", { class: "hp-cam-n rva-thumb-k", "aria-hidden": "true", text: c ? "Iso" : "Wide" }));

    const line = h("span", { class: "rva-evline", text: it.evidence });
    const scene = h("div", { class: "rva-scene" },
      h("p", { class: "rva-at", text: `At timestamp ${it.timestamp}, this happens:` }),
      h("p", { class: "rva-ev" }, line));
    return h("div", { class: "hp-panel rva-feed" },
      h("div", { class: "rva-head" },
        h("h3", { class: "rva-title", id: `rva-t-${id}`, tabindex: "-1" }, h("span", { class: "rva-title-n", text: `${i + 1}` }), name(id)),
        h("span", { class: "rva-head-meta", text: it.timestamp })),
      still,
      h("div", { class: `rva-media${c && c.spine ? " is-stacked" : ""}${c ? "" : " is-solo"}` }, thumb, scene, h("div", { class: "rva-tgs" }, toggles)),
      prompt);
  }

  /* ---------------------------------------------------------------- the bottom of the card: box → ruling + key */
  const keyed = new Set(); // jokes whose key has already made its entrance (a self-grade keeps it in place)
  function keyBox(L, g) {
    const fresh = !keyed.has(L.state.itemId); keyed.add(L.state.itemId);
    const alt = (g.alt || []).filter(Boolean);
    return h("div", { class: `hp-key rva-key${fresh && !reduced() ? " is-fresh" : ""}` },
      h("dl", { class: "rva-key-dl" },
        h("dt", { class: "rva-k-ref", text: "Referent" }),
        h("dd", { class: "rva-k-ref" }, g.referent.map((r, j) => h("span", { class: `rva-ref${j ? " is-2nd" : ""}`, text: r }))),
        h("dt", { class: "rva-k-why", text: "Why it's funny" }),
        h("dd", { class: "rva-k-why" }, h("span", { text: g.mechanism }),
          alt.map((a) => h("span", { class: "rva-alt" }, h("strong", { text: "Also accepted: " }), a)))),
      g.criteria && g.self && h("details", { class: "rva-rubric" }, h("summary", null, "The rubric"), h("p", { text: g.criteria })));
  }

  const rosterOpen = {};
  function fieldLine(L) {
    const id = L.state.itemId;
    const fN = JB.field(id, "normal"), fR = JB.field(id, "referent"), n = fN.length;
    const got = fN.filter((x) => x.verdict === "CORRECT").length;
    const rid = `rva-roster-${id}`;
    const cell = (v, text) => h("td", { class: `hp-cell ${v ? vcls(v) : "is-none"}` }, h("span", { class: "hp-cell-sq", "aria-hidden": "true" }), text || WORD[v || "none"]);
    const you = stateOf(L);
    const missing = fN.some((x) => !x.verdict) || fR.some((x) => !x.verdict);
    const roster = h("div", { class: "rva-roster", id: rid, hidden: !rosterOpen[id] },
      h("div", { class: "hp-roster-wrap" }, h("table", { class: "hp-roster" },
        h("caption", { class: "hp-sr", text: `Explanation grades on ${name(id)}: you, cold, and the ${n} models, cold and with the referent.` }),
        h("thead", null, h("tr", null, h("th", { scope: "col", text: "Contestant" }), h("th", { scope: "col", text: "Cold" }), h("th", { scope: "col", text: "With the referent" }))),
        h("tbody", null,
          h("tr", { class: "is-you" }, h("th", { scope: "row" }, h("span", { class: "hp-who", text: "You" })),
            you === "skip" ? cell(null, "Skipped") : cell(you), cell(null, "Not asked")),
          fN.map((m, j) => h("tr", null, h("th", { scope: "row" }, h("span", { class: "hp-who", text: m.model }), h("span", { class: "hp-lab", text: HP.labOf(m.model) })),
            cell(m.verdict), cell(fR[j].verdict)))))),
      h("p", { class: "hp-src", text: `Explanation grades, ${n} models, this one joke. Only Correct counts.${missing ? " “No answer” means the answer was dropped as off-target, which counts as wrong." : ""}` }));
    const btn = h("button", { type: "button", class: "rva-field", "aria-expanded": String(!!rosterOpen[id]), "aria-controls": rid },
      h("span", { class: "rva-field-sqs", "aria-hidden": "true" }, fN.map((m) => sq(m.verdict || "none"))),
      h("span", { class: "rva-field-t" }, h("strong", { text: `${got} of ${n}` }), " models got it cold"),
      h("span", { class: "rva-field-ico", "aria-hidden": "true", html: DOWN }));
    btn.onclick = () => {
      rosterOpen[id] = roster.hidden; roster.hidden = !roster.hidden;
      btn.setAttribute("aria-expanded", String(!roster.hidden)); JB.layoutSidenotes();
    };
    return [btn, roster];
  }

  const yours = (text) => text && h("blockquote", { class: "hp-yours rva-yours" }, h("span", { class: "hp-yours-k", text: "Your call" }), h("p", { text }));

  const ruled = new Set(); // the ruling slams in once, not every time you come back to the joke
  function ruling(result, id) {
    const v = result.verdict, fresh = !ruled.has(id); ruled.add(id);
    return h("div", { class: `jb-verdict hp-ruling rva-ruling ${vcls(v)}${fresh && !reduced() ? " hp-slam" : ""}` },
      h("div", { class: "hp-ruling-bar" },
        h("p", { class: "jb-verdict-word hp-ruling-word", text: JB.verdictLabel[v] }),
        h("p", { class: "hp-ruling-counts", text: v === "CORRECT" ? "Counts" : v === "PARTIAL" ? "Shown, doesn't count" : "No credit" })),
      result.feedback && h("p", { class: "jb-verdict-feedback hp-ruling-fb rva-fb", text: result.feedback }));
  }

  function box(L) {
    const st = L.state.normal, it = L.state.item;
    const live = L.state.gradeMode === "live";
    const id = `rva-a-${it.id}`;
    const ta = h("textarea", { id, class: "jb-answer rva-ta", rows: 3, maxlength: 1200, placeholder: "At most three sentences, like the models.",
      autocomplete: "off", autocapitalize: "sentences", spellcheck: "true", enterkeyhint: "enter" });
    ta.value = st.draft ?? st.answer ?? "";
    const warn = h("p", { class: "hp-warn", "aria-live": "polite" });
    ta.addEventListener("input", () => { st.draft = ta.value; JB.autosize(ta); if (ta.value.trim()) warn.textContent = ""; });
    const go = () => { if (!ta.value.trim()) { warn.textContent = "Write something first, even a guess."; ta.focus(); return; } L.submit("normal", ta.value); };
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); go(); } });
    requestAnimationFrame(() => JB.autosize(ta));
    return [
      h("label", { for: id, class: "rva-q" }, "Your call", h("span", { text: "What does it reference, and why is it funny?" })),
      ta, warn,
      h("div", { class: "hp-actions rva-actions" },
        h("button", { class: "hp-btn jb-submit", type: "button", "data-submit": "", onclick: go, text: live ? "Grade my call" : "Check my call" }),
        live && h("button", { class: "hp-link", type: "button", text: "Grade it myself", onclick: () => L.gradeMyself("normal", ta.value) }),
        h("button", { class: "hp-link", type: "button", text: "Skip", onclick: () => L.skip("normal") })),
      h("p", { class: "hp-fine rva-fine", text: live ? "Claude grades you the way the judge graded the models. Only Correct counts." : "You'll see the answer key and grade yourself." })];
  }

  function stage(L, R, go) {
    const st = L.state.normal;
    if (st.status === "idle") return box(L);
    if (st.status === "grading") return [yours(st.answer),
      h("div", { class: "hp-review rva-review", role: "status" }, h("span", { class: "hp-review-bar", "aria-hidden": "true" }), h("p", { class: "hp-review-t", text: "Grading against Nick's rubric…" }),
        h("button", { class: "hp-link", type: "button", text: "Stop", onclick: () => L.cancel() }))];
    if (st.status === "self") {
      const k = L.reveal.selfKey("normal");
      return [st.note && h("p", { class: "hp-notice jb-note", text: st.note }),
        yours(st.answer),
        keyBox(L, { referent: k.lines, mechanism: k.mechanism, alt: k.alt, criteria: k.criteria, self: true }),
        h("p", { class: "hp-ask jb-self-ask", text: k.ask }),
        h("div", { class: "hp-self-btns jb-self-buttons" }, [["CORRECT", "Got it"], ["PARTIAL", "Half"], ["WRONG", "Missed it"]].map(([v, t]) =>
          h("button", { type: "button", class: `hp-self jb-self-btn is-${v.toLowerCase()}`, "data-self": v, onclick: () => L.selfGrade("normal", v) },
            h("span", { class: "hp-self-t", text: t }), h("span", { class: "hp-self-v", text: JB.verdictLabel[v] })))),
        h("p", { class: "hp-fine", text: "Only Got it counts, same as the models." })];
    }
    // done or skipped: the ruling and the key take the box's place
    const g = L.reveal.gold();
    if (!g) return null;
    const result = st.result;
    return [
      st.status === "skipped" ? h("p", { class: "rva-skipped" }, h("strong", { text: "Skipped." }), " No answer, no grade. Here's the key.") : [yours(st.answer), ruling(result, L.state.itemId)],
      keyBox(L, { ...g, self: result && result.source === "self" }),
      fieldLine(L),
      after(R, go),
      h("p", { class: "hp-fine rva-src", text: [result ? (result.source === "claude" ? "Graded by Claude" : "Self-graded") : null].filter(Boolean).join(" · ") })];
  }

  /** Under a played joke: the next unplayed one, or, once all six are in, the wrap. */
  function after(R, go) {
    const n = R.loops.length, i = R.state.index;
    const order = [...Array(n).keys()].map((k) => (i + 1 + k) % n).filter((k) => k !== i);
    const nextI = order.find((k) => !R.loops[k].done);
    if (nextI == null) {
      const t = score(R);
      return h("div", { class: "rva-wrap" },
        h("p", { class: "rva-wrap-t" }, h("span", { class: "rva-wrap-k", text: "Round over" }),
          // QA: with every joke skipped this read "0 of 0 correct cold" and pointed at a dot that isn't there
          t.g ? h("span", { class: "rva-wrap-v" }, h("strong", { text: String(t.c) }), ` of ${t.g} correct cold`) : h("span", { class: "rva-wrap-v", text: "No calls graded" }),
          (t.p || t.s) ? h("span", { class: "rva-wrap-p", text: [t.p && `+${t.p} partial, not counted`, t.s && `${t.s} skipped`].filter(Boolean).join(" · ") }) : null),
        h("a", { class: "rva-wrap-go", href: "#jb-results" }, t.g ? "Find your dot on the chart" : "See the chart", svg(DOWN)));
    }
    return h("button", { type: "button", class: "hp-btn rva-next", "data-next": "", "aria-label": `Next joke, ${nextI + 1} of ${n}: ${name(R.items[nextI])}`, onclick: () => go(nextI) },
      h("span", { text: nextI === i + 1 ? "Next joke" : `Joke ${nextI + 1}` }), svg(ICON.next));
  }

  const score = (R) => {
    const t = { c: 0, p: 0, g: 0, s: 0 };
    R.loops.forEach((L) => { const s = stateOf(L); if (s === "skip") t.s++; else if (s) { t.g++; if (s === "CORRECT") t.c++; if (s === "PARTIAL") t.p++; } });
    return t;
  };

  /* ---------------------------------------------------------------- the scorebug row: six jokes + Correct */
  function bug(R, go) {
    const cells = h("div", { class: "rva-cells" });
    const sc = h("div", { class: "rva-score", "aria-hidden": "true" });
    const sr = h("p", { class: "hp-sr", "aria-live": "polite" });
    const render = () => {
      const n = R.loops.length, cur = R.state.index;
      JB.swap(cells, () => R.loops.map((L, i) => {
        const s = stateOf(L), on = i === cur;
        return h("button", { type: "button", id: `rva-c-${L.state.itemId}`, class: `rva-cell${on ? " is-current" : ""}${s ? " is-played" : ""}`,
          "aria-current": on ? "step" : null, "aria-label": `Joke ${i + 1} of ${n}, ${name(L.state.itemId)}: ${s ? WORD[s] : "not played"}.${on ? " On screen." : ""}`,
          onclick: () => go(i, true) }, h("span", { class: "rva-cell-n", text: String(i + 1) }), sq(s));
      }));
      const t = score(R);
      sc.replaceChildren(h("span", { class: "rva-score-k", text: "Correct" }),
        h("span", { class: "rva-score-v" }, t.g ? [h("strong", { text: String(t.c) }), `/${t.g}`] : "–"),
        h("span", { class: "rva-score-p", text: t.p ? `${t.p} partial` : " " }));
      const msg = t.g ? `Correct so far: ${t.c} of ${t.g}${t.p ? `, plus ${t.p} partial, which doesn't count` : ""}.` : "";
      if (sr.textContent !== msg) sr.textContent = msg;
    };
    const el = h("div", { class: "hp-panel rva-bug" },
      strip("Now you try"),
      h("div", { class: "rva-bugrow", role: "group", "aria-label": `Your ${R.loops.length} jokes. Pick one to play it.` }, cells, sc), sr);
    return { el, render };
  }

  /* ---------------------------------------------------------------- the round */
  function round(rule) {
    const R = JB.createRound(rule.items, { modes: rule.modes || ["normal"] });
    const n = R.loops.length;
    const root = h("section", { class: "jb-round rva hp-wide", id: "jb-round", "aria-label": "Now you try" });
    const slot = h("div", { class: "rva-slot" });
    const panels = [];
    const go = (i, fromBug) => {
      R.go(i);
      requestAnimationFrame(() => {
        const t = root.querySelector(".rva-title");
        if (!fromBug && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
        if (t && !fromBug) t.focus({ preventScroll: true });
      });
    };
    const panel = (i) => {
      if (panels[i]) return panels[i];
      const L = R.loops[i];
      const st = h("div", { class: "jb-stage is-normal hp-call rva-call" });
      // the empty referent slot renders nothing: this round never opens one, but tools/harness.py --play scrolls to it
      const art = h("article", { class: "jb-round-joke rva-joke", "data-item": L.state.itemId, "aria-labelledby": `rva-t-${L.state.itemId}` }, feed(L, i, n), st,
        h("div", { class: "jb-stage is-referent rva-noref", "aria-hidden": "true" }));
      let was = L.state.normal.status, engaged = false;
      const refresh = () => {
        const now = L.state.normal.status, a = document.activeElement;
        engaged = st.contains(a) || (engaged && (!a || a === document.body));
        JB.swap(st, () => stage(L, R, go), `${JB.stageKey(L, "normal")}|${R.state.index}|${R.loops.map((x) => +x.done).join("")}`);
        // the call was just ruled on: keep keyboard and screen-reader users at the ruling, not at the top of the page
        if (engaged && was !== now && ["done", "skipped", "self"].includes(now)) {
          const f = st.querySelector(now === "self" ? ".rva-key" : ".hp-ruling-word, .rva-skipped"); // self: read the key before the buttons
          if (f) { if (!f.matches("button")) f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); }
          engaged = false;
        }
        was = now;
      };
      L.subscribe(() => { refresh(); JB.layoutSidenotes(); });
      art._refresh = refresh;
      return (panels[i] = art);
    };
    const b = bug(R, go);
    R.subscribe((S) => {
      b.render();
      const p = panel(S.index);
      p._refresh(); // what's "next" depends on the other jokes
      JB.swap(slot, () => p, `j${S.index}`);
      JB.layoutSidenotes();
    });
    root.append(b.el, slot);
    return root;
  }

  (window.ROUND_VARIANTS = window.ROUND_VARIANTS || {}).compact = {
    label: "Compact",
    pitch: "One card per joke: the scene and your answer box, and once you answer, the ruling and the key take the box's place, with the ten models folded into one line you can tap open. It gives up the full prompt (one tap away) and the joke-by-joke field table, which only opens when you ask for it.",
    round,
  };
})();

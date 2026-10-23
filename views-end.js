/* Falls short + Hearing the same music views (thread B).
 * Exhibits (Haiku split screen, Qwen pull quote), the four-levels ladder, the humor twin as a scouting
 * "player comp", the unsolved Draymond line, Nick's address, and the colophon. Halftime language
 * throughout; new classes carry the he- prefix. Answers are quoted verbatim from answers.json; the only
 * thing added to a quote is a telestrator underline, and the caption says so. */
(function () {
  "use strict";
  const JB = window.JB, D = JB.data, h = JB.h, V = window.DIRECTION_VIEWS, HP = window.HP;
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ns = "http://www.w3.org/2000/svg";
  const chip = (label, v) => v && h("span", { class: `hp-mini ${HP.vcls(v)}` }, `${label}: ${JB.verdictLabel[v] || v}`);
  const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const month = () => {
    const [yy, mm] = String(D.video.released || "").split("-");
    return mm ? new Date(+yy, +mm - 1, 1).toLocaleString("en-US", { month: "long" }) + " " + yy : "";
  };

  /* ---------------------------------------------------------------- telestrator marks on quotes
   * Same hand-drawn stroke as the prompt cards: one line under each line box of a <mark class="he-mark">,
   * drawn on once when the quote scrolls into view, redrawn without animation on reflow. */
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
  function telestrate(host, seed) {
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "he-ink"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    host.append(svg);
    let drawn = false;
    const draw = (animate) => {
      if (!svg.isConnected) return;
      const cr = host.getBoundingClientRect(); if (!cr.width) return;
      svg.setAttribute("viewBox", `0 0 ${n1(cr.width)} ${n1(cr.height)}`);
      svg.setAttribute("width", n1(cr.width)); svg.setAttribute("height", n1(cr.height));
      svg.replaceChildren();
      const r = rng(seed); let k = 0;
      host.querySelectorAll("mark.he-mark").forEach((m) => [...m.getClientRects()].forEach((b) => {
        if (b.width < 2) return;
        const x = b.left - cr.left, y = b.top - cr.top + b.height + 1.5, pts = [];
        for (let i = 0; i <= 6; i++) pts.push([x - 2 + ((b.width + 4) * i) / 6, y + (r() - 0.5) * 1.8 - (i === 6 ? 2.5 : 0)]);
        const p = document.createElementNS(ns, "path"); p.setAttribute("d", smooth(pts)); p.setAttribute("class", "he-ink-stroke"); svg.append(p);
        if (animate && !reduced() && p.animate) {
          const len = p.getTotalLength();
          p.style.strokeDasharray = `${len} ${len + 20}`;
          const a = p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 340, delay: 150 + k * 260, easing: "cubic-bezier(.35,.6,.25,1)", fill: "both" });
          a.onfinish = () => { p.style.strokeDasharray = ""; a.cancel(); };
        }
        k++;
      }));
      drawn = true;
    };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const first = host.querySelector("mark.he-mark");
      if (!first || !("IntersectionObserver" in window)) return draw(false);
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); draw(true); } }, { threshold: 0.6 });
      io.observe(first);
    }));
    if (window.ResizeObserver) {
      let w = 0, hh = 0;
      new ResizeObserver(() => { const b = host.getBoundingClientRect(); if ((Math.round(b.width) !== w || Math.round(b.height) !== hh) && drawn) draw(false); w = Math.round(b.width); hh = Math.round(b.height); }).observe(host);
    }
    if (document.fonts) document.fonts.ready.then(() => drawn && draw(false));
  }

  /** Render answer text verbatim, wrapping each phrase in a telestrator mark (only if it is really there). */
  const marked = (text, phrases) => {
    let html = JB.inline(text);
    (phrases || []).forEach((ph) => {
      const hl = JB.inline(ph);
      if (html.includes(hl)) html = html.replace(hl, `<mark class="he-mark">${hl}</mark>`);
      else console.warn("[he] mark not found in answer:", ph);
    });
    return html;
  };

  /* ---------------------------------------------------------------- exhibits */
  /** Phrases Nick's paragraph points at: the Dickens catch, then the three cities. */
  const PAIR_MARKS = {
    "hxb-027|Haiku 4.5|normal": ['clearly a play on Dickens\' "A Tale of Two Cities,"'],
    "hxb-027|Haiku 4.5|referent": ["Cleveland (Cavaliers), Miami (Heat), and Los Angeles (Lakers)"],
  };

  const side = (key) => {
    const a = D.answers[key];
    if (!a) return null;
    const it = D.items[a.item_id], mode = a.condition;
    const rp = JB.syntheticPrompt(it.id, "referent").lines[0];
    const given = mode === "normal"
      ? h("div", { class: "he-given" },
        h("p", { class: "he-given-k", text: `At timestamp ${it.timestamp}, this happens:` }),
        h("p", { class: "he-given-t", text: it.evidence }))
      : h("div", { class: "he-given is-referent" },
        h("p", { class: "he-given-k" }, h("span", { class: "he-given-plus", text: "Same prompt, plus" }), rp[0]),
        h("p", { class: "he-given-ref", text: rp.slice(1).join(" ") }));
    const q = h("blockquote", { class: "he-quote" }, h("p", { html: marked(a.answer.replace(/\n+/g, " "), PAIR_MARKS[key]) }));
    telestrate(q, 11 + mode.length);
    return h("section", { class: `he-side is-${mode} ${HP.vcls(a.explanation)}`, "aria-label": `${a.model}, ${JB.modeLabel[mode]}` },
      h("div", { class: "he-side-head" },
        h("p", { class: "he-side-mode" }, h("span", { class: "he-side-k", text: JB.modeLabel[mode] }), h("span", { class: "he-side-sub", text: `${cap(mode)} mode` })),
        h("p", { class: "he-side-word" }, h("span", { class: "hp-sr", text: "Explanation graded " }), JB.verdictLabel[a.explanation])),
      given, q,
      h("p", { class: "he-side-grades" }, mode === "normal" && chip("Referent", a.identification), chip("Explanation", a.explanation)));
  };

  const pair = (rule) => {
    const a0 = D.answers[rule.answers[0]];
    if (!a0) return null;
    return h("figure", { class: "jb-exhibit he-ex is-pair hp-wide" },
      HP.strip("Split screen", `${a0.model} · ${JB.shortName(a0.item_id)}`),
      h("div", { class: "he-pair" }, rule.answers.map(side)),
      h("figcaption", { class: "hp-src he-ex-src", text: `Both answers verbatim, with their real grades. Only the explanation grade counts. Underlines added.` }));
  };

  /** A tight crop of the public item's own focus box (JB.focus), nothing else from the frame. */
  const focusCrop = (id) => {
    const f = JB.focus(id), it = D.items[id];
    if (!f) return null;
    const im = D.images[f[0]];
    if (!im) return null;
    const [x0, y0, x1, y1] = f[1], k = im.w / im.orig_w;
    const bw = (x1 - x0) * k, bh = (y1 - y0) * k;
    return h("span", { class: "he-crop", style: { aspectRatio: `${(x1 - x0)} / ${(y1 - y0)}` } },
      h("img", { src: im.src, width: im.w, height: im.h, alt: `Detail from the still at ${it.timestamp}. ${it.evidence}`, loading: "lazy", decoding: "async",
        style: { width: `${(im.w / bw) * 100}%`, left: `${(-x0 * k / bw) * 100}%`, top: `${(-y0 * k / bh) * 100}%` } }));
  };

  const pull = (rule) => {
    const a = D.answers[rule.answers[0]];
    if (!a) return null;
    const it = D.items[a.item_id];
    const text = a.answer.replace(/\n+/g, " ").trim();
    const cut = text.search(/[.!?]\s/);
    const lead = cut > 0 ? text.slice(0, cut + 1) : text, rest = cut > 0 ? text.slice(cut + 2) : "";
    const hl = rule.highlight ? [rule.highlight] : [];
    const inLead = hl.length && lead.includes(rule.highlight);
    const q = h("blockquote", { class: "he-pull-q" },
      h("p", { class: "he-pull-lead", html: marked(lead, inLead ? hl : []) }),
      rest && h("p", { class: "he-pull-rest", html: marked(rest, inLead ? [] : hl) }));
    telestrate(q, 23);
    return h("figure", { class: "jb-exhibit he-ex is-pull" },
      h("div", { class: "he-pull-ev" }, focusCrop(it.id),
        h("p", { class: "he-pull-ev-t" }, h("span", { class: "he-pull-ev-k", text: `On screen · ${it.timestamp}` }), it.evidence)),
      q,
      h("figcaption", { class: "he-pull-by" },
        h("span", { class: "he-pull-who" }, h("span", { class: "hp-answer-model", text: a.model }), h("span", { class: "he-pull-lab", text: `${a.lab || HP.labOf(a.model)} · ${a.condition} mode` })),
        h("span", { class: "he-pull-chips" }, chip("Referent", a.identification), chip("Explanation", a.explanation)),
        h("span", { class: "he-pull-src", text: "Verbatim · underline added" })));
  };

  /** A quiet margin note (Nick, 23 Oct: the pull quote was too intrusive). Desktop: in the margin beside the
   *  Sandy Cheeks paragraph, like the essay's other notes. Phone: a small inline note. Trimmed only with an ellipsis. */
  function note(rule) {
    const a = D.answers[rule.answers[0]];
    const n = JB.nextSidenote();
    let text = a.answer.replace(/\s+/g, " ").trim();
    if (rule.trimToSentences) {
      const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
      const kept = sentences.slice(0, rule.trimToSentences).join("").trim();
      if (kept.length < text.length) text = `${kept} …`;
    }
    return h("aside", { class: "sidenote jb-exhibit is-note he-qnote", id: `sn-${n}`, "data-n": n, "data-attach": "prev" },
      h("span", { class: "sidenote-n", text: `Note ${n}` }),
      h("div", { class: "sidenote-body" },
        h("p", { class: "he-qnote-who" }, h("strong", { text: a.model }), ` · ${a.condition} mode · ${JB.shortName(a.item_id)}`),
        h("p", { class: "he-qnote-q", html: `“${JB.inline(text)}”` }),
        // QA: the item id stays on one line (it was breaking as "hxb-" / "006" in the narrow margin)
        h("p", { class: "he-qnote-g" }, `Referent: ${JB.verdictLabel[a.identification]} · Explanation: ${JB.verdictLabel[a.explanation]}`)));
  }
  // a margin note needs its marker in the paragraph it annotates; attach once the essay is in the page
  JB.on("ready", () => document.querySelectorAll('aside[data-attach="prev"]').forEach((aside) => {
    const para = aside.previousElementSibling;
    if (!para || para.querySelector(`[aria-controls="${aside.id}"]`)) return;
    const ref = JB.views.snRef(aside.dataset.n);
    ref.addEventListener("click", () => { if (getComputedStyle(aside).position !== "absolute") aside.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
    para.append(ref);
    JB.layoutSidenotes();
  }));

  V.exhibit = (rule) => (rule.kind === "pair" ? pair(rule) : rule.kind === "note" ? note(rule) : pull(rule));

  /* ---------------------------------------------------------------- four levels: a difficulty ladder */
  V.levels = (b) => {
    const n = b.items.length, ran = 2;
    const meter = (lvl, on) => h("span", { class: `he-meter${on ? " is-run" : ""}`, "aria-hidden": "true" },
      Array.from({ length: n }, (_, i) => h("span", { class: `he-meter-bar${i < lvl ? " is-on" : ""}`, style: { height: `${((i + 1) / n) * 100}%` } })));
    return h("figure", { class: "jb-levels he-levels" },
      h("div", { class: "he-levels-key", "aria-hidden": "true" },
        h("span", { class: "he-key-item is-run" }, h("span", { class: "he-key-sw" }), "Run in this study"),
        h("span", { class: "he-key-item" }, h("span", { class: "he-key-sw" }), "Not run"),
        h("span", { class: "he-key-axis", text: "Easier to harder" })),
      h("ol", { class: "he-ladder" }, b.items.map((x, i) => {
        const at = x.indexOf(":");
        const body = at > 0
          ? [h("span", { class: "he-rung-name", html: JB.inline(x.slice(0, at + 1)) }), " ", h("span", { html: JB.inline(x.slice(at + 1)) })]
          : h("span", { html: JB.inline(x) });
        return h("li", { class: `he-rung ${i < ran ? "is-run" : "is-not"}` },
          meter(i + 1, i < ran),
          h("p", { class: "he-rung-text" }, body, h("span", { class: "hp-sr", text: i < ran ? " (run in this study)" : " (not run)" })));
      })));
  };

  /* ---------------------------------------------------------------- humor twin: a scouting player comp */
  const groupCalls = (arr) => {
    const by = new Map();
    arr.forEach((c) => { if (!by.has(c.itemId)) by.set(c.itemId, { name: c.name, modes: [] }); by.get(c.itemId).modes.push(c.mode); });
    return [...by.values()].map((g) => ({ name: g.name, modes: ["normal", "referent"].filter((m) => g.modes.includes(m)) }));
  };
  const callList = (title, arr, cls) => h("div", { class: `he-comp-list ${cls}` },
    h("p", { class: "he-comp-list-h" }, h("span", { class: "he-comp-sw", "aria-hidden": "true" }), title, h("span", { class: "he-comp-list-n", text: `${arr.length} ${arr.length === 1 ? "call" : "calls"}` })),
    arr.length
      ? h("ul", null, groupCalls(arr).map((g) => h("li", { class: "he-call" }, h("span", { class: "he-call-name", text: g.name }), h("span", { class: "he-call-mode", text: g.modes.map((m) => JB.modeLabel[m]).join(" + ") }))))
      : h("p", { class: "he-comp-none", text: "None yet." }));

  V.twin = () => {
    const box = h("figure", { class: "jb-twin he-twin hp-panel hp-wide", id: "jb-twin" });
    let lastName = null;
    const render = () => {
      const t = JB.twin();
      if (!t.ready) {
        lastName = null;
        const have = t.cells;
        box.replaceChildren(
          HP.strip("Player comp", "Your humor twin"),
          h("div", { class: "he-twin-body" },
            h("p", { class: "he-comp-k", text: "Closest comp" }),
            h("p", { class: "he-comp-name is-empty", text: have ? "Need more film" : "No film yet" }),
            h("p", { class: "he-comp-say", text: "Play a few jokes and this finds the model whose rights and wrongs line up with yours." }),
            h("div", { class: "he-need" },
              h("span", { class: "he-need-pips", "aria-hidden": "true" }, Array.from({ length: t.need }, (_, i) => h("span", { class: `he-need-pip${i < have ? " is-on" : ""}` }))),
              h("span", { class: "he-need-t", text: `${Math.min(have, t.need)} of ${t.need} graded calls` })),
            h("a", { class: "hp-btn he-twin-go", href: "#jb-round" }, "Back to the jokes")));
        return;
      }
      const w = t.twin, full = D.scores.models.find((m) => m.model === w.model) || {};
      const next = t.ranked.slice(1, 3), tied = next.some((r) => r.agree === w.agree);
      const name = h("p", { class: "he-comp-name", text: w.model });
      if (lastName && lastName !== w.model) HP.enter(name);
      lastName = w.model;
      const stat = (n, label) => h("div", { class: "hp-stat he-stat" }, h("span", { class: "hp-stat-n", text: n }), h("span", { class: "hp-stat-l", text: label }));
      box.replaceChildren(
        HP.strip("Player comp", `Your humor twin · ${t.cells} calls`),
        h("div", { class: "he-twin-body" },
          h("div", { class: "he-comp-head" },
            h("p", { class: "he-comp-k", text: "Closest comp" }), name,
            h("p", { class: "he-comp-lab", text: HP.labOf(w.model) })),
          h("div", { class: "he-stats" }, stat(`${w.agree}/${w.of}`, "Calls matched"), stat(String(w.youOnly.length), "Only you got"), stat(String(w.itOnly.length), "Only it got")),
          h("div", { class: "he-comp-lists" }, callList("You both got", w.bothGot, "is-got"), callList("You both missed", w.bothMissed, "is-missed")),
          next.length && h("p", { class: "he-comp-next" }, h("span", { class: "he-comp-next-k", text: "Next closest" }),
            next.map((r) => h("span", { class: "he-comp-next-e" }, h("span", { class: "he-comp-next-m", text: r.model }), h("span", { class: "he-comp-next-n", text: `${r.agree} of ${r.of}${r.agree === w.agree ? ", tied" : ""}` })))),
          full.n && h("p", { class: "hp-src he-comp-career", text: `For context, ${w.model} on all ${full.n} scored jokes: ${full.normal_correct} cold (${Math.round(full.normal_pct)}%), ${full.referent_correct} with the referent (${Math.round(full.referent_pct)}%). Your comp uses only the ${t.cells} calls you made (answers.json).` }),
          h("p", { class: "hp-src he-comp-fine", text: `${t.cells} calls make a horoscope, not a statistic. Matched means you were both right, or both not, on the same call; only Correct counts as right.${tied ? " Ties go to the model whose total on these calls is closest to yours." : ""}` })));
    };
    JB.on("result", render);
    render();
    return box;
  };

  /* ---------------------------------------------------------------- Draymond: the open case */
  JB.draymondGuess = JB.draymondGuess || "";
  const PLAUS = { PLAUSIBLE: "Plausible", MAYBE: "Maybe", UNLIKELY: "Unlikely" };
  const DRAY_ERR = {
    not_granted: "No problem, Claude stays out of it.",
    rate_limited: "Claude is busy right now. Ask again in a minute, or send your guess straight to Nick.",
    invalid_json: "Claude's reply came back garbled. Ask again, or send your guess straight to Nick.",
    session_expired: "Your Claude session expired. Sign in again, or send your guess straight to Nick.",
    default: "Couldn't reach Claude. Send your guess straight to Nick instead.",
  };
  const PERMANENT = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed", "unavailable"];

  V.draymond = (rule) => {
    const it = D.items[rule.item], key = (D.itemFrames[it.id] || [])[0];
    const id = "jb-draymond";
    const line = (it.evidence.match(/["“](.+)["”]/) || [])[1] || it.evidence;
    const speaker = it.evidence.includes(":") ? it.evidence.split(":")[0] : "";
    let mode = null, ctl = null, busy = false;
    const fig = key && V.figure({ file: "" }, key, { wide: true, badge: h("span", { class: "hp-badge", "aria-hidden": "true" }, h("span", { class: "hp-badge-tag", text: "Unsolved" }), it.timestamp) });
    const ta = h("textarea", { id, class: "jb-answer", rows: 3, maxlength: 1200, placeholder: "A show, a movie, a meme, an interview…", autocomplete: "off", autocapitalize: "sentences", spellcheck: "true", enterkeyhint: "enter" });
    ta.value = JB.draymondGuess;
    const warn = h("p", { class: "hp-warn", "aria-live": "polite" });
    const btn = h("button", { class: "hp-btn jb-submit", type: "button", "data-submit": "" });
    const fine = h("p", { class: "hp-fine" });
    const out = h("div", { class: "he-dray-out", "aria-live": "polite" });
    const toContact = () => h("a", { href: "#jb-contact", text: "Nick's address" });
    const sync = () => {
      const live = mode !== "self";
      btn.textContent = live ? "Ask Claude if it fits" : "Put it in my email to Nick";
      fine.textContent = live
        ? "Claude will say how plausible your guess is. There's no answer key, so it's a read, not a grade."
        : "Nobody has the answer key, so there's nothing on this page to check it against. Nick is the judge.";
    };
    const selfDone = (note) => out.replaceChildren(HP.enter(h("div", { class: "he-dray-self" },
      note && h("p", { class: "hp-notice", text: note }),
      h("p", { class: "he-dray-self-t" }, "Your guess is now in the email link with ", toContact(), ", just below."),
      h("p", { class: "hp-src", text: "Nothing has been sent, and nothing is saved." }))));
    const ask = async () => {
      if (busy) return;
      const g = ta.value.trim();
      if (!g) { warn.textContent = "Write a guess first, even a wild one."; ta.focus(); return; }
      JB.draymondGuess = g; JB.emit("draymond", g);
      mode = await JB.grader.mode(); sync();
      if (mode !== "live") return selfDone();
      busy = true; btn.disabled = true; ta.readOnly = true;
      out.replaceChildren(h("div", { class: "he-dray-wait", role: "status" },
        h("div", { class: "hp-review" }, h("span", { class: "hp-review-bar", "aria-hidden": "true" }), h("p", { class: "hp-review-t", text: "Asking Claude…" })),
        h("button", { class: "hp-link", type: "button", text: "Stop", onclick: () => ctl && ctl.abort() })));
      try {
        ctl = new AbortController();
        const r = await JB.grader.plausible(g, ctl.signal);
        out.replaceChildren(HP.enter(h("div", { class: `hp-ruling he-plaus is-${r.verdict.toLowerCase()}` },
          h("div", { class: "hp-ruling-bar" }, h("p", { class: "hp-ruling-word", text: PLAUS[r.verdict] }), h("p", { class: "hp-ruling-counts", text: "Claude's read · no answer key" })),
          h("p", { class: "hp-ruling-fb", text: r.why }),
          h("p", { class: "hp-src" }, "Not a grade: nobody knows the answer. If you're sure, ", h("a", { href: "#jb-contact", text: "tell Nick" }), ".")), "hp-slam"));
      } catch (e) {
        const code = (e && e.code) || "default";
        if (code === "cancelled") out.replaceChildren();
        else if (PERMANENT.includes(code)) { mode = "self"; sync(); selfDone(DRAY_ERR[code] || ""); }
        else out.replaceChildren(h("p", { class: "hp-notice", text: DRAY_ERR[code] || DRAY_ERR.default }));
      } finally { busy = false; btn.disabled = false; ta.readOnly = false; }
    };
    btn.addEventListener("click", ask);
    ta.addEventListener("input", () => {
      JB.draymondGuess = ta.value; JB.emit("draymond", ta.value); JB.autosize(ta);
      if (ta.value.trim()) warn.textContent = "";
      out.classList.toggle("is-stale", !!out.firstChild);
    });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(); } });
    requestAnimationFrame(() => JB.autosize(ta));
    JB.grader.mode().then((m) => { mode = m; sync(); });
    JB.on("grader", (g) => { mode = g.mode; sync(); });
    sync();
    // a fresh result clears the stale state
    new MutationObserver(() => out.classList.remove("is-stale")).observe(out, { childList: true });
    return h("div", { class: "jb-draymond he-dray" },
      fig,
      h("div", { class: "hp-wide" }, h("div", { class: "hp-call he-dray-call" },
        HP.strip("Open case", `${it.id} · ${it.timestamp} · ${JB.statusLabel[it.gold_status] || ""} · no answer key`),
        h("blockquote", { class: "he-dray-line" }, speaker && h("span", { class: "he-dray-who", text: speaker }), h("p", { text: `“${line}”` })),
        h("a", { class: "he-dray-hear", href: JB.ytUrl(it.t_sec), target: "_blank", rel: "noopener" }, `Hear the inflection at ${it.timestamp}`, HP.svg(HP.ICON.out)),
        h("label", { for: id, class: "hp-call-q", text: "What do you think it references?" }),
        ta, warn,
        h("div", { class: "hp-actions" }, btn),
        fine, out)));
  };

  /* ---------------------------------------------------------------- contact */
  V.contact = (rule) => {
    const addr = rule.email;
    const addrEl = h("span", { class: "he-contact-addr", text: addr });
    const status = h("span", { class: "he-contact-status", role: "status", "aria-live": "polite" });
    const mail = h("a", { class: "hp-btn hp-btn-ghost he-contact-mail" }, "Open an email", HP.svg(HP.ICON.out));
    const guess = h("p", { class: "he-contact-guess" });
    const upd = () => {
      const g = String(JB.draymondGuess || "").trim();
      const body = g ? `&body=${encodeURIComponent(`My guess for the Draymond line at ${D.items["hxb-035"].timestamp}:\n\n${g}`)}` : "";
      mail.href = `mailto:${addr}?subject=${encodeURIComponent("Sorry LeBron — they're making me!")}${body}`;
      guess.hidden = !g;
      guess.replaceChildren(...(g ? ["Your Draymond guess goes in the email: ", h("q", { text: g.length > 140 ? g.slice(0, 139).trimEnd() + "…" : g })] : []));
    };
    JB.on("draymond", upd); upd();
    const copy = h("button", { type: "button", class: "hp-btn he-contact-copy", text: "Copy address", onclick: async () => {
      try { await navigator.clipboard.writeText(addr); status.textContent = "Copied."; }
      catch (_) {
        const r = document.createRange(); r.selectNodeContents(addrEl);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        status.textContent = "Selected. Copy it from here.";
      }
    } });
    return h("div", { class: "jb-contact he-contact", id: "jb-contact" },
      h("div", { class: "hp-l3 is-stacked he-contact-l3" },
        h("span", { class: "hp-l3-tag", text: "Reach out" }),
        h("div", { class: "hp-l3-main" },
          addrEl,
          h("div", { class: "he-contact-actions" }, copy, mail, status),
          guess,
          h("p", { class: "hp-src he-contact-fine", text: "The email button opens your mail app if this page is allowed to. If nothing happens, copy the address. Nothing reaches Nick until you send it yourself." }))));
  };

  /* colophon removed at Nick's request (23 Oct) */
})();

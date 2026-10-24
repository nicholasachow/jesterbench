# Surely You're Joking, Mr. Claude

An interactive essay about JesterBench, a small humor benchmark built from one Bleacher Report "Hero x Ball" episode. The reader takes the same test ten AI models took. Live at https://nicholasachow.com/jesterbench/.

**This repo is build output.** Don't edit these files by hand: they're regenerated on every build, and hand edits get overwritten. The sources live on Nick's Mac, described below.

## How it fits together

| What | Where | Notes |
|---|---|---|
| The prose | `Surely You're Joking, Mr. Claude.md` in Nick's Obsidian vault | The only prose source. Edit it there. |
| The build kit | `~/Desktop/projects_n/jesterbench-interactive/` | Not a git repo. Holds the studio (renderer, interactives, data builder) and the scripts below. |
| Eval data | `~/Desktop/projects_n/humor_eval_v2/` | Results and gold answers. Only the 17 public items ever leave it. |
| This site | `~/Desktop/projects_n/jesterbench/` (this repo) | GitHub Pages, deployed by `.github/workflows/deploy.yml` on push to `main`. |
| Private twin | A Claude artifact | Same page, with live Claude grading (the `sample` capability). Republished by Claude on request. |

## Making a change

1. Edit the vault note (prose) or `studio/directions/essay/*.js` (text inside the interactives).
2. Run `~/Desktop/projects_n/jesterbench-interactive/build_pages.sh --serve`. It pulls in the vault note, runs the leak check, rebuilds the data, assembles the page, writes it into this repo, and serves it at http://localhost:8765/.
3. Check it locally, then `git commit` and `git push` here. Pages redeploys in about a minute.
4. Optionally, ask Claude to republish the artifact from `studio/dist/essay/` so the private version keeps parity.

## Things that break quietly

- **Anchors.** Each interactive is placed by matching a sentence in the essay (`JB.PLACEMENTS` in `studio/shared/engine.js`). If you reword an anchor sentence, that interactive disappears and the plain prose shows instead. `python3 tools/prose_check.py essay` (run from `studio/`) names the anchor that broke. Matching is case-insensitive where that matters.
- **Footnotes.** Standard markdown `[^1]` refs with a `[^1]: text` definition become numbered margin notes. Obsidian heading links (`[[#Heading|text]]`) become in-page jumps.
- **Images.** Stills come from `studio/img/` (WebP, made by `tools/images.py`) and are listed in `studio/tools/image-meta.json`. A still that isn't in that list won't show, even if the file exists.

## Rules the page keeps

- **Held-out jokes stay private.** 62 of the 79 annotated moments are a held-out test set. The build only ever sees the 17 public items, and `build_sources.py` fails the build if a held-out ID or description leaks in. Frames are shown, but only public jokes are explained or marked.
- **No internal labels in the UI.** No joke IDs (`hxb-…`), no source file names, no grading-status labels.
- **Keep the frame's reference count vague** ("over 15"), to match the essay.
- **Model answers are verbatim**, with their real grades. Scores come only from the eval data.
- **The Pages build differs from the artifact in three ways.** It has no live grading (readers grade themselves). Its `data.js` is scrambled and stripped of the grading prompts, which deters casual peeking at the answer key, but the decoder ships with the page. And `preview.html` becomes `index.html`.

## Page features worth knowing

- **Light/dark toggle** at the top. It overrides the system setting and is remembered per browser (`localStorage` key `jb-theme`).
- **Favicon** is borrowed from nicholasachow.com (`favicon.svg`).
- **Video** is a still that links out to YouTube, never an embed (Nick's preference).

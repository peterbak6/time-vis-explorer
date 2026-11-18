# Time Vis Explorer

[![CI](https://github.com/peterbak6/time-vis-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/peterbak6/time-vis-explorer/actions/workflows/ci.yml)

An interactive classroom tool for exploring how visual choices change what we see in temporal data. Students explore a view, formulate a question, discuss their choices, and return to refine the visualization. Task types stay in the classroom discussion.

Built with **Vite, React, TypeScript, and D3**. React manages the controls and state; D3 renders the SVG charts. The app runs entirely in the browser with bundled datasets.

## Explore

- Switch datasets and choose a measurement above the field selections.
- Try **Timeline**, **Calendar**, or **Cycle**, with overlays, small multiples, or stacked areas where compatible.
- Change resolution, summary, normalization, scales, marks, and smoothing.
- Choose **Missing data → Gaps, Zeros, or Dotted connection** and adjust mark opacity and size.
- Click a series to highlight it, hover for details, and click empty chart space to clear the selection.
- Scroll or pinch over timelines to zoom, drag to pan, and double-click to reset. Zooming preserves resolution and aggregation.

Unavailable options explain why they are disabled and how to enable them. Date and year ranges stay within dataset bounds. Keyboard focus exposes values; Enter or Space toggles highlighting.

## Datasets

| Dataset | Included data | Measurements |
| --- | --- | --- |
| Electricity | 12 Building Data Genome 2 buildings, hourly readings, 2016–2017 | Energy summaries |
| News timelines | 1,091 curated updates across 14 stories | Individual updates or update counts |
| Notable lifespans | 120 people in four fields | Lifespans, births, deaths, alive counts, mean lifespan |
| Bike trips | 12,565 trips from eight origins | Trip intervals, starts, mean duration |

See [electricity data notes](public/data/README.md) and [additional dataset notes](public/data/ADDITIONAL-DATA.md) for sources, selection, temporal precision, and licensing. The bundled subsets are ready to use; data preparation is not part of installation or deployment.

## Run locally

Use **Node 24.12.0**, pinned in [.node-version](.node-version).

```sh
npm ci
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Check temporal transformations, gaps, data integrity, and zoom calculations |
| `npm run build` | Check TypeScript and produce the static site in `dist/` |
| `npm run preview` | Serve the production build locally |

Commit `package-lock.json` when changing dependencies. `npm ci` uses it for reproducible installs and rejects an inconsistent lockfile.

## Temporal conventions

**Cycles:** Resolution determines hours around a day, weekdays around a week, or months around a year. **Cycle summary → None** retains every dated bin and connects observations chronologically around the polar axes. Radius encodes value; there is no outward offset. Mean, Total, Min, and Max explicitly combine matching positions across cycles. Smoothing runs chronologically before an optional cycle summary.

**Missing data:** Gaps is the default. Record bins with no entries have no dots and break lines. Zeros displays absent values at zero; dotted connections bridge interior gaps between known values without adding observed points. These are display choices after the statistical transformations, so underlying counts and summary calculations remain unchanged. An empty event bin and an unknown measurement have different meanings even though the control groups their display options.

**Precision:** Lifespans have year precision and approximate durations; no month or day is invented. Bike trip endpoints retain second precision. Unsupported views remain disabled rather than implying precision absent from the source.

## CI

[GitHub Actions](.github/workflows/ci.yml) runs on pushes to `main`, pull requests targeting `main`, and manual runs. It uses `.node-version`, installs with `npm ci`, runs all tests, and checks types and the production build. No secrets are required.

Cloudflare Pages deploys separately through its Git integration. The CI workflow reports checks; it does not gate Cloudflare's automatic deployments. To check changes before merging, require **Test and build** in the repository's branch protection or ruleset.

## Cloudflare Pages

Connect `peterbak6/time-vis-explorer` using **Workers & Pages → Pages → Git integration** with these settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root (leave blank) |
| Environment variables | None required |

[wrangler.jsonc](wrangler.jsonc) specifies the Pages output directory. `.node-version` selects the tested Node version. All datasets and attribution files are copied from `public/` into the build. No backend or runtime bindings are needed.

Pushes to `main` trigger Cloudflare's production deployment. Cloudflare supplies the actual `pages.dev` URL; preview deployments depend on the project's branch settings. Use the Pages flow; no Worker deploy command is needed.

If installation fails with a lockfile mismatch, repair the lockfile with the npm version reported in the build log, verify `npm ci`, and commit the corrected `package-lock.json`. Retry the new commit rather than the failed older one.

References: [Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Node version selection](https://developers.cloudflare.com/pages/configuration/build-image/).

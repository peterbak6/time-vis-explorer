# Time Vis Explorer

A minimal classroom explorer for a fixed electricity dataset. Built with Vite, React, TypeScript and D3. React owns controls and application state; D3 owns the SVG chart contents. No backend, accounts or external runtime data requests.

## Run

Requires a current Node release supported by Vite (Node 22.12+ or 24 recommended).

```
npm install
npm run dev
```

`npm run build` checks TypeScript and creates a static `dist/`. `npm run preview` serves that build. `npm test` checks the transformation pipeline.

## Data and views

Twelve real, pseudonymized Fox-site buildings from Building Data Genome 2, hourly interval energy in kWh for 2016–2017. See public/data/README.md for provenance, preprocessing, temporal conventions and attribution.

Controls select data, aggregate, normalize, smooth, arrange and draw through three D3 renderers: timeline, calendar, and polar cyclic profile. Polar views place time clockwise from twelve o’clock and values on the radial scale; both overlays and small multiples support points, lines, and radial steps. Inapplicable controls are disabled while preferences are retained for returning to a compatible view. Click a series to highlight it; hover for values; click empty space to clear. Keyboard focus exposes values and Enter/Space toggles highlighting.

No task prompts, saved views, comparison panels, sharing or export features.

## Dependency check

The production dependency audit is clean. The development toolchain currently inherits a picomatch ReDoS advisory (GHSA-fc5q-39xc-vjpf); the registry currently provides no patched picomatch release. The dev server binds to loopback only. Recheck when updating dependencies; this dependency is not included in the browser production bundle.

## Additional datasets

The header selector switches between electricity, curated news timelines (1,091 updates), notable lifespans (120 people), and bike trips (12,565 rides). Record datasets expose a measure selector: original points/intervals or derived count/duration views. Birth/death precision is a year; no synthetic day/month data are supplied. Bike durations retain second-precision endpoints. See public/data/ADDITIONAL-DATA.md for provenance, selection rules, temporal conventions and licensing. `scripts/prepare_additional_data.py` reproduces these subsets from the cited local source downloads.

## Timeline navigation

Scroll or pinch over a timeline to zoom its time axis, drag to pan, and double-click to reset. Navigation changes the horizontal viewing scale only: original samples/records, aggregation, resolution, values and vertical scales remain unchanged. Viewport persists through highlighting and resets when the selected time domain/data or chart width changes. Both numeric charts (including stacked areas and small multiples) and individual event/interval timelines support this interaction.

Record datasets open with numeric measures so their view choices are available immediately. Individual records remain accessible in Measure; overlay and separate lanes are available there, and choosing a count-based layout or bin updates Measure visibly. Genuine precision restrictions remain: year-only lifespan records cannot support calendar or seasonal polar layouts.

## Chronological cycles

In Cycle, **Cycle summary → None** retains every chronological bin at the selected resolution. Each hour-of-day, weekday or month-of-year is placed at its corresponding angle and successive cycles continue around the same polar axes. Lines connect observations in date order; the final observation is not closed back to the first. Missing values break the path. Tooltips retain the original date/bin interval. No outward radial offset is added: radius continues to encode value. Electricity’s **Within bin** control still determines the hourly/daily/monthly statistic; record datasets retain their selected count or duration measure. Moving averages are applied in chronological order before any optional across-cycle summary. Mean, Total, Min and Max explicitly fold equivalent positions across cycles.

## Empty periods versus missing values

Record count views default to **Empty periods → Gaps**: bins with no entries do not draw points, and lines break at those bins. **Zeros** restores zero marks. This is a display choice after aggregation, normalization, chronological smoothing and any cycle summary; underlying zero counts and calculated statistics are unchanged. Dates and raw counts are retained. Nonempty bins whose transformed value happens to be zero remain visible. Unknown values such as mean duration with no trips are never replaced with zero. Calendar gaps for empty periods are blank, while genuinely missing cells retain their missing-data representation.

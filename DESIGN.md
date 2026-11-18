# Time Vis Explorer

## Purpose
A classroom exploration tool: students alter a view of one fixed electricity dataset, choose a view they like, formulate a question, discuss it, and return to revise the view and question. Task types belong in class discussion, never in the interface.

## Interface
One page. A large chart dominates the screen. A narrow left panel contains schematic layout and arrangement cards, followed by compact controls. Building selection and a date range sit above the chart. The visual language follows the course schematics: white, charcoal, warm orange for active controls, muted contextual marks.

The mockup in design/interface.svg is editable. design/interface.png is its preview. Data in the mockup are illustrative, not real measurements. This is a design artifact, not a functioning application.

## Controls
- Buildings and date range.
- Layout: timeline, calendar, cyclic profile.
- Arrangement: overlay, small multiples, stacked.
- Resolution: hourly, daily, weekly, monthly.
- Summary: mean, total, minimum, maximum, subject to measurement semantics.
- Values: absolute, indexed to 100, standardized.
- Scale: shared, independent.
- Marks: points, lines, steps.
- Smoothing: off or moving average; reveal its window only when enabled.

Preserve the user's chosen settings when meaningful. Controls that do not apply to a view should be visibly disabled, rather than silently changing the chart or producing an invalid encoding. Stacking requires compatible additive series and should not combine indexed or standardized values. Independent scales apply to small multiples. Cyclic views need a period selector visible only in that mode. Calendar views use a daily summary and a color legend.

## Direct chart interaction
Click a series to highlight it and mute the others. Click it again or click empty space to clear selection. Hover displays the building, timestamp or full bin interval, and displayed value with correct units. Hover does not change the clicked selection. Use the equivalent category/highlight and tooltip behavior for bands, calendar cells, points, and bars. Controls must be keyboard operable; focused marks expose tooltip information.

## Deliberately absent
No task selector, challenges, question field, saved views, comparison panels, sharing, export, guided tour, reset or undo buttons. No extra dashboards or explanatory side panels.

## Data requirements before implementation
Choose an openly usable fixed dataset with multiple buildings, at least a year of timestamps, and hourly or finer resolution. Confirm time zone, missingness, units, and whether readings measure interval energy or instantaneous/average power. Never interpret missing as zero. Hourly energy can be summed to daily energy; power should be integrated over elapsed time to obtain energy, not simply labelled as a sum in kW. Normalization must state its reference and handle zero baselines. Make aggregation, smoothing, and unit changes visible in the chart title, axes, and tooltips. Initial display should show a readable subset, while the full dataset remains available through dates and buildings.

## Implementation
The approved design is implemented locally with Vite, React, TypeScript and D3. React owns controls; D3 owns SVG contents. Three renderers share one transformation pipeline. No hosting or deployment has been performed.

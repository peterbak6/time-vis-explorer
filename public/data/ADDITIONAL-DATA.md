# Additional built-in datasets

All three datasets are fixed, bundled subsets; they require no external request when a student selects them. The application supports noncommercial classroom exploration. Source attribution and temporal precision must remain attached to redistributed versions.

## News timelines

Source: https://huggingface.co/datasets/adithya7/background-summaries
Original archive: https://github.com/amazon-science/background-summaries/blob/main/data/events.tar.gz
Pratapa, Small & Dreyer (2023), Background Summarization of Event Timelines. Dataset license: CC BY-NC 4.0. See https://creativecommons.org/licenses/by-nc/4.0/ and the source dataset card.

1,091 updates across 14 stories (2005–2014). One annotation stream per story is used (the first alphabetically, annotator1), preventing three independent rewrites of the same timeline from being counted three times. Exact duplicate date/text pairs are removed. Each point is a curated timeline update at day precision; it is not necessarily a distinct real-world event. Body text is source annotation, not an assertion independently verified by this application. Tooltips show an excerpt. We do not infer durations from gaps between updates. Zero counts mean no entries in this collection, not that nothing happened in the world.

## Notable lifespans

Source application: https://medialab.github.io/bhht-datascape/#series
Source file: https://medialab.github.io/bhht-datascape/data/top.csv.gz
Research: https://doi.org/10.1038/s41597-022-01369-4
Credit: Laouenan, Bhargava, Eyméoud, Gergaud, Plique and Wasmer. Data licensed under CC BY-SA according to the source publication; retain its attribution/share-alike conditions. This app uses the datascape’s public top file, not the full database and not a fresh download of the updated cross-verified release.

120 deceased people: 30 top-ranked qualifying records in each of Culture, Discovery/Science, Leadership, and Sports/Games. Birth years 1750–1930, positive reported lifespans no greater than 120 years, known death year no later than 2022. Original Wikidata IDs and source labels retained. No death date is manufactured for a living person or missing record. Source dates may include estimates; this file does not supply exact-date certainty flags. Duration is reported death year minus birth year, explicitly approximate. Jan 1 is used internally to position reported years on the axis; it does not assert an exact birthday/death date. The selected records are not a representative population or a basis for estimating life expectancy.

Lifespan bars retain original endpoints while clipping drawing to the selected range. Birth/death counts use reported years. Alive counts evaluate half-open [birth year, death year) intervals at each bin start; this is an approximation at year precision. Mean lifespan groups people by birth bin, not by death date or amount of life inside the displayed range. Year, decade and century bins are available. Calendar and polar layouts are disabled because month/day information is absent.

## Bike trips

Source: https://citibikenyc.com/system-data
File: https://s3.amazonaws.com/tripdata/JC-202401-citibike-tripdata.csv.zip
Terms: https://citibikenyc.com/data-sharing-policy
Attribution: Citi Bike System Data. This noncommercial teaching visualization incorporates source material under the NYCBS Data Use Policy. It is not a standalone redistribution service and is not affiliated with or endorsed by the operator or sponsor. No ride export is provided. Review the source terms before reuse outside this classroom application.

12,565 January 2024 Jersey City/Hoboken trips from the eight busiest origin stations in the monthly file; one record with a non-positive/invalid duration is excluded. Long positive durations are retained and may reflect anomalies, not normal cycling. Source file contains 50,661 rides. Start/end timestamps retain second precision and local New York clock labels. January avoids daylight-saving transitions. Start station defines the group; endpoints describe recorded docking activity, not a route. IDs are public ride IDs, not rider identities. Geographic coordinates and demographic fields are not bundled. Data covers January starts; trips may end after the selected date boundary. Duration is (end - start) in minutes. Mean duration is grouped by trip-start bin. Counts describe this selected subset, not total system ridership.

## Numeric views and interactions

Individual updates use point marks; lifespans and trips use interval bars in packed group lanes. Numeric measures reuse the timeline, calendar, polar, normalization and smoothing renderers. Interval duration means are not additive and cannot be stacked. Polar counts with Cycle summary None retain chronological bins. Explicit cycle summaries combine matching positions across dates; smoothing is applied chronologically before folding. Counts preserve zero bins; mean durations use missing values where no interval starts. No extra durations are inferred. Normalization and smoothing operate after aggregation, as in the electricity dataset. A zero first displayed bin cannot be indexed to 100. Hover on records shows names, original dates, duration where present, and source text; click highlights the record’s group.

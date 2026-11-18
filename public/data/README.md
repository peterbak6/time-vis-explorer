# Built-in electricity data

Source: Building Data Genome Project 2, Miller et al. (2020), https://doi.org/10.1038/s41597-020-00712-x
Repository: https://github.com/buds-lab/building-data-genome-project-2

Twelve electricity meters from the Fox site, 1 January 2016 through 31 December 2017 (17,544 hourly bins per meter). Values are interval energy in kWh, not instantaneous kW. Source building identifiers are pseudonyms. Labels use the original pseudonymous name and documented primary use; they do not identify real facilities.

Prepared from data/meters/cleaned/electricity_cleaned.csv and data/metadata/metadata.csv. A reproducible selection script is provided in scripts/prepare_data.py. It retains a varied set of primary uses with at least 97% numeric coverage, rounds values to three decimal places, and preserves source missing values as null. No interpolation or zero filling is performed by this app. The upstream cleaned series have already undergone the source project's filtering.

Source timestamps are a site-local clock (US/Mountain). For consistent display, JavaScript UTC calendar arithmetic is used on these local-clock labels; dates are not silently converted into the visitor's time zone. The upstream file presents a regular hourly grid, so this is not a reconstruction of timezone-aware elapsed time at DST transitions.

Mean/minimum/maximum summarize hourly kWh. Total sums interval energy into kWh per bin and is missing if any selected hourly reading within the bin is missing. Partially selected boundary weeks/months summarize only the selected dates. Tooltips state reading coverage. Cycle summary None retains dated resolution bins. Choosing Cycle summary Total combines equivalent cycle positions across the selected dates; Within bin Total still sums interval energy. Indexing uses each building's first valid displayed bin, and is unavailable for that building if its reference is zero. Z-scores use population standard deviation over displayed, aggregated values. A centered moving average is applied after normalization, uses available neighboring bins, and retains original missing centers. At window edges it uses a shorter window.

Data redistribution: retain attribution and the upstream Attribution-ShareAlike notice in LICENSE-data.txt. See the original repository for authoritative licensing and documentation. This notice concerns the dataset; application code is separate.

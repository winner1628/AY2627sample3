# AquaPulse AI — Smart City Water Main Predictive Maintenance & Risk Management Platform

A single-page, trilingual (繁體中文 / 简体中文 / English) interactive dashboard for predictive
maintenance and risk management of Hong Kong's water supply network, covering **all 18 districts**
of Hong Kong with real government / public data.

Live demo: open `aquapulse-dashboard/index.html` in any modern browser (internet connection required
to load the ECharts 5.6.0 CDN). No server or build step is needed for the demo.

## Features

- **18-district Hong Kong view** — district boundary, coastline, water bodies and river layers from
  OpenStreetMap; density-grid heatmap for the whole territory; click any district chip to zoom in.
- **Real road network** — 29,388 road centreline segments from the Transport Department's open
  CENTERLINE dataset (data.gov.hk), every named segment preserved.
- **Risk scoring** — per-segment Priority Risk Index (PRI) combining pipe-age proxy, road loading,
  network spread and proximity to buildings; calibrated so ~14% of segments fall into the high-risk
  band (PRI > 75).
- **Buildings** — 298,703 building footprints from OpenStreetMap; per-district outline rendering on demand.
- **Water pressure sensor simulation** — 122 simulated sensor nodes across the 18 districts with an
  animated pressure readout (OK / warning / alarm states).
- **25 real burst incidents (2021–2026)** reported by Hong Kong media, geolocated to streets.
- **Official statistics** — 2021 Population Census figures per district, WSD leakage-rate trend
  (25% in 2000 → 13.4% in 2024), burst-count decline (~2,500 → 27/year), 3,000 km pipe replacement
  programme, ~2,400 smart-network monitoring zones, 2024 water consumption.
- **Trilingual UI** — full language switch among 繁體中文 / 简体中文 / English.

## Repository structure

```
aquapulse-hk-dashboard/
├── README.md
├── aquapulse-dashboard/          # front end (single-file HTML)
│   ├── index.html                # final deliverable — self-contained, open to run
│   ├── index.template.html       # v3 page template (source of index.html)
│   ├── build.py                  # injects app_data.json into the template -> index.html
│   └── check.py                  # static checks (JS syntax, CDN SRI, no local paths, trilingual)
└── data_pipeline/                # data acquisition + processing
    ├── app_data.json             # pre-built dataset consumed by build.py (~17 MB)
    ├── pipeline3.py              # rebuild app_data.json from raw sources (entry point)
    ├── fetch_hk_boundaries.py    # OSM: 18-district boundaries / coastline / water / rivers
    ├── fetch_buildings15.py      # OSM: building footprints (15 districts; 3 districts reuse v2 files)
    └── extract_roads_hk.py       # TD CENTERLINE.kml -> roads_hk.json (streaming parse)
```

## How to run

**Option A — just the demo (recommended)**
Double-click `aquapulse-dashboard/index.html`. The page is fully self-contained; only the ECharts
library is loaded from jsDelivr CDN.

**Option B — local server (optional)**
```
cd aquapulse-dashboard
python -m http.server 8123
# open http://127.0.0.1:8123/index.html
```

**Option C — rebuild everything**
```
cd data_pipeline
python extract_roads_hk.py        # needs CENTERLINE.kml (see Data sources; excluded from repo due to size)
python fetch_hk_boundaries.py     # Overpass API (retries built in)
python fetch_buildings15.py       # Overpass API
python pipeline3.py               # ~3 min -> app_data.json
cd ..\aquapulse-dashboard
python build.py                   # -> index.html
python check.py
```

## Data sources

| Data | Source |
|---|---|
| Road centreline | Transport Department (data.gov.hk) — CENTERLINE (532 MB KML) |
| District boundaries, coastline, water, rivers, buildings | OpenStreetMap via Overpass API |
| Population (2021) | Census and Statistics Department — 2021 Population Census factsheets |
| Leakage rate, bursts, pipe replacement, smart network | Water Supplies Department (WSD) — LegCo panel papers & WSD website |
| Burst incidents (2021–2026) | Public Hong Kong media reports (Wen Wei Po, Ta Kung Wen Wei, StoryChase, news.gov.hk, Sing Tao) |

## Important notes / disclaimer

- **Underground pipe geometry is not public.** Water/sewer network segments in this project are
  simulated along the real road network; the PRI model uses public proxies (road class/loading,
  building density, network spread, age proxy) as documented in the dashboard's "Method & Proxies".
- **Pressure sensor readings are simulated** for demonstration purposes (FYP prototype).
- All officially published statistics shown (population, leakage rate, burst counts, consumption)
  are real and cited in the dashboard footer.
- This is a final-year-project prototype, not an operational engineering system.

## License

For academic / FYP use. Data remains © their respective owners (HKSAR Government, OpenStreetMap
contributors, media outlets).

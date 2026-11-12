# CampusRoutes – Smart Campus Navigation Platform (TIET Patiala)

Interactive pedestrian navigation and campus discovery web application for , built with HTML5, CSS3, JavaScript, and Leaflet.js.

## Project Structure

```text
CampusRoutes/
├── index.html          # Main semantic application shell
├── tests.html          # Browser-based automated test runner
├── manifest.json       # Web app manifest
├── css/
│   └── styles.css      # Responsive light/dark UI styling & accessibility focus rings
└── js/
    ├── locations.js    # Canonical, schema-validated TIET campus location dataset
    ├── graph.js        # Connected TIET pedestrian pathway nodes & edges + integrity validator
    ├── routing.js      # Cached Dijkstra shortest-path & alternative route engine
    ├── search.js       # Deduplicated, alias- & typo-tolerant search + XSS-safe highlighting
    ├── map.js          # Leaflet map controller, single-marker registry & route polylines
    ├── storage.js      # Safe localStorage persistence for recents, favorites & theme
    ├── app.js          # Main UI controller, debounced inputs & ARIA live status updates
    └── tests.js        # Zero-dependency automated unit & integration tests
```

## Running Locally

1. Open the `CampusRoutes` folder in VS Code and launch `index.html` with **Live Server** (or run `python -m http.server 8000`).
2. To run automated tests:
   - **In Browser:** Open `tests.html` via your local HTTP server.
   - **In Node.js:** Run `node js/tests.js`.

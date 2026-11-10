# CampusRoutes – Smart Campus Navigation Platform

### Thapar Institute of Engineering & Technology (TIET), Patiala

*Your Campus, Within Reach.*

CampusRoutes is an interactive campus navigation platform designed to help students, faculty and visitors explore Thapar University, discover important locations and find walking routes across campus.

Built using **HTML5, CSS3 and Vanilla JavaScript**, it provides a frontend-only experience without requiring a backend, database or Python dependencies.

## ✨ Features

- **Interactive Campus Map:** Explore the TIET campus using OpenStreetMap with optional Esri map layers.
- **Location Search:** Search campus buildings, hostels, departments and facilities with real-time autocomplete.
- **Canonical Location Management:** Centralized location data with unique IDs, alias resolution and duplicate prevention.
- **Campus Categories:** Browse academic blocks, hostels, libraries, food courts, sports facilities, administrative buildings and other facilities.
- **Smart Route Planning:** Dijkstra-based shortest-path navigation with primary and alternative walking routes.
- **Route Details:** View walking distance, estimated travel time and step-by-step directions.
- **Location Information:** Access descriptions, amenities, sublocations and nearby facilities.
- **Favourites:** Save frequently visited locations using LocalStorage.
- **Campus Map Reference:** Access the official schematic campus map.

## 🛠️ Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Leaflet.js
- OpenStreetMap
- Esri Map Layers
- GeoJSON
- JSON
- LocalStorage

## 📁 Project Structure

```text
CampusRoutes/
│
├── index.html
├── README.md
├── .gitignore
│
├── assets/
│   ├── campus-map.png
│   └── icons/
│
├── css/
│   ├── style.css
│   └── map.css
│
├── data/
│   ├── locations.json
│   ├── pathways.json
│   └── footprints.geojson
│
└── js/
    ├── locations.js
    ├── graph-data.js
    ├── campus-footprints.js
    ├── storage.js
    ├── search.js
    ├── routing.js
    ├── map.js
    └── app.js
```

## 🚀 Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project folder:

   ```bash
   cd CampusRoutes
   ```

3. Open the folder in VS Code.

4. Run `index.html` using the **Live Server** extension.

Alternatively, use a local static HTTP server:

```bash
npx serve .
```

## 🗺️ Map & Routing

- Campus locations are maintained in a centralized JSON dataset.
- Pedestrian pathways are stored in a structured routing graph.
- Dijkstra's algorithm calculates walking routes.
- GeoJSON provides building footprint data.
- Leaflet manages map rendering, markers and route visualization.

## 💾 Data Storage

LocalStorage is used to save favourite locations and user preferences. No external database or user authentication is required.

## 📝 Notes

- An internet connection is required for externally hosted map tiles.
- Map attribution is provided according to the respective providers' requirements.
- The application runs entirely in the browser without Python or backend dependencies.
- A local HTTP server is recommended for loading JSON datasets reliably.

## 🎯 Objective

CampusRoutes aims to simplify campus navigation by combining interactive maps, intelligent search and walking route planning into one convenient platform.

---

**CampusRoutes – Your Campus, Within Reach.**
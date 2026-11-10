# CampusRoutes – Smart Campus Navigation Platform
### Thapar Institute of Engineering & Technology (TIET), Patiala
> *"Your Campus, Within Reach"*

A modern, fast, and fully functional campus navigation web application built specifically for **Thapar Institute of Engineering & Technology (TIET), Patiala**.

The application is built **strictly with pure HTML5, CSS3, and Vanilla JavaScript** — zero Python dependencies, zero backend frameworks, zero databases, and zero build tool requirements.

---

## 🌟 Core Features & Architectural Guarantees

1. **Pure Frontend Architecture (Zero Server/Python Dependencies)**
   - Built exclusively with standard web technologies (**HTML5, CSS3, Vanilla ES6+ JavaScript**).
   - No Python execution (`.py`), no Flask/Django/FastAPI, no Node.js backend runtime.
   - Works immediately when served via any local static server (e.g. **VS Code Live Server**) or opened directly in any modern browser.

2. **Accurate TIET Patiala Map & Watermark-Free Tiles**
   - Geographically grounded on verified TIET Patiala coordinates `[30.348°N - 30.362°N, 76.358°E - 76.375°E]`.
   - **Zero API Key Watermarks**: Uses high-performance OpenStreetMap Standard tiles by default (`https://tile.openstreetmap.org/`), with optional Esri Campus Streets and Esri Satellite Imagery layers.
   - Vector building footprints and sports pitch polygons for architectural context.
   - Integrated **Official 2D Schematic Campus Map** reference (`assets/campus-map.png`, 1.58 MB) accessible directly from the top bar.

3. **Zero Duplicate Locations (Canonical Single-Source Architecture)**
   - Centralized dataset in `data/locations.json` and `js/locations.js`.
   - Every physical place has exactly **one canonical record** with a unique ID and coordinates.
   - Departments (e.g. CSED, ECED, MED, CED) and lecture halls (e.g. LP-108, LP-109) are indexed as sublocations under their parent building, never as duplicate markers.
   - Aliases (e.g. *Hostel A* ↔ *Agira Hall*, *Hostel B* ↔ *Amritam Hall*, *Hostel N* ↔ *Ananta Hall*, *Library* ↔ *Nava Nalanda*, *COS*, *OAT*, *STEP*) resolve directly to canonical entities.
   - Map markers are managed via a single `Map<string, L.Marker>` registry—filtering categories toggles layer visibility without creating duplicate markers.

4. **Advanced Search & Discovery**
   - Real-time autocomplete suggestions with match highlighting and category badges.
   - Search across building names, hostels, department codes, room numbers, and common abbreviations.
   - Clear search button (`×`) to quickly reset search input.
   - Organized into **7 standard campus categories**:
     1. **Academic Blocks**
     2. **Hostels**
     3. **Libraries**
     4. **Food Courts and Cafes**
     5. **Sports Facilities**
     6. **Administrative Buildings**
     7. **Other Campus Facilities**

5. **Dijkstra Route Planning with Alternative Routes**
   - Client-side Dijkstra shortest path algorithm over a verified 662-node campus pedestrian pathway network (`data/pathways.json`).
   - Generates both **Direct Pathway (Primary)** and **Scenic Pathway (Alternative)** wherever distinct walkways exist.
   - Interactive variant switcher pills to toggle between direct and alternative routes on the map.
   - Displays real walking distance in meters and walking time in minutes.
   - Step-by-step turn guidance referencing intermediate campus landmarks.
   - Popular route preset shortcuts and start/destination swap button (⇅).

6. **Location Information Cards**
   - Displays canonical location name, category badge, short description, verified amenities, sublocations/departments, operating hours, and nearby verified facilities with exact meter distances.
   - Action buttons: "Navigate Here", "Directions From Here", and "Save Location" (persisted in LocalStorage).

---

## 📁 Clean Project Structure

```text
CampusRoutes/
├── index.html                  # Main responsive single-page application
├── README.md                   # Project documentation & architecture guide
├── .gitignore                  # Standard git ignore file
│
├── assets/
│   ├── campus-map.png          # Official high-definition TIET schematic campus map (1.58 MB)
│   └── icons/                  # High-DPI category SVG icons
│
├── css/
│   ├── style.css               # Design system, typography, sidebar, cards & panels
│   └── map.css                 # Leaflet map styling, custom category SVG pins, route polylines
│
├── data/
│   ├── locations.json          # 52 canonical TIET locations & metadata
│   ├── pathways.json           # 662-node verified pedestrian pathway network
│   └── footprints.geojson      # Vector building & sports pitch footprints
│
└── js/
    ├── locations.js            # Master canonical location database & alias resolver
    ├── graph-data.js           # Pathway network loader
    ├── campus-footprints.js    # Footprints geometry layer
    ├── storage.js              # Safe LocalStorage manager for favourites & recents
    ├── search.js               # Real-time search engine with deduplication & autocomplete
    ├── routing.js              # Dijkstra router with primary & alternative route discovery
    ├── map.js                  # Leaflet map controller, watermark-free tiles & marker registry
    └── app.js                  # Main UI controller, tabs, route switcher & details panel
```

---

## 🚀 How to Run the Application

### Option A: VS Code Live Server (Recommended)
1. Open the `CampusRoutes` folder in **Visual Studio Code**.
2. Right-click `index.html` and select **"Open with Live Server"** (or click "Go Live" in the bottom status bar).
3. The application will launch in your browser at `http://127.0.0.1:5500/`.

### Option B: Any Local HTTP Server
Run any lightweight HTTP server from the `CampusRoutes` directory:
```bash
# Node.js http-server / npx
npx serve .

# Or Python one-line server (if available on the machine)
python -m http.server 8080
```

### Option C: Direct Double-Click
Double-click `index.html` to open directly in any browser (Chrome, Edge, Firefox, Safari). All datasets are pre-bundled to ensure zero CORS errors even when running offline via `file:///`.

---

## 🏛️ Campus Categories (52 Canonical Destinations)

| Category | Count | Sample Canonical Destinations |
| :--- | :---: | :--- |
| **Academic Blocks** | 12 | C-Block (CSED), D-Block (ECED/EIED), B-Block (MED), E-Block, F-Block, G-Block, Tan Complex, Lecture Hall Complex (LP/LT), Mechanical Workshops, Venture Lab / STEP, TSLAS, Polytechnic College. |
| **Hostels** | 15 | Agira Hall (Hostel A), Amritam Hall (Hostel B), Prithvi Hall (Hostel C), Vahni Hall (Hostel Q, girls' hostel), Hostel E, G Hostel (girls' hostel), Vyan Hall (Hostel H), Ira Hall (Hostel I), Tejas Hall (Hostel J), Ambaram Hall (Hostel K), Anantam Hall (Hostel M Towers), Ananta Hall (Iconic Hostel N), Vyom Hall (Hostel O), PG Hostel, Vasudha Hall. |
| **Libraries** | 1 | Nava Nalanda Central Library (4-storey central academic library & reading halls). |
| **Food Courts and Cafes** | 6 | COS Complex Central Food Court (Jaggi, Wrapchik, Dessert Club, Chai Nagri, Honey, Bombay Munchery), Streat Cafe & Bakery, Waterbody Cafe, G-Block Canteen, TSLAS Canteen, Ahaar Food Point. |
| **Sports Facilities** | 6 | Athletic Stadium & 400m Synthetic Running Track, Olympic Swimming Pool Complex, Cricket Pavilion & Turf Ground, Floodlit Tennis Courts, Volleyball & Basketball Arena, Open Air Theatre (OAT). |
| **Administrative Buildings** | 2 | Directorate (Central Admin, Director, Registrar, Accounts), Dean's Office (DOSA, DOAA). |
| **Other Campus Facilities** | 10 | Health Centre & Dispensary (24/7 Ambulance), State Bank of India (SBI) & ATM, Campus Gurudwara Sahib, Main Gate 1 (Bhadson Rd), Back Gate 3 (Adarsh Nagar), Central Fountain Plaza, SBOP Lawns, Executive Guest House, Faculty Residences (FRE/FRF). |

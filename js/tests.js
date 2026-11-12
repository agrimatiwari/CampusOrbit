/**
 * js/tests.js
 * Lightweight, zero-dependency automated verification suite for CampusRoutes.
 * Executable in browser (via tests.html) and in Node.js (`node js/tests.js`).
 */

(function (global) {
    'use strict';

    const Locations = global.CampusLocations || require('./locations.js');
    const Graph = global.CampusGraph || require('./graph.js');
    const Search = global.CampusSearch || require('./search.js');
    const Routing = global.CampusRouting || require('./routing.js');
    const MapCtrl = global.CampusMap || null;

    const results = [];

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    function test(name, fn) {
        try {
            fn();
            results.push({ name, passed: true });
        } catch (err) {
            results.push({ name, passed: false, error: err.message });
        }
    }

    // --- 1. Location Dataset Tests ---
    test('Locations: all records pass schema and TIET coordinate bounds validation', () => {
        const report = Locations.validateAll();
        assert(report.valid, `Validation errors: ${report.errors.join('; ')}`);
        assert(report.count >= 35, `Expected at least 35 TIET locations, got ${report.count}`);
    });

    test('Locations: zero duplicate IDs or duplicate names exist', () => {
        const all = Locations.getAll();
        const ids = new Set(all.map((l) => l.id));
        const names = new Set(all.map((l) => l.name.toLowerCase()));
        assert(ids.size === all.length, 'Duplicate location IDs detected');
        assert(names.size === all.length, 'Duplicate location names detected');
    });

    test('Locations: invalid or out-of-bounds records are rejected', () => {
        assert(!Locations.validateRecord({ id: '', name: 'Bad', category: 'academic', lat: 30.35, lng: 76.36 }));
        assert(!Locations.validateRecord({ id: 'oob', name: 'Delhi', category: 'academic', lat: 28.61, lng: 77.20 }));
    });

    // --- 2. Graph Integrity Tests ---
    test('Graph: all edges reference existing nodes and entire campus graph is connected', () => {
        const report = Graph.validateGraph();
        assert(report.valid, `Graph errors: ${report.errors.join('; ')}`);
        assert(report.disconnectedNodes.length === 0, `Disconnected nodes: ${report.disconnectedNodes.join(', ')}`);
    });

    test('Graph: every location resolves to a valid nearby pathway node', () => {
        const adjGraph = Routing.getAdjacencyGraph(Graph);
        for (const loc of Locations.getAll()) {
            const snap = Routing.resolveGraphNode(loc, adjGraph);
            assert(snap !== null, `Location ${loc.id} failed to snap to a pathway node`);
        }
    });

    // --- 3. Search Tests ---
    test('Search: exact, partial, alias, and case-insensitive queries return accurate results', () => {
        const all = Locations.getAll();
        const exact = Search.searchLocations(all, 'CSED Building');
        assert(exact[0] && exact[0].id === 'csed', 'Expected CSED Building first');

        const partialCase = Search.searchLocations(all, 'nalanda');
        assert(partialCase[0] && partialCase[0].id === 'library', 'Expected Central Library for "nalanda"');

        const alias = Search.searchLocations(all, 'agira');
        assert(alias[0] && alias[0].id === 'hostel_a', 'Expected Hostel A for alias "agira"');
    });

    test('Search: empty query returns deduplicated list and unmatched query returns empty array', () => {
        const all = Locations.getAll();
        const emptyRes = Search.searchLocations(all, '');
        const ids = new Set(emptyRes.map((l) => l.id));
        assert(ids.size === emptyRes.length, 'Duplicate search results returned');

        const none = Search.searchLocations(all, 'zzzz_nonexistent_building_999');
        assert(none.length === 0, 'Expected zero matches for invalid query');
    });

    test('Search: highlightMatch escapes HTML to prevent XSS', () => {
        const html = Search.highlightMatch('<script>alert(1)</script>', 'script');
        assert(!html.includes('<script>'), 'Raw <script> tag was not escaped');
        assert(html.includes('&lt;<mark class="search-highlight">script</mark>&gt;'), 'Expected safe <mark> highlight');
    });

    // --- 4. Routing Tests ---
    test('Routing: computes valid multi-node pedestrian route between Gate 1 and COS Complex', () => {
        const gate1 = Locations.getById('gate_1');
        const cos = Locations.getById('cos');
        const res = Routing.calculateRoute(gate1, cos);

        assert(res.ok === true, `Expected valid route, got error: ${res.message}`);
        assert(res.primary.pathNodes.length >= 5, 'Expected multi-segment pedestrian path');
        assert(res.primary.distanceMeters > 700 && res.primary.distanceMeters < 1800, `Unexpected distance: ${res.primary.distanceMeters}m`);
        assert(res.primary.steps.length >= 2, 'Expected turn-by-turn steps');
    });

    test('Routing: same origin and destination returns zero-distance arrival without error', () => {
        const lib = Locations.getById('library');
        const res = Routing.calculateRoute(lib, lib);
        assert(res.ok === true && res.sameLocation === true, 'Expected sameLocation flag');
        assert(res.primary.distanceMeters === 0, 'Expected 0m distance');
    });

    test('Routing: disconnected graph subgraph fails gracefully without straight-line fallback', () => {
        const islandGraph = {
            nodes: {
                N_a: [30.3520, 76.3730],
                N_b: [30.3550, 76.3660]
            },
            edges: []
        };
        Routing.resetCache();
        const res = Routing.calculateRoute(
            { id: 'a', name: 'Point A', lat: 30.3520, lng: 76.3730, nearestNode: 'N_a' },
            { id: 'b', name: 'Point B', lat: 30.3550, lng: 76.3660, nearestNode: 'N_b' },
            islandGraph
        );
        Routing.resetCache();
        assert(res.ok === false && res.error === 'NO_PATH', 'Expected NO_PATH error for disconnected nodes');
    });

    // --- 5. Map Tests (Browser DOM only) ---
    if (typeof document !== 'undefined' && MapCtrl && typeof L !== 'undefined') {
        test('Map: initializes Leaflet instance, renders unique markers, and draws/clears routes', () => {
            MapCtrl.initMap('test-map');
            const count = MapCtrl.renderMarkers(Locations.getAll());
            assert(count === Locations.getAll().length, `Expected ${Locations.getAll().length} markers, got ${count}`);

            const route = Routing.calculateRoute(Locations.getById('gate_1'), Locations.getById('library'));
            assert(MapCtrl.drawRoute(route) === true, 'Expected drawRoute to succeed');
            MapCtrl.clearRoute();
        });
    }

    // --- Output Results ---
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;

    if (typeof document !== 'undefined') {
        const summaryEl = document.getElementById('test-summary');
        const listEl = document.getElementById('test-results');
        if (summaryEl) {
            summaryEl.textContent = `${passedCount}/${results.length} tests passed (${failedCount} failed).`;
            summaryEl.className = failedCount === 0 ? 'pass' : 'fail';
        }
        if (listEl) {
            results.forEach((r) => {
                const li = document.createElement('li');
                li.className = r.passed ? 'pass' : 'fail';
                li.textContent = r.passed ? `✓ ${r.name}` : `✕ ${r.name} — ${r.error}`;
                listEl.appendChild(li);
            });
        }
    } else {
        results.forEach((r) => {
            console.log(r.passed ? `PASS: ${r.name}` : `FAIL: ${r.name} -> ${r.error}`);
        });
        if (failedCount > 0) process.exitCode = 1;
    }
})(typeof window !== 'undefined' ? window : globalThis);

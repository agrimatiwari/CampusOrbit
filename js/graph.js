/**
 * js/graph.js
 * Verified pedestrian pathway network for TIET Patiala.
 * Nodes represent real walkway intersections and building entrances ([lat, lng]).
 * Edges represent walkable campus footpaths, roads with sidewalks, and skywalk links.
 */

(function (global) {
    'use strict';

    const nodes = {
        // --- Eastern Entrance & Admin Spine ---
        N_gate1:       [30.35190, 76.37360],
        N_gate1_in:    [30.35235, 76.37245],
        N_sbi:         [30.35290, 76.37155],
        N_admin:       [30.35325, 76.37080],
        N_audi:        [30.35365, 76.37120],
        N_health:      [30.35265, 76.37025],
        N_hostel_pg:   [30.35205, 76.37035],

        // --- Central Academic Quad ---
        N_library:     [30.35425, 76.37045],
        N_aahar:       [30.35390, 76.37025],
        N_c_block:     [30.35435, 76.36940],
        N_b_block:     [30.35385, 76.36905],
        N_f_block:     [30.35345, 76.36965],
        N_h_block:     [30.35315, 76.36875],
        N_d_block:     [30.35475, 76.36885],
        N_e_block:     [30.35510, 76.36945],
        N_g_block:     [30.35540, 76.36860],
        N_jaggu:       [30.35555, 76.36815],

        // --- Skywalk, TAN, LT & CSED Junctions ---
        N_skywalk:     [30.35415, 76.36850],
        N_tan:         [30.35380, 76.36795],
        N_lt:          [30.35470, 76.36790],
        N_csed:        [30.35525, 76.36785],

        // --- Southern Perimeter & Hostels A, B, C ---
        N_gate2:       [30.35175, 76.36880],
        N_hostel_a:    [30.35225, 76.36940],
        N_hostel_b:    [30.35235, 76.36865],
        N_gurdwara:    [30.35260, 76.36820],
        N_hostel_c:    [30.35275, 76.36735],

        // --- Western Hostel & COS Spine ---
        N_cos_south:   [30.35385, 76.36665],
        N_hostel_e:    [30.35335, 76.36630],
        N_hostel_g:    [30.35385, 76.36570],
        N_hostel_h:    [30.35445, 76.36535],
        N_hostel_i:    [30.35425, 76.36465],
        N_cos:         [30.35495, 76.36625],
        N_hostel_j:    [30.35495, 76.36475],
        N_nirvana:     [30.35565, 76.36460],
        N_hostel_n:    [30.35535, 76.36365],

        // --- Northern Sports & North-West Sector ---
        N_ground:      [30.35585, 76.36745],
        N_sports:      [30.35625, 76.36665],
        N_hostel_k:    [30.35585, 76.36535],
        N_hostel_l:    [30.35615, 76.36445],
        N_hostel_o:    [30.35675, 76.36395],
        N_hostel_m:    [30.35635, 76.36320],
        N_lmtsm:       [30.35630, 76.36180],
        N_gate3:       [30.35560, 76.36120]
    };

    const edges = [
        // Gate 1 & Admin Corridor
        ['N_gate1', 'N_gate1_in'],
        ['N_gate1_in', 'N_sbi'],
        ['N_sbi', 'N_admin'],
        ['N_sbi', 'N_audi'],
        ['N_admin', 'N_audi'],
        ['N_admin', 'N_aahar'],
        ['N_admin', 'N_health'],
        ['N_health', 'N_hostel_pg'],
        ['N_health', 'N_hostel_a'],
        ['N_health', 'N_f_block'],

        // Library & Central Academic Quad
        ['N_audi', 'N_library'],
        ['N_library', 'N_aahar'],
        ['N_library', 'N_c_block'],
        ['N_library', 'N_e_block'],
        ['N_aahar', 'N_c_block'],
        ['N_aahar', 'N_f_block'],
        ['N_f_block', 'N_b_block'],
        ['N_f_block', 'N_h_block'],
        ['N_b_block', 'N_c_block'],
        ['N_b_block', 'N_h_block'],
        ['N_b_block', 'N_skywalk'],
        ['N_c_block', 'N_d_block'],
        ['N_c_block', 'N_e_block'],
        ['N_c_block', 'N_skywalk'],
        ['N_d_block', 'N_e_block'],
        ['N_d_block', 'N_g_block'],
        ['N_d_block', 'N_skywalk'],
        ['N_e_block', 'N_g_block'],
        ['N_g_block', 'N_jaggu'],

        // Skywalk, TAN, LT & CSED Connections
        ['N_skywalk', 'N_tan'],
        ['N_skywalk', 'N_lt'],
        ['N_tan', 'N_lt'],
        ['N_tan', 'N_h_block'],
        ['N_tan', 'N_cos_south'],
        ['N_lt', 'N_d_block'],
        ['N_lt', 'N_csed'],
        ['N_lt', 'N_cos'],
        ['N_csed', 'N_g_block'],
        ['N_csed', 'N_jaggu'],
        ['N_csed', 'N_ground'],

        // Southern Hostels & Gate 2
        ['N_gate2', 'N_hostel_b'],
        ['N_hostel_a', 'N_hostel_b'],
        ['N_hostel_b', 'N_gurdwara'],
        ['N_gurdwara', 'N_h_block'],
        ['N_gurdwara', 'N_hostel_c'],
        ['N_hostel_c', 'N_tan'],
        ['N_hostel_c', 'N_hostel_e'],

        // COS & Western Hostel Spine
        ['N_cos_south', 'N_hostel_e'],
        ['N_cos_south', 'N_hostel_g'],
        ['N_cos_south', 'N_cos'],
        ['N_hostel_e', 'N_hostel_g'],
        ['N_hostel_g', 'N_hostel_h'],
        ['N_hostel_h', 'N_hostel_i'],
        ['N_hostel_h', 'N_cos'],
        ['N_hostel_i', 'N_hostel_j'],
        ['N_cos', 'N_hostel_j'],
        ['N_cos', 'N_nirvana'],
        ['N_cos', 'N_hostel_k'],
        ['N_hostel_j', 'N_nirvana'],
        ['N_hostel_j', 'N_hostel_n'],
        ['N_nirvana', 'N_hostel_n'],
        ['N_nirvana', 'N_hostel_k'],
        ['N_nirvana', 'N_hostel_l'],

        // Northern Sports & LMTSM / Gate 3
        ['N_jaggu', 'N_ground'],
        ['N_ground', 'N_sports'],
        ['N_sports', 'N_hostel_k'],
        ['N_hostel_k', 'N_hostel_l'],
        ['N_hostel_l', 'N_hostel_o'],
        ['N_hostel_l', 'N_hostel_m'],
        ['N_hostel_o', 'N_hostel_m'],
        ['N_hostel_n', 'N_hostel_m'],
        ['N_hostel_m', 'N_lmtsm'],
        ['N_hostel_n', 'N_gate3'],
        ['N_lmtsm', 'N_gate3']
    ];

    function validateGraph() {
        const errors = [];
        const nodeIds = Object.keys(nodes);
        const nodeSet = new Set(nodeIds);
        const adj = new Map(nodeIds.map((id) => [id, []]));

        for (const [u, v] of edges) {
            if (!nodeSet.has(u)) errors.push(`Missing node in edge: ${u}`);
            if (!nodeSet.has(v)) errors.push(`Missing node in edge: ${v}`);
            if (u === v) errors.push(`Self-loop edge detected: ${u}`);
            if (nodeSet.has(u) && nodeSet.has(v)) {
                adj.get(u).push(v);
                adj.get(v).push(u);
            }
        }

        const visited = new Set();
        if (nodeIds.length > 0) {
            const queue = [nodeIds[0]];
            visited.add(nodeIds[0]);
            while (queue.length > 0) {
                const curr = queue.shift();
                for (const next of adj.get(curr)) {
                    if (!visited.has(next)) {
                        visited.add(next);
                        queue.push(next);
                    }
                }
            }
        }

        const disconnected = nodeIds.filter((id) => !visited.has(id));
        if (disconnected.length > 0) {
            errors.push(`Disconnected nodes detected: ${disconnected.join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            nodeCount: nodeIds.length,
            edgeCount: edges.length,
            disconnectedNodes: disconnected,
            errors
        };
    }

    const CampusGraph = {
        nodes,
        edges,
        validateGraph
    };

    global.CampusGraph = CampusGraph;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CampusGraph;
    }
})(typeof window !== 'undefined' ? window : globalThis);

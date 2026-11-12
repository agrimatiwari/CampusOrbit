/**
 * js/locations.js
 * Canonical, validated dataset of Thapar Institute of Engineering & Technology (TIET) Patiala landmarks.
 * Single source of truth used by Search, Map Markers, and Pedestrian Routing.
 */

(function (global) {
    'use strict';

    const TIET_BOUNDS = {
        minLat: 30.3450,
        maxLat: 30.3620,
        minLng: 76.3550,
        maxLng: 76.3780
    };

    const VALID_CATEGORIES = new Set([
        'academic',
        'hostel',
        'dining',
        'admin',
        'sports',
        'landmark',
        'medical',
        'gate'
    ]);

    const RAW_LOCATIONS = [
        // --- Academic Blocks & Labs ---
        {
            id: 'c_block',
            name: 'C Block (Main Academic)',
            aliases: ['C-Block', 'Computer Science Block', 'Main Block'],
            category: 'academic',
            lat: 30.35435,
            lng: 76.36940,
            nearestNode: 'N_c_block',
            description: 'Central academic block housing core engineering departments, classrooms, and faculty offices.',
            hours: '8:00 AM – 8:00 PM',
            floors: 3
        },
        {
            id: 'b_block',
            name: 'B Block',
            aliases: ['B-Block', 'Mechanical Block'],
            category: 'academic',
            lat: 30.35385,
            lng: 76.36905,
            nearestNode: 'N_b_block',
            description: 'Engineering laboratories, workshops, and lecture halls adjacent to C Block.',
            hours: '8:00 AM – 7:00 PM',
            floors: 3
        },
        {
            id: 'd_block',
            name: 'D Block',
            aliases: ['D-Block', 'Electronics Block', 'ECED'],
            category: 'academic',
            lat: 30.35475,
            lng: 76.36885,
            nearestNode: 'N_d_block',
            description: 'Department of Electronics & Communication Engineering and research labs.',
            hours: '8:00 AM – 8:00 PM',
            floors: 3
        },
        {
            id: 'e_block',
            name: 'E Block',
            aliases: ['E-Block', 'Electrical Block', 'EIED'],
            category: 'academic',
            lat: 30.35510,
            lng: 76.36945,
            nearestNode: 'N_e_block',
            description: 'Electrical & Instrumentation Engineering labs and seminar rooms.',
            hours: '8:00 AM – 7:00 PM',
            floors: 3
        },
        {
            id: 'f_block',
            name: 'F Block',
            aliases: ['F-Block', 'Chemical Civil Block'],
            category: 'academic',
            lat: 30.35345,
            lng: 76.36965,
            nearestNode: 'N_f_block',
            description: 'Civil and Chemical Engineering departments and testing facilities.',
            hours: '8:00 AM – 7:00 PM',
            floors: 3
        },
        {
            id: 'g_block',
            name: 'G Block',
            aliases: ['G-Block', 'Biotech Block'],
            category: 'academic',
            lat: 30.35540,
            lng: 76.36860,
            nearestNode: 'N_g_block',
            description: 'Biotechnology and Sciences laboratories and lecture rooms.',
            hours: '8:00 AM – 7:00 PM',
            floors: 3
        },
        {
            id: 'h_block',
            name: 'H Block',
            aliases: ['H-Block'],
            category: 'academic',
            lat: 30.35315,
            lng: 76.36875,
            nearestNode: 'N_h_block',
            description: 'Academic classrooms and tutorial rooms near the southern academic quad.',
            hours: '8:00 AM – 6:00 PM',
            floors: 2
        },
        {
            id: 'tan',
            name: 'TAN Building (Academic Block)',
            aliases: ['TAN', 'TAN Academic Block', 'Thapar Academic Complex'],
            category: 'academic',
            lat: 30.35380,
            lng: 76.36795,
            nearestNode: 'N_tan',
            description: 'Multi-storey modern lecture complex, computer labs, and tutorial rooms.',
            hours: '8:00 AM – 9:00 PM',
            floors: 4
        },
        {
            id: 'lt',
            name: 'Lecture Theatre Complex (LT)',
            aliases: ['LT', 'Lecture Theatres', 'LT-101', 'LT-102'],
            category: 'academic',
            lat: 30.35470,
            lng: 76.36790,
            nearestNode: 'N_lt',
            description: 'Large tiered lecture halls (LT-101 to LT-104) for first-year and core courses.',
            hours: '8:00 AM – 8:00 PM',
            floors: 2
        },
        {
            id: 'csed',
            name: 'CSED Building',
            aliases: ['CSED', 'Computer Science Department', 'CSE'],
            category: 'academic',
            lat: 30.35525,
            lng: 76.36785,
            nearestNode: 'N_csed',
            description: 'Computer Science & Engineering Department hub, AI/ML labs, and faculty cabins.',
            hours: '8:00 AM – 9:00 PM',
            floors: 4
        },
        {
            id: 'library',
            name: 'Nava Nalanda Central Library',
            aliases: ['Library', 'Central Library', 'Nava Nalanda', 'Reading Room'],
            category: 'academic',
            lat: 30.35425,
            lng: 76.37045,
            nearestNode: 'N_library',
            description: 'Five-storey central library with digital archives, quiet reading halls, and group study pods.',
            hours: '8:00 AM – 12:00 AM',
            floors: 5
        },
        {
            id: 'lmtsm',
            name: 'LM Thapar School of Management',
            aliases: ['LMTSM', 'Management School', 'MBA Block'],
            category: 'academic',
            lat: 30.35630,
            lng: 76.36180,
            nearestNode: 'N_lmtsm',
            description: 'Business school campus housing MBA lecture theatres, MDP centre, and executive suites.',
            hours: '8:30 AM – 8:00 PM',
            floors: 4
        },

        // --- Administration & Landmarks ---
        {
            id: 'admin_block',
            name: 'Administrative Block (Directorate)',
            aliases: ['Admin Block', 'Director Office', 'Registrar', 'Accounts'],
            category: 'admin',
            lat: 30.35325,
            lng: 76.37080,
            nearestNode: 'N_admin',
            description: 'Office of the Director, Registrar, Academic Affairs, and Student Accounts.',
            hours: '9:00 AM – 5:30 PM',
            floors: 2
        },
        {
            id: 'main_audi',
            name: 'Main Auditorium',
            aliases: ['Auditorium', 'Main Audi', 'OAT'],
            category: 'landmark',
            lat: 30.35365,
            lng: 76.37120,
            nearestNode: 'N_audi',
            description: 'Primary campus auditorium hosting convocations, cultural fests, and keynote talks.',
            hours: '9:00 AM – 9:00 PM',
            floors: 2
        },
        {
            id: 'skywalk',
            name: 'Campus Skywalk & Central Plaza',
            aliases: ['Skywalk', 'Central Plaza', 'Fountain Chowk'],
            category: 'landmark',
            lat: 30.35415,
            lng: 76.36850,
            nearestNode: 'N_skywalk',
            description: 'Elevated pedestrian walkway and central student gathering plaza.',
            hours: '24 Hours',
            floors: 1
        },
        {
            id: 'gurdwara',
            name: 'Campus Gurdwara Sahib',
            aliases: ['Gurdwara', 'Temple', 'Prayer Hall'],
            category: 'landmark',
            lat: 30.35260,
            lng: 76.36820,
            nearestNode: 'N_gurdwara',
            description: 'Serene spiritual centre near the residential and southern hostel zone.',
            hours: '5:00 AM – 9:00 PM',
            floors: 1
        },
        {
            id: 'sbi_bank',
            name: 'SBI Campus Branch & ATMs',
            aliases: ['SBI', 'Bank', 'ATM', 'State Bank of India'],
            category: 'admin',
            lat: 30.35290,
            lng: 76.37155,
            nearestNode: 'N_sbi',
            description: 'State Bank of India branch with 24/7 ATM lobby near Gate 1.',
            hours: '10:00 AM – 4:00 PM (ATMs 24/7)',
            floors: 1
        },

        // --- Dining & Student Hubs ---
        {
            id: 'cos',
            name: 'COS Complex (Student Activity Centre)',
            aliases: ['COS', 'Commercial Complex', 'Food Court', 'Stationery'],
            category: 'dining',
            lat: 30.35495,
            lng: 76.36625,
            nearestNode: 'N_cos',
            description: 'Main campus hub with eateries, cafes, photocopy shops, salon, and student club rooms.',
            hours: '8:00 AM – 11:00 PM',
            floors: 2
        },
        {
            id: 'jaggu',
            name: 'Jaggi Juice & Food Corner',
            aliases: ['Jaggi', 'Jaggu', 'Juice Corner', 'G-Block Canteen'],
            category: 'dining',
            lat: 30.35555,
            lng: 76.36815,
            nearestNode: 'N_jaggu',
            description: 'Popular student refreshment spot serving fresh juices, shakes, and quick snacks.',
            hours: '8:00 AM – 10:00 PM',
            floors: 1
        },
        {
            id: 'aahar',
            name: 'Aahar Cafeteria',
            aliases: ['Aahar', 'Main Canteen', 'Library Canteen'],
            category: 'dining',
            lat: 30.35390,
            lng: 76.37025,
            nearestNode: 'N_aahar',
            description: 'Central campus cafeteria near the Library and C Block serving meals and beverages.',
            hours: '8:00 AM – 9:30 PM',
            floors: 1
        },
        {
            id: 'nirvana',
            name: 'Nirvana Food Court',
            aliases: ['Nirvana', 'Hostel Food Court'],
            category: 'dining',
            lat: 30.35565,
            lng: 76.36460,
            nearestNode: 'N_nirvana',
            description: 'Evening food court and hangout zone serving the western hostel cluster.',
            hours: '11:00 AM – 11:30 PM',
            floors: 1
        },

        // --- Hostels ---
        {
            id: 'hostel_a',
            name: 'Hostel A (Agira Hall)',
            aliases: ['Hostel A', 'Agira', 'Agira Hall'],
            category: 'hostel',
            lat: 30.35225,
            lng: 76.36940,
            nearestNode: 'N_hostel_a',
            description: 'Boys residential hostel near the southern perimeter road.',
            hours: '24 Hours (Resident Access)',
            floors: 3
        },
        {
            id: 'hostel_b',
            name: 'Hostel B (Amritam Hall)',
            aliases: ['Hostel B', 'Amritam', 'Amritam Hall'],
            category: 'hostel',
            lat: 30.35235,
            lng: 76.36865,
            nearestNode: 'N_hostel_b',
            description: 'Boys residential hostel adjacent to Hostel A and Gurdwara.',
            hours: '24 Hours (Resident Access)',
            floors: 3
        },
        {
            id: 'hostel_c',
            name: 'Hostel C (Prithvi Hall)',
            aliases: ['Hostel C', 'Prithvi', 'Prithvi Hall'],
            category: 'hostel',
            lat: 30.35275,
            lng: 76.36735,
            nearestNode: 'N_hostel_c',
            description: 'Boys residential hostel located along the central-south pathway.',
            hours: '24 Hours (Resident Access)',
            floors: 3
        },
        {
            id: 'hostel_e',
            name: 'Hostel E (Neeram Hall)',
            aliases: ['Hostel E', 'Neeram', 'Neeram Hall'],
            category: 'hostel',
            lat: 30.35335,
            lng: 76.36630,
            nearestNode: 'N_hostel_e',
            description: 'Girls residential hostel complex near COS South.',
            hours: '24 Hours (Resident Access)',
            floors: 3
        },
        {
            id: 'hostel_g',
            name: 'Hostel G (Viyat Hall)',
            aliases: ['Hostel G', 'Viyat', 'Viyat Hall'],
            category: 'hostel',
            lat: 30.35385,
            lng: 76.36570,
            nearestNode: 'N_hostel_g',
            description: 'Girls residential hostel in the western hostel zone.',
            hours: '24 Hours (Resident Access)',
            floors: 3
        },
        {
            id: 'hostel_h',
            name: 'Hostel H (Tejas Hall)',
            aliases: ['Hostel H', 'Tejas', 'Tejas Hall'],
            category: 'hostel',
            lat: 30.35445,
            lng: 76.36535,
            nearestNode: 'N_hostel_h',
            description: 'Boys residential hostel south of the COS complex.',
            hours: '24 Hours (Resident Access)',
            floors: 4
        },
        {
            id: 'hostel_i',
            name: 'Hostel I (Ira Hall)',
            aliases: ['Hostel I', 'Ira', 'Ira Hall'],
            category: 'hostel',
            lat: 30.35425,
            lng: 76.36465,
            nearestNode: 'N_hostel_i',
            description: 'Girls residential hostel with dedicated dining and common room facilities.',
            hours: '24 Hours (Resident Access)',
            floors: 4
        },
        {
            id: 'hostel_j',
            name: 'Hostel J (Ambaram Hall)',
            aliases: ['Hostel J', 'Ambaram', 'Ambaram Hall'],
            category: 'hostel',
            lat: 30.35495,
            lng: 76.36475,
            nearestNode: 'N_hostel_j',
            description: 'Large multi-wing boys hostel adjacent to COS and Nirvana.',
            hours: '24 Hours (Resident Access)',
            floors: 4
        },
        {
            id: 'hostel_k',
            name: 'Hostel K (Anantam Hall)',
            aliases: ['Hostel K', 'Anantam', 'Anantam Hall'],
            category: 'hostel',
            lat: 30.35585,
            lng: 76.36535,
            nearestNode: 'N_hostel_k',
            description: 'Boys residential hostel near the northern sports complex.',
            hours: '24 Hours (Resident Access)',
            floors: 4
        },
        {
            id: 'hostel_l',
            name: 'Hostel L (Vyom Hall)',
            aliases: ['Hostel L', 'Vyom', 'Vyom Hall'],
            category: 'hostel',
            lat: 30.35615,
            lng: 76.36445,
            nearestNode: 'N_hostel_l',
            description: 'Residential hostel in the north-west campus sector.',
            hours: '24 Hours (Resident Access)',
            floors: 4
        },
        {
            id: 'hostel_m',
            name: 'Hostel M (Ananta Hall)',
            aliases: ['Hostel M', 'Ananta', 'Ananta Hall'],
            category: 'hostel',
            lat: 30.35635,
            lng: 76.36320,
            nearestNode: 'N_hostel_m',
            description: 'Modern multi-storey hostel block near LMTSM.',
            hours: '24 Hours (Resident Access)',
            floors: 7
        },
        {
            id: 'hostel_n',
            name: 'Hostel N (Dhriti Hall)',
            aliases: ['Hostel N', 'Dhriti', 'Dhriti Hall'],
            category: 'hostel',
            lat: 30.35535,
            lng: 76.36365,
            nearestNode: 'N_hostel_n',
            description: 'Girls residential hostel west of Nirvana Food Court.',
            hours: '24 Hours (Resident Access)',
            floors: 6
        },
        {
            id: 'hostel_o',
            name: 'Hostel O (Vahni Hall)',
            aliases: ['Hostel O', 'Vahni', 'Vahni Hall'],
            category: 'hostel',
            lat: 30.35675,
            lng: 76.36395,
            nearestNode: 'N_hostel_o',
            description: 'High-rise residential hostel in the north-western campus sector.',
            hours: '24 Hours (Resident Access)',
            floors: 7
        },
        {
            id: 'hostel_pg',
            name: 'PG Hostel (Postgraduate Hall)',
            aliases: ['PG Hostel', 'Postgraduate Hostel'],
            category: 'hostel',
            lat: 30.35205,
            lng: 76.37035,
            nearestNode: 'N_hostel_pg',
            description: 'Dedicated residential hall for postgraduate and doctoral scholars.',
            hours: '24 Hours (Resident Access)',
            floors: 3
        },

        // --- Sports & Medical ---
        {
            id: 'sports_complex',
            name: 'TIET Sports Complex & Gymnasium',
            aliases: ['Sports Complex', 'Gym', 'Indoor Stadium', 'Swimming Pool', 'Tennis Courts'],
            category: 'sports',
            lat: 30.35625,
            lng: 76.36665,
            nearestNode: 'N_sports',
            description: 'Indoor badminton/basketball courts, fitness gym, swimming pool, and athletic tracks.',
            hours: '6:00 AM – 9:00 PM',
            floors: 2
        },
        {
            id: 'cricket_ground',
            name: 'Main Cricket & Football Ground',
            aliases: ['Cricket Ground', 'Football Ground', 'Main Field', 'Stadium'],
            category: 'sports',
            lat: 30.35585,
            lng: 76.36745,
            nearestNode: 'N_ground',
            description: 'Full-size cricket oval and football pitch hosting inter-university tournaments.',
            hours: '6:00 AM – 8:00 PM',
            floors: 1
        },
        {
            id: 'health_centre',
            name: 'TIET Health Centre (Dispensary)',
            aliases: ['Health Centre', 'Dispensary', 'Hospital', 'Clinic', 'Medical'],
            category: 'medical',
            lat: 30.35265,
            lng: 76.37025,
            nearestNode: 'N_health',
            description: '24/7 campus medical clinic, ambulance service, and pharmacy.',
            hours: '24 Hours',
            floors: 1
        },

        // --- Gates ---
        {
            id: 'gate_1',
            name: 'Main Gate (Gate 1)',
            aliases: ['Gate 1', 'Main Gate', 'Bhadson Road Gate'],
            category: 'gate',
            lat: 30.35190,
            lng: 76.37360,
            nearestNode: 'N_gate1',
            description: 'Primary campus entrance on Bhadson Road with visitor security reception.',
            hours: '24 Hours',
            floors: 1
        },
        {
            id: 'gate_2',
            name: 'Gate 2 (Hostel & Poly Gate)',
            aliases: ['Gate 2', 'Poly Gate', 'Hostel Gate'],
            category: 'gate',
            lat: 30.35175,
            lng: 76.36880,
            nearestNode: 'N_gate2',
            description: 'Southern campus gate providing direct access to Hostels A, B, and C.',
            hours: '6:00 AM – 10:30 PM',
            floors: 1
        },
        {
            id: 'gate_3',
            name: 'Gate 3 (LMTSM & Western Gate)',
            aliases: ['Gate 3', 'Western Gate', 'LMTSM Gate'],
            category: 'gate',
            lat: 30.35560,
            lng: 76.36120,
            nearestNode: 'N_gate3',
            description: 'Western campus entry serving LMTSM, Hostel M, and Hostel N.',
            hours: '6:00 AM – 10:00 PM',
            floors: 1
        }
    ];

    function validateLocation(loc) {
        if (!loc || typeof loc !== 'object') return false;
        if (typeof loc.id !== 'string' || !loc.id.trim()) return false;
        if (typeof loc.name !== 'string' || !loc.name.trim()) return false;
        if (!VALID_CATEGORIES.has(loc.category)) return false;
        if (typeof loc.lat !== 'number' || Number.isNaN(loc.lat)) return false;
        if (typeof loc.lng !== 'number' || Number.isNaN(loc.lng)) return false;
        if (loc.lat < TIET_BOUNDS.minLat || loc.lat > TIET_BOUNDS.maxLat) return false;
        if (loc.lng < TIET_BOUNDS.minLng || loc.lng > TIET_BOUNDS.maxLng) return false;
        return true;
    }

    function buildCanonicalLocations(rawList) {
        const seenIds = new Set();
        const seenNames = new Set();
        const validated = [];
        const issues = [];

        rawList.forEach((raw) => {
            if (!validateLocation(raw)) {
                issues.push(`Invalid location skipped: ${raw && raw.id ? raw.id : 'unknown'}`);
                return;
            }
            const normId = raw.id.trim();
            const normName = raw.name.trim().toLowerCase();

            if (seenIds.has(normId)) {
                issues.push(`Duplicate ID skipped: ${normId}`);
                return;
            }
            if (seenNames.has(normName)) {
                issues.push(`Duplicate name skipped: ${raw.name}`);
                return;
            }

            seenIds.add(normId);
            seenNames.add(normName);

            validated.push(Object.freeze({
                id: normId,
                name: raw.name.trim(),
                aliases: Array.isArray(raw.aliases) ? [...raw.aliases] : [],
                category: raw.category,
                lat: Number(raw.lat.toFixed(6)),
                lng: Number(raw.lng.toFixed(6)),
                nearestNode: raw.nearestNode || null,
                description: raw.description || '',
                hours: raw.hours || 'Check campus notice',
                floors: Number.isFinite(raw.floors) ? raw.floors : 1
            }));
        });

        if (issues.length > 0 && typeof console !== 'undefined') {
            console.warn('[CampusLocations] Validation warnings:', issues);
        }

        return validated;
    }

    const CANONICAL_LOCATIONS = buildCanonicalLocations(RAW_LOCATIONS);
    const LOCATION_BY_ID = new Map(CANONICAL_LOCATIONS.map((loc) => [loc.id, loc]));

    const CampusLocations = {
        BOUNDS: TIET_BOUNDS,
        CATEGORIES: Array.from(VALID_CATEGORIES),

        getAll() {
            return CANONICAL_LOCATIONS;
        },

        getById(id) {
            if (!id) return null;
            return LOCATION_BY_ID.get(String(id).trim()) || null;
        },

        getByCategory(category) {
            if (!category || category === 'all') return CANONICAL_LOCATIONS;
            return CANONICAL_LOCATIONS.filter((loc) => loc.category === category);
        },

        validateRecord: validateLocation,

        validateAll() {
            const ids = new Set();
            const errors = [];
            for (const loc of CANONICAL_LOCATIONS) {
                if (!validateLocation(loc)) {
                    errors.push(`Invalid record: ${loc.id}`);
                }
                if (ids.has(loc.id)) {
                    errors.push(`Duplicate ID: ${loc.id}`);
                }
                ids.add(loc.id);
            }
            return {
                valid: errors.length === 0,
                count: CANONICAL_LOCATIONS.length,
                errors
            };
        }
    };

    global.CampusLocations = CampusLocations;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CampusLocations;
    }
})(typeof window !== 'undefined' ? window : globalThis);

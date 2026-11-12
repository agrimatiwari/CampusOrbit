/**
 * js/search.js
 * Fast, deduplicated location search with alias matching, minor typo tolerance,
 * category filtering, and XSS-safe match highlighting.
 */

(function (global) {
    'use strict';

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function boundedEditDistance(a, b, maxDist = 1) {
        if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
        if (a === b) return 0;

        let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            const curr = [i];
            let rowMin = i;
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                const val = Math.min(
                    prev[j] + 1,
                    curr[j - 1] + 1,
                    prev[j - 1] + cost
                );
                curr.push(val);
                if (val < rowMin) rowMin = val;
            }
            if (rowMin > maxDist) return maxDist + 1;
            prev = curr;
        }
        return prev[b.length];
    }

    function scoreLocation(loc, normQuery) {
        if (!normQuery) return 1;

        const name = loc.name.toLowerCase();
        const category = (loc.category || '').toLowerCase();
        const aliases = Array.isArray(loc.aliases)
            ? loc.aliases.map((a) => a.toLowerCase())
            : [];

        if (name === normQuery || aliases.includes(normQuery)) return 100;
        if (name.startsWith(normQuery)) return 85;
        if (aliases.some((a) => a.startsWith(normQuery))) return 80;
        if (name.includes(normQuery)) return 65;
        if (aliases.some((a) => a.includes(normQuery))) return 60;
        if (category.includes(normQuery)) return 40;

        if (normQuery.length >= 4) {
            const tokens = [
                ...name.split(/[\s\-()]+/),
                ...aliases.flatMap((a) => a.split(/[\s\-()]+/))
            ].filter((t) => t.length >= 4);

            for (const token of tokens) {
                if (boundedEditDistance(normQuery, token, 1) <= 1) {
                    return 35;
                }
            }
        }

        return 0;
    }

    function searchLocations(locations, query = '', options = {}) {
        const list = Array.isArray(locations) ? locations : [];
        const category = options.category && options.category !== 'all' ? options.category : null;
        const limit = Number.isFinite(options.limit) ? options.limit : 20;
        const normQuery = String(query || '').trim().toLowerCase();

        const seenIds = new Set();
        const scored = [];

        for (const loc of list) {
            if (!loc || !loc.id || seenIds.has(loc.id)) continue;
            if (category && loc.category !== category) continue;

            const score = scoreLocation(loc, normQuery);
            if (score > 0) {
                seenIds.add(loc.id);
                scored.push({ location: loc, score });
            }
        }

        scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.location.name.localeCompare(b.location.name);
        });

        return scored.slice(0, limit).map((item) => item.location);
    }

    function highlightMatch(text, query) {
        const rawText = String(text || '');
        const cleanQuery = String(query || '').trim();
        if (!cleanQuery) return escapeHtml(rawText);

        const lowerText = rawText.toLowerCase();
        const lowerQuery = cleanQuery.toLowerCase();
        const idx = lowerText.indexOf(lowerQuery);

        if (idx === -1) {
            return escapeHtml(rawText);
        }

        const before = escapeHtml(rawText.slice(0, idx));
        const match = escapeHtml(rawText.slice(idx, idx + cleanQuery.length));
        const after = escapeHtml(rawText.slice(idx + cleanQuery.length));

        return `${before}<mark class="search-highlight">${match}</mark>${after}`;
    }

    const CampusSearch = {
        searchLocations,
        highlightMatch,
        escapeHtml
    };

    global.CampusSearch = CampusSearch;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CampusSearch;
    }
})(typeof window !== 'undefined' ? window : globalThis);

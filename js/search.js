/**
 * CampusOrbit – Smart Campus Navigation Platform
 * Thapar Institute of Engineering & Technology (TIET), Patiala
 * "Your Campus, Within Reach"
 * 
 * Advanced Search and Discovery Module
 * 
 * Features:
 * - Real-time autocomplete suggestions with debounce
 * - Deep multi-token matching across canonical names, block letters, hostels, departments & facilities
 * - ZERO duplicate results: strictly deduplicated on canonical location ID
 * - Relevance scoring and query highlighting
 * - Keyboard navigation (Up/Down/Enter/Escape)
 * - Friendly empty states with suggestions
 */

(function(window) {
  'use strict';

  function normalize(str) {
    if (!str) return '';
    return str.toString()
      .toLowerCase()
      .replace(/[\-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  window.CampusSearch = {
    /**
     * Search the canonical database
     * @param {string} rawQuery
     * @returns {Array} Deduplicated list of matching canonical location objects with match metadata
     */
    search: function(rawQuery) {
      if (!rawQuery || rawQuery.trim().length === 0) {
        return [];
      }

      const query = normalize(rawQuery);
      const queryTokens = query.split(' ').filter(t => t.length > 0);
      const allLocations = window.CampusLocations.getAll();

      const results = [];
      const seenIds = new Set(); // Guarantee ZERO duplicate results

      allLocations.forEach(loc => {
        let score = 0;
        let matchedOn = null;

        const normName = normalize(loc.name);
        const normBlock = normalize(loc.block || '');
        const normDesc = normalize(loc.description || '');
        const normCat = normalize(loc.category);
        const normSubcat = normalize(loc.subcategory || '');

        // 1. Exact match on ID or canonical name
        if (loc.id === query || normName === query) {
          score += 100;
          matchedOn = 'exact-name';
        } else if (normName.startsWith(query)) {
          score += 80;
          matchedOn = 'name-prefix';
        } else if (normName.includes(query)) {
          score += 60;
          matchedOn = 'name';
        }

        // 2. Match aliases (e.g. "Hostel A", "Library", "LP 108", "COS", "OAT", "STEP", "CSED")
        if (Array.isArray(loc.aliases)) {
          for (const alias of loc.aliases) {
            const normAlias = normalize(alias);
            if (normAlias === query) {
              score = Math.max(score, 95);
              matchedOn = `alias: ${alias}`;
              break;
            } else if (normAlias.startsWith(query)) {
              score = Math.max(score, 75);
              if (!matchedOn) matchedOn = `alias: ${alias}`;
            } else if (normAlias.includes(query)) {
              score = Math.max(score, 50);
              if (!matchedOn) matchedOn = `alias: ${alias}`;
            }
          }
        }

        // 3. Match sublocations & departments (e.g. "CSED", "ECED", "LP-108", "Team Fateh", "Director")
        if (Array.isArray(loc.sublocations)) {
          for (const sub of loc.sublocations) {
            const subName = normalize(sub.name || '');
            const subCode = normalize(sub.code || '');
            if (subCode === query || subName === query) {
              score = Math.max(score, 90);
              matchedOn = `dept: ${sub.name}`;
              break;
            } else if (subCode.includes(query) || subName.includes(query)) {
              score = Math.max(score, 65);
              if (!matchedOn) matchedOn = `dept: ${sub.name}`;
            }
          }
        }

        // 4. Match block / quad / facility area
        if (normBlock.includes(query)) {
          score = Math.max(score, 40);
          if (!matchedOn) matchedOn = `area: ${loc.block}`;
        }

        // 5. Match category or subcategory
        if (normCat.includes(query) || normSubcat.includes(query)) {
          score = Math.max(score, 30);
          if (!matchedOn) matchedOn = `category: ${loc.category}`;
        }

        // 6. Token matching fallback across combined text
        if (score === 0 && queryTokens.length > 1) {
          const haystack = `${normName} ${normBlock} ${loc.aliases ? loc.aliases.join(' ') : ''} ${normDesc}`.toLowerCase();
          const allMatch = queryTokens.every(tok => haystack.includes(tok));
          if (allMatch) {
            score = 35;
            matchedOn = 'keyword match';
          }
        }

        if (score > 0 && !seenIds.has(loc.id)) {
          seenIds.add(loc.id);
          results.push({
            location: loc,
            score: score,
            matchedOn: matchedOn
          });
        }
      });

      // Sort results by relevance score descending
      results.sort((a, b) => b.score - a.score);

      return results;
    },

    /**
     * Utility to highlight query text inside a string
     * @param {string} text
     * @param {string} query
     * @returns {string} HTML string with <mark> tags
     */
    highlight: function(text, query) {
      if (!query || !text) return text;
      const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${cleanQ})`, 'gi');
      return text.replace(regex, '<mark class="search-match">$1</mark>');
    }
  };
})(window);

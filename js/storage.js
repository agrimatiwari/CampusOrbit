/**
 * js/storage.js
 * Safe client-side persistence for recent searches, saved places, and theme preference.
 */

(function (global) {
    'use strict';

    const KEYS = {
        RECENT: 'campusroutes_recent_v2',
        FAVORITES: 'campusroutes_favorites_v2',
        THEME: 'campusroutes_theme_v2'
    };

    function readJson(key, fallback) {
        try {
            const raw = global.localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
        } catch (_err) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        try {
            global.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (_err) {
            return false;
        }
    }

    const CampusStorage = {
        getRecentIds() {
            return readJson(KEYS.RECENT, []).filter((id) => typeof id === 'string');
        },

        addRecentId(locationId) {
            if (!locationId) return;
            const current = this.getRecentIds().filter((id) => id !== locationId);
            current.unshift(locationId);
            writeJson(KEYS.RECENT, current.slice(0, 6));
        },

        getFavoriteIds() {
            return readJson(KEYS.FAVORITES, []).filter((id) => typeof id === 'string');
        },

        toggleFavoriteId(locationId) {
            if (!locationId) return false;
            const favs = new Set(this.getFavoriteIds());
            let added = false;
            if (favs.has(locationId)) {
                favs.delete(locationId);
            } else {
                favs.add(locationId);
                added = true;
            }
            writeJson(KEYS.FAVORITES, Array.from(favs));
            return added;
        },

        isFavorite(locationId) {
            return this.getFavoriteIds().includes(locationId);
        },

        getTheme() {
            try {
                return global.localStorage.getItem(KEYS.THEME) || 'light';
            } catch (_err) {
                return 'light';
            }
        },

        setTheme(theme) {
            try {
                global.localStorage.setItem(KEYS.THEME, theme === 'dark' ? 'dark' : 'light');
            } catch (_err) {
                // Ignore storage quota errors
            }
        }
    };

    global.CampusStorage = CampusStorage;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CampusStorage;
    }
})(typeof window !== 'undefined' ? window : globalThis);

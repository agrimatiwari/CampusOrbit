/**
 * CampusRoutes – Smart Campus Navigation Platform
 * Thapar Institute of Engineering & Technology (TIET), Patiala
 * "Your Campus, Within Reach"
 * 
 * Storage Module – LocalStorage Helper
 * Pure Vanilla JavaScript; manages user favourites, recent searches, and UI preferences.
 */

(function(window) {
  'use strict';

  const FAVOURITES_KEY = 'campusroutes_favourites';
  const RECENTS_KEY = 'campusroutes_recents';
  const PREFS_KEY = 'campusroutes_prefs';

  // Legacy fallback keys
  const LEGACY_KEYS = {
    favourites: ['campusorbit_favourites', 'campusconnect_favourites'],
    recents: ['campusorbit_recents', 'campusconnect_recents']
  };

  const safeStorage = {
    get: function(key, defaultValue, fallbackKeys = []) {
      try {
        let item = localStorage.getItem(key);
        if (!item && fallbackKeys.length > 0) {
          for (const fallback of fallbackKeys) {
            item = localStorage.getItem(fallback);
            if (item) break;
          }
        }
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn('[CampusRoutes] LocalStorage read error:', e);
        return defaultValue;
      }
    },
    set: function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('[CampusRoutes] LocalStorage write error:', e);
      }
    }
  };

  window.CampusStorage = {
    /**
     * Get list of favourite location IDs
     * @returns {string[]}
     */
    getFavourites: function() {
      return safeStorage.get(
        FAVOURITES_KEY, 
        ['nava-nalanda-library', 'cos-complex', 'lt-building'], 
        LEGACY_KEYS.favourites
      );
    },

    /**
     * Check if a location is favourited
     * @param {string} id
     * @returns {boolean}
     */
    isFavourite: function(id) {
      const favs = this.getFavourites();
      return favs.includes(id);
    },

    /**
     * Toggle favourite status for a location ID
     * @param {string} id
     * @returns {boolean} New favourite status
     */
    toggleFavourite: function(id) {
      let favs = this.getFavourites();
      let isFav = false;
      if (favs.includes(id)) {
        favs = favs.filter(favId => favId !== id);
        isFav = false;
      } else {
        favs.push(id);
        isFav = true;
      }
      safeStorage.set(FAVOURITES_KEY, favs);
      return isFav;
    },

    /**
     * Get recent location IDs
     * @returns {string[]}
     */
    getRecents: function() {
      return safeStorage.get(
        RECENTS_KEY, 
        ['nava-nalanda-library', 'lt-building', 'cos-complex', 'auditorium'], 
        LEGACY_KEYS.recents
      );
    },

    /**
     * Add a location ID to recent history (max 8)
     * @param {string} id
     */
    addRecent: function(id) {
      if (!id) return;
      let recents = this.getRecents();
      recents = recents.filter(item => item !== id);
      recents.unshift(id);
      if (recents.length > 8) {
        recents = recents.slice(0, 8);
      }
      safeStorage.set(RECENTS_KEY, recents);
    },

    /**
     * Clear recent history
     */
    clearRecents: function() {
      safeStorage.set(RECENTS_KEY, []);
    },

    /**
     * Get user preferences
     * @returns {Object}
     */
    getPrefs: function() {
      return safeStorage.get(PREFS_KEY, {
        activeLayer: 'osm',
        showFootprints: true
      });
    },

    /**
     * Save user preferences
     * @param {Object} prefs
     */
    savePrefs: function(prefs) {
      const current = this.getPrefs();
      safeStorage.set(PREFS_KEY, { ...current, ...prefs });
    }
  };
})(window);

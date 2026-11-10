/**
 * CampusRoutes – Smart Campus Navigation Platform
 * Thapar Institute of Engineering & Technology (TIET), Patiala
 * "Your Campus, Within Reach"
 * 
 * Main Application Controller (app.js)
 * Pure Vanilla JavaScript; orchestrates search autocomplete, 7 categories,
 * route planner with direct/alternative pathways, and location details cards.
 */

(function(window) {
  'use strict';

  // Application State
  const AppState = {
    activeTab: 'explore', // 'explore' | 'routes' | 'saved' | 'info'
    activeCategory: 'All',
    selectedLocationId: null,
    routeStartId: null,
    routeDestId: null,
    currentRouteData: null,
    activeRouteVariant: 'primary', // 'primary' | 'alternative'
    searchTimeout: null,
    isOfficialMapModalOpen: false
  };

  window.CampusApp = {
    /**
     * Boot the application on DOM ready
     */
    init: async function() {
      console.log('[CampusRoutes] Initializing CampusRoutes for TIET Patiala...');

      // 1. Ensure canonical locations data is initialized
      if (window.CampusLocations && typeof window.CampusLocations.init === 'function') {
        try {
          await window.CampusLocations.init();
        } catch (e) {
          console.warn('[CampusRoutes] Locations init fallback:', e);
        }
      }

      // 2. Initialize Interactive Map
      window.CampusMap.init('campus-map-container', (locationId) => {
        this.selectLocation(locationId, false);
      });

      // 3. Bind DOM Event Handlers
      this.bindSearchEvents();
      this.bindCategoryTabs();
      this.bindRoutePlanner();
      this.bindNavigationTabs();
      this.bindModalEvents();

      // 4. Render Initial UI Elements
      this.renderQuickNavShortcuts();
      this.renderLocationList();
      this.renderSavedList();
      this.populateRouteDropdowns();

      // 5. Check URL hash for direct deep-link (e.g., #nava-nalanda-library)
      if (window.location.hash) {
        const targetId = window.location.hash.replace('#', '');
        if (window.CampusLocations.getById(targetId)) {
          setTimeout(() => {
            this.selectLocation(targetId, true);
          }, 600);
        }
      }

      console.log('[CampusRoutes] Boot complete! "Your Campus, Within Reach"');
    },

    /**
     * Search Input & Autocomplete Dropdown Handling
     */
    bindSearchEvents: function() {
      const searchInput = document.getElementById('campus-search-input');
      const searchResults = document.getElementById('search-results-dropdown');
      const clearSearchBtn = document.getElementById('clear-search-btn');

      if (!searchInput || !searchResults) return;

      // Realtime search with debounce
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (clearSearchBtn) {
          clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        clearTimeout(AppState.searchTimeout);
        AppState.searchTimeout = setTimeout(() => {
          this.executeSearch(query);
        }, 120);
      });

      // Clear search option
      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          clearSearchBtn.style.display = 'none';
          searchResults.classList.remove('active');
          searchResults.innerHTML = '';
          searchInput.focus();
        });
      }

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
          searchResults.classList.remove('active');
        }
      });

      // Keyboard navigation (Arrow keys / Enter / Escape)
      searchInput.addEventListener('keydown', (e) => {
        const items = searchResults.querySelectorAll('.search-result-item');
        if (!items.length) return;

        let activeIndex = -1;
        items.forEach((item, idx) => {
          if (item.classList.contains('focused')) activeIndex = idx;
        });

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (activeIndex < items.length - 1) {
            if (activeIndex >= 0) items[activeIndex].classList.remove('focused');
            items[activeIndex + 1].classList.add('focused');
            items[activeIndex + 1].scrollIntoView({ block: 'nearest' });
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (activeIndex > 0) {
            items[activeIndex].classList.remove('focused');
            items[activeIndex - 1].classList.add('focused');
            items[activeIndex - 1].scrollIntoView({ block: 'nearest' });
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (activeIndex >= 0 && items[activeIndex]) {
            items[activeIndex].click();
          } else if (items.length > 0) {
            items[0].click();
          }
        } else if (e.key === 'Escape') {
          searchResults.classList.remove('active');
        }
      });
    },

    /**
     * Execute search query and render autocomplete suggestions
     */
    executeSearch: function(query) {
      const searchResults = document.getElementById('search-results-dropdown');
      if (!searchResults) return;

      if (!query || query.length === 0) {
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        return;
      }

      const results = window.CampusSearch.search(query);
      searchResults.classList.add('active');

      if (results.length === 0) {
        searchResults.innerHTML = `
          <div class="search-empty-state">
            <div class="empty-icon">🔍</div>
            <p class="empty-title">No location found for "<strong>${escapeHtml(query)}</strong>"</p>
            <p class="empty-hint">Try searching for building blocks (e.g. "C-Block"), hostels ("Hostel A", "Iconic"), departments ("CSED"), or amenities ("Library", "COS", "ATM").</p>
          </div>
        `;
        return;
      }

      // Render deduplicated canonical results
      let html = `<div class="search-results-header">Matching Campus Destinations (${results.length})</div>`;
      html += `<div class="search-results-list">`;

      results.forEach((res, idx) => {
        const loc = res.location;
        const highlightedName = window.CampusSearch.highlight(loc.name, query);
        const matchNote = res.matchedOn ? `<span class="search-matched-on">Matched via ${res.matchedOn}</span>` : '';
        const badgeClass = this.getCategoryBadgeClass(loc.category);

        html += `
          <div class="search-result-item ${idx === 0 ? 'focused' : ''}" data-id="${loc.id}">
            <div class="search-result-badge ${badgeClass}">
              ${loc.category}
            </div>
            <div class="search-result-info">
              <div class="search-result-name">${highlightedName}</div>
              <div class="search-result-sub">${loc.block || loc.subcategory || ''} ${matchNote}</div>
            </div>
            <div class="search-result-arrow">→</div>
          </div>
        `;
      });

      html += `</div>`;
      searchResults.innerHTML = html;

      // Click on autocomplete suggestion
      searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          this.selectLocation(id, true);
          searchResults.classList.remove('active');
          document.getElementById('campus-search-input').value = '';
          const clearBtn = document.getElementById('clear-search-btn');
          if (clearBtn) clearBtn.style.display = 'none';
        });
      });
    },

    /**
     * Helper to get CSS class for category badge
     */
    getCategoryBadgeClass: function(category) {
      switch (category) {
        case 'Academic Blocks': return 'badge-academic';
        case 'Hostels': return 'badge-hostels';
        case 'Libraries': return 'badge-libraries';
        case 'Food Courts and Cafes': return 'badge-food';
        case 'Sports Facilities': return 'badge-sports';
        case 'Administrative Buildings': return 'badge-admin';
        case 'Other Campus Facilities': return 'badge-facilities';
        default: return 'badge-facilities';
      }
    },

    /**
     * Render quick navigation shortcuts
     */
    renderQuickNavShortcuts: function() {
      const container = document.getElementById('quick-nav-container');
      if (!container) return;

      const quickLocs = window.CampusLocations.getQuickNav();
      let html = '';

      quickLocs.slice(0, 8).forEach(loc => {
        const badgeClass = this.getCategoryBadgeClass(loc.category);
        html += `
          <button class="quick-nav-chip" data-id="${loc.id}">
            <span class="chip-dot ${badgeClass}"></span>
            <span class="chip-label">${loc.name.split('(')[0].trim()}</span>
          </button>
        `;
      });

      container.innerHTML = html;

      container.querySelectorAll('.quick-nav-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.selectLocation(id, true);
        });
      });
    },

    /**
     * Category Filter Tabs (7 standard categories)
     */
    bindCategoryTabs: function() {
      const tabs = document.querySelectorAll('.category-filter-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const category = tab.getAttribute('data-category');
          AppState.activeCategory = category;

          window.CampusMap.filterCategory(category);
          this.renderLocationList();
        });
      });
    },

    /**
     * Render Location Cards in Explore Tab
     */
    renderLocationList: function() {
      const listContainer = document.getElementById('locations-card-list');
      if (!listContainer) return;

      const locations = window.CampusLocations.getByCategory(AppState.activeCategory);

      if (locations.length === 0) {
        listContainer.innerHTML = `<div class="empty-state-notice">No locations found in this category.</div>`;
        return;
      }

      let html = '';
      locations.forEach(loc => {
        const isFav = window.CampusStorage.isFavourite(loc.id);
        const isSelected = loc.id === AppState.selectedLocationId;
        const badgeClass = this.getCategoryBadgeClass(loc.category);

        html += `
          <div class="location-card ${isSelected ? 'selected' : ''}" data-id="${loc.id}">
            <div class="card-header">
              <span class="card-category ${badgeClass}">
                ${loc.category} &bull; ${loc.subcategory || ''}
              </span>
              <button class="card-fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from saved' : 'Save location'}" data-fav-id="${loc.id}">
                ${isFav ? '★' : '☆'}
              </button>
            </div>
            <h3 class="card-title">${loc.name}</h3>
            <p class="card-desc">${loc.description.substring(0, 110)}...</p>
            <div class="card-footer">
              <span class="card-block-badge">📍 ${loc.block || 'TIET Campus'}</span>
              <div class="card-actions">
                <button class="card-btn-action nav-to" title="Navigate here" data-nav-id="${loc.id}">Directions</button>
              </div>
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;

      // Bind events
      listContainer.querySelectorAll('.location-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.card-fav-btn') || e.target.closest('.card-btn-action')) return;
          const id = card.getAttribute('data-id');
          this.selectLocation(id, true);
        });
      });

      listContainer.querySelectorAll('.card-fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-fav-id');
          const newStatus = window.CampusStorage.toggleFavourite(id);
          btn.innerHTML = newStatus ? '★' : '☆';
          btn.classList.toggle('active', newStatus);
          this.renderSavedList();
        });
      });

      listContainer.querySelectorAll('.nav-to').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-nav-id');
          this.startNavigationTo(id);
        });
      });
    },

    /**
     * Select and highlight a location
     */
    selectLocation: function(locationId, focusMap = true) {
      const loc = window.CampusLocations.getById(locationId);
      if (!loc) return;

      AppState.selectedLocationId = locationId;
      window.CampusStorage.addRecent(locationId);

      if (focusMap) {
        window.CampusMap.selectLocation(locationId, true);
      }

      document.querySelectorAll('.location-card').forEach(card => {
        card.classList.toggle('selected', card.getAttribute('data-id') === locationId);
      });

      this.renderLocationDetailsPanel(loc);
      history.replaceState(null, null, `#${locationId}`);
    },

    /**
     * Render Details Panel Card with all required fields
     */
    renderLocationDetailsPanel: function(loc) {
      const panel = document.getElementById('location-details-panel');
      if (!panel) return;

      const isFav = window.CampusStorage.isFavourite(loc.id);
      const nearbyLocs = window.CampusLocations.getNearbyLocations(loc.id, 4);
      const badgeClass = this.getCategoryBadgeClass(loc.category);

      let sublocationsHtml = '';
      if (Array.isArray(loc.sublocations) && loc.sublocations.length > 0) {
        sublocationsHtml = `
          <div class="detail-section">
            <h4 class="section-title">Departments & Rooms Inside</h4>
            <div class="sublocation-tags">
              ${loc.sublocations.map(s => `<span class="sublocation-tag">${s.name} ${s.code ? `(${s.code})` : ''}</span>`).join('')}
            </div>
          </div>
        `;
      }

      let amenitiesHtml = '';
      if (Array.isArray(loc.facilities) && loc.facilities.length > 0) {
        amenitiesHtml = `
          <div class="detail-section">
            <h4 class="section-title">Verified Facilities</h4>
            <div class="amenity-badges">
              ${loc.facilities.map(f => `<span class="amenity-badge">✓ ${f}</span>`).join('')}
            </div>
          </div>
        `;
      }

      let nearbyHtml = '';
      if (nearbyLocs.length > 0) {
        nearbyHtml = `
          <div class="detail-section">
            <h4 class="section-title">Nearby Facilities</h4>
            <div class="nearby-items-list">
              ${nearbyLocs.map(nb => `
                <div class="nearby-item" data-id="${nb.id}">
                  <span class="nearby-name">${nb.name}</span>
                  <span class="nearby-dist">${nb.distanceMeters}m away</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      let hoursHtml = '';
      if (loc.openingHours) {
        hoursHtml = `
          <div class="detail-section">
            <h4 class="section-title">Timings & Access</h4>
            <div class="hours-text">🕒 ${loc.openingHours}</div>
          </div>
        `;
      }

      panel.innerHTML = `
        <div class="details-panel-inner">
          <div class="panel-header">
            <div class="panel-badge ${badgeClass}">
              ${loc.category} &bull; ${loc.subcategory || ''}
            </div>
            <button class="panel-close-btn" id="close-panel-btn" title="Close Panel">&times;</button>
          </div>

          <h2 class="panel-title">${loc.name}</h2>
          <div class="panel-block-info">📍 ${loc.block || 'TIET Patiala Campus'}</div>

          <p class="panel-description">${loc.description}</p>

          <div class="panel-primary-actions">
            <button class="panel-btn navigate-btn" id="panel-navigate-btn">
              <span>🧭 Navigate Here</span>
            </button>
            <button class="panel-btn start-from-btn" id="panel-start-from-btn">
              <span>📍 Directions From Here</span>
            </button>
            <button class="panel-btn fav-btn ${isFav ? 'active' : ''}" id="panel-fav-btn">
              <span>${isFav ? '★ Saved to Favourites' : '☆ Save Location'}</span>
            </button>
          </div>

          ${sublocationsHtml}
          ${amenitiesHtml}
          ${hoursHtml}
          ${nearbyHtml}

          <div class="panel-meta-info">
            <small>Canonical ID: <code>${loc.id}</code> &bull; CampusRoutes Verified</small>
          </div>
        </div>
      `;

      panel.classList.add('open');

      document.getElementById('close-panel-btn').addEventListener('click', () => {
        panel.classList.remove('open');
        window.CampusMap.clearSelection();
      });

      document.getElementById('panel-navigate-btn').addEventListener('click', () => {
        this.startNavigationTo(loc.id);
      });

      document.getElementById('panel-start-from-btn').addEventListener('click', () => {
        this.startNavigationFrom(loc.id);
      });

      const favBtn = document.getElementById('panel-fav-btn');
      favBtn.addEventListener('click', () => {
        const newStatus = window.CampusStorage.toggleFavourite(loc.id);
        favBtn.classList.toggle('active', newStatus);
        favBtn.innerHTML = `<span>${newStatus ? '★ Saved to Favourites' : '☆ Save Location'}</span>`;
        this.renderLocationList();
        this.renderSavedList();
      });

      panel.querySelectorAll('.nearby-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          this.selectLocation(id, true);
        });
      });
    },

    /**
     * Start navigation with destination preselected
     */
    startNavigationTo: function(destinationId) {
      this.switchTab('routes');
      const destSelect = document.getElementById('route-dest-select');
      if (destSelect) {
        destSelect.value = destinationId;
        AppState.routeDestId = destinationId;
      }

      const startSelect = document.getElementById('route-start-select');
      if (startSelect && !startSelect.value) {
        startSelect.value = 'main-gate';
        AppState.routeStartId = 'main-gate';
      }

      this.triggerRouteCalculation();
    },

    /**
     * Start navigation with start location preselected
     */
    startNavigationFrom: function(startId) {
      this.switchTab('routes');
      const startSelect = document.getElementById('route-start-select');
      if (startSelect) {
        startSelect.value = startId;
        AppState.routeStartId = startId;
      }
    },

    /**
     * Populate Route Planner Dropdowns
     */
    populateRouteDropdowns: function() {
      const startSelect = document.getElementById('route-start-select');
      const destSelect = document.getElementById('route-dest-select');
      if (!startSelect || !destSelect) return;

      const locations = window.CampusLocations.getAll();
      const categories = window.CampusLocations.getCategories().filter(c => c !== 'All');

      let optionsHtml = '<option value="">-- Choose a location --</option>';

      categories.forEach(cat => {
        const catLocs = locations.filter(l => l.category === cat);
        if (catLocs.length > 0) {
          optionsHtml += `<optgroup label="${cat}">`;
          catLocs.forEach(l => {
            optionsHtml += `<option value="${l.id}">${l.name}</option>`;
          });
          optionsHtml += `</optgroup>`;
        }
      });

      startSelect.innerHTML = optionsHtml;
      destSelect.innerHTML = optionsHtml;

      startSelect.value = 'main-gate';
      destSelect.value = 'nava-nalanda-library';
      AppState.routeStartId = 'main-gate';
      AppState.routeDestId = 'nava-nalanda-library';
    },

    /**
     * Route Planner Event Handlers
     */
    bindRoutePlanner: function() {
      const startSelect = document.getElementById('route-start-select');
      const destSelect = document.getElementById('route-dest-select');
      const swapBtn = document.getElementById('route-swap-btn');
      const calcBtn = document.getElementById('route-calc-btn');
      const clearBtn = document.getElementById('route-clear-btn');

      if (startSelect) {
        startSelect.addEventListener('change', (e) => {
          AppState.routeStartId = e.target.value;
          this.triggerRouteCalculation();
        });
      }

      if (destSelect) {
        destSelect.addEventListener('change', (e) => {
          AppState.routeDestId = e.target.value;
          this.triggerRouteCalculation();
        });
      }

      if (swapBtn) {
        swapBtn.addEventListener('click', () => {
          const temp = startSelect.value;
          startSelect.value = destSelect.value;
          destSelect.value = temp;

          AppState.routeStartId = startSelect.value;
          AppState.routeDestId = destSelect.value;

          this.triggerRouteCalculation();
        });
      }

      if (calcBtn) {
        calcBtn.addEventListener('click', () => {
          this.triggerRouteCalculation();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          window.CampusMap.clearRoute();
          AppState.currentRouteData = null;
          const summaryCard = document.getElementById('route-summary-card');
          if (summaryCard) summaryCard.style.display = 'none';
        });
      }

      // Popular Campus Routes Presets
      document.querySelectorAll('.route-preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const start = chip.getAttribute('data-start');
          const dest = chip.getAttribute('data-dest');
          if (start && dest) {
            startSelect.value = start;
            destSelect.value = dest;
            AppState.routeStartId = start;
            AppState.routeDestId = dest;
            this.triggerRouteCalculation();
          }
        });
      });
    },

    /**
     * Execute Dijkstra Route Calculation and render Primary vs Alternative Routes
     */
    triggerRouteCalculation: function() {
      const startId = AppState.routeStartId;
      const destId = AppState.routeDestId;
      const summaryCard = document.getElementById('route-summary-card');

      if (!startId || !destId) {
        if (summaryCard) summaryCard.style.display = 'none';
        return;
      }

      if (startId === destId) {
        if (summaryCard) {
          summaryCard.style.display = 'block';
          summaryCard.innerHTML = `
            <div class="route-error-state">
              Starting point and destination are the same location!
            </div>
          `;
        }
        window.CampusMap.clearRoute();
        return;
      }

      const routeResult = window.CampusRouting.findRoute(startId, destId);

      if (!routeResult || !routeResult.available) {
        if (summaryCard) {
          summaryCard.style.display = 'block';
          summaryCard.innerHTML = `
            <div class="route-error-state">
              ${routeResult ? routeResult.message : 'Unable to find a valid pathway route between these destinations.'}
            </div>
          `;
        }
        window.CampusMap.clearRoute();
        return;
      }

      AppState.currentRouteData = routeResult;
      AppState.activeRouteVariant = 'primary';

      this.renderRouteDisplay();
    },

    /**
     * Render the active route (primary or alternative)
     */
    renderRouteDisplay: function() {
      const summaryCard = document.getElementById('route-summary-card');
      const routeResult = AppState.currentRouteData;
      if (!routeResult || !summaryCard) return;

      const isAlt = AppState.activeRouteVariant === 'alternative';
      const activeRoute = isAlt && routeResult.alternativeRoute ? routeResult.alternativeRoute : routeResult.primaryRoute;

      // Draw polyline on map
      window.CampusMap.drawRoute(activeRoute, isAlt);

      summaryCard.style.display = 'block';

      const startLoc = window.CampusLocations.getById(routeResult.startId);
      const destLoc = window.CampusLocations.getById(routeResult.destId);

      // Alternative Route Selector Switcher
      let altSwitcherHtml = '';
      if (routeResult.alternativeRoute) {
        altSwitcherHtml = `
          <div class="route-variant-switcher">
            <button class="variant-pill-btn ${!isAlt ? 'active' : ''}" id="btn-route-primary">
              ⚡ Direct (${routeResult.primaryRoute.distanceMeters}m &bull; ${routeResult.primaryRoute.durationMinutes} min)
            </button>
            <button class="variant-pill-btn ${isAlt ? 'active' : ''}" id="btn-route-alt">
              🌿 Scenic Path (${routeResult.alternativeRoute.distanceMeters}m &bull; ${routeResult.alternativeRoute.durationMinutes} min)
            </button>
          </div>
        `;
      }

      let stepsHtml = '';
      activeRoute.steps.forEach((s) => {
        let icon = '🚶';
        if (s.type === 'start') icon = '🟢';
        else if (s.type === 'end') icon = '🏁';
        else if (s.landmark) icon = '📍';

        stepsHtml += `
          <li class="route-step-item">
            <span class="step-icon">${icon}</span>
            <span class="step-text">${s.text}</span>
          </li>
        `;
      });

      summaryCard.innerHTML = `
        ${altSwitcherHtml}
        <div class="route-metrics-bar">
          <div class="metric-block">
            <span class="metric-label">Walking Distance</span>
            <span class="metric-value">${activeRoute.distanceMeters} meters</span>
          </div>
          <div class="metric-block">
            <span class="metric-label">Estimated Walking Time</span>
            <span class="metric-value">~${activeRoute.durationMinutes} min</span>
          </div>
        </div>

        <div class="route-direction-summary">
          <strong>From:</strong> ${startLoc.name}<br>
          <strong>To:</strong> ${destLoc.name}
        </div>

        <div class="route-steps-container">
          <div class="steps-heading">Step-by-Step Pathway Directions (${activeRoute.name}):</div>
          <ul class="route-steps-list">
            ${stepsHtml}
          </ul>
        </div>
      `;

      // Bind alternative route tabs
      if (routeResult.alternativeRoute) {
        const btnPrimary = document.getElementById('btn-route-primary');
        const btnAlt = document.getElementById('btn-route-alt');

        if (btnPrimary) {
          btnPrimary.addEventListener('click', () => {
            AppState.activeRouteVariant = 'primary';
            this.renderRouteDisplay();
          });
        }
        if (btnAlt) {
          btnAlt.addEventListener('click', () => {
            AppState.activeRouteVariant = 'alternative';
            this.renderRouteDisplay();
          });
        }
      }
    },

    /**
     * Switch Sidebar Tabs
     */
    bindNavigationTabs: function() {
      const navBtns = document.querySelectorAll('.nav-tab-btn');
      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          this.switchTab(tabId);
        });
      });
    },

    switchTab: function(tabId) {
      AppState.activeTab = tabId;

      document.querySelectorAll('.nav-tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
      });

      document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.toggle('active', panel.getAttribute('id') === `tab-panel-${tabId}`);
      });

      if (tabId === 'saved') {
        this.renderSavedList();
      }

      window.CampusMap.invalidateSize();
    },

    /**
     * Render Favourites and Recent Searches in Saved Tab
     */
    renderSavedList: function() {
      const favsContainer = document.getElementById('saved-favourites-list');
      const recentsContainer = document.getElementById('saved-recents-list');

      // 1. Favourites
      if (favsContainer) {
        const favIds = window.CampusStorage.getFavourites();
        const favLocs = favIds.map(id => window.CampusLocations.getById(id)).filter(Boolean);

        if (favLocs.length === 0) {
          favsContainer.innerHTML = `<div class="empty-list-notice">No favourite locations saved yet. Click the star on any location card to save it here!</div>`;
        } else {
          let html = '';
          favLocs.forEach(loc => {
            const badgeClass = this.getCategoryBadgeClass(loc.category);
            html += `
              <div class="saved-item-row" data-id="${loc.id}">
                <div class="saved-item-info">
                  <div class="saved-name">${loc.name}</div>
                  <div class="saved-sub"><span class="badge-dot ${badgeClass}"></span> ${loc.category} &bull; ${loc.block || ''}</div>
                </div>
                <div class="saved-item-actions">
                  <button class="saved-action-btn view-btn" title="View on map" data-view-id="${loc.id}">View</button>
                  <button class="saved-action-btn remove-btn" title="Remove" data-remove-id="${loc.id}">&times;</button>
                </div>
              </div>
            `;
          });
          favsContainer.innerHTML = html;

          favsContainer.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-view-id');
              this.selectLocation(id, true);
            });
          });

          favsContainer.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.getAttribute('data-remove-id');
              window.CampusStorage.toggleFavourite(id);
              this.renderSavedList();
              this.renderLocationList();
            });
          });
        }
      }

      // 2. Recents
      if (recentsContainer) {
        const recentIds = window.CampusStorage.getRecents();
        const recentLocs = recentIds.map(id => window.CampusLocations.getById(id)).filter(Boolean);

        if (recentLocs.length === 0) {
          recentsContainer.innerHTML = `<div class="empty-list-notice">No recently visited locations.</div>`;
        } else {
          let html = '';
          recentLocs.forEach(loc => {
            html += `
              <div class="saved-item-row recent" data-id="${loc.id}">
                <div class="saved-item-info">
                  <div class="saved-name">${loc.name}</div>
                  <div class="saved-sub">${loc.block || loc.category}</div>
                </div>
                <button class="saved-action-btn view-btn" data-view-id="${loc.id}">Go</button>
              </div>
            `;
          });
          recentsContainer.innerHTML = html;

          recentsContainer.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-view-id');
              this.selectLocation(id, true);
            });
          });
        }
      }
    },

    /**
     * Official 2D Map Modal Events
     */
    bindModalEvents: function() {
      const openModalBtn = document.getElementById('open-official-map-btn');
      const modal = document.getElementById('official-map-modal');
      const closeModalBtn = document.getElementById('close-modal-btn');
      const resetViewBtn = document.getElementById('reset-map-view-btn');

      if (openModalBtn && modal) {
        openModalBtn.addEventListener('click', () => {
          modal.classList.add('open');
        });
      }

      if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
          modal.classList.remove('open');
        });
      }

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('open');
          }
        });
      }

      if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => {
          window.CampusMap.resetView();
        });
      }

      // Mobile Drawer Toggle
      const mobileToggleBtn = document.getElementById('mobile-drawer-toggle');
      const sidebar = document.querySelector('.app-sidebar');
      if (mobileToggleBtn && sidebar) {
        mobileToggleBtn.addEventListener('click', () => {
          sidebar.classList.toggle('mobile-open');
        });
      }
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.CampusApp.init();
  });
})(window);

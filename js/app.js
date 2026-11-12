/**
 * js/app.js
 * Main application controller wiring CampusLocations, CampusSearch, CampusRouting,
 * CampusMap, and CampusStorage with accessible UI state management.
 */

(function () {
    'use strict';

    const state = {
        activeCategory: 'all',
        selectedLocation: null,
        originLocation: null,
        destinationLocation: null,
        currentRoute: null,
        useAlternativeRoute: false
    };

    let searchDebounceTimer = null;

    function debounce(fn, delayMs) {
        return function (...args) {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => fn.apply(this, args), delayMs);
        };
    }

    function announceStatus(message, isError = false) {
        const banner = document.getElementById('status-banner');
        if (!banner) return;
        banner.textContent = message;
        banner.className = `status-banner ${isError ? 'status-banner--error' : 'status-banner--info'}`;
        banner.hidden = !message;
    }

    function refreshMarkers() {
        const allLocations = CampusLocations.getAll();
        CampusMap.renderMarkers(allLocations, {
            category: state.activeCategory,
            selectedId: state.selectedLocation ? state.selectedLocation.id : null,
            onSelect: (loc) => selectLocation(loc, true)
        });
    }

    function renderSearchResults(containerEl, matches, query, targetMode = 'explore') {
        if (!containerEl) return;
        containerEl.innerHTML = '';

        if (!matches.length) {
            const empty = document.createElement('div');
            empty.className = 'search-empty-state';
            empty.setAttribute('role', 'status');
            empty.textContent = query
                ? `No campus location matched "${query}". Try a block letter, hostel name, or landmark.`
                : 'No locations found in this category.';
            containerEl.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();
        matches.forEach((loc) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'search-result-item';
            btn.setAttribute('role', 'option');
            btn.dataset.locationId = loc.id;
            btn.dataset.targetMode = targetMode;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'search-result-title';
            titleSpan.innerHTML = CampusSearch.highlightMatch(loc.name, query);

            const metaSpan = document.createElement('span');
            metaSpan.className = 'search-result-meta';
            const catMeta = CampusMap.CATEGORY_META[loc.category];
            metaSpan.textContent = catMeta ? catMeta.label : loc.category;

            btn.appendChild(titleSpan);
            btn.appendChild(metaSpan);
            fragment.appendChild(btn);
        });

        containerEl.appendChild(fragment);
    }

    function selectLocation(loc, focusMap = true) {
        if (!loc) return;
        state.selectedLocation = loc;
        CampusStorage.addRecentId(loc.id);
        refreshMarkers();

        if (focusMap) {
            CampusMap.focusLocation(loc, 18);
        }

        renderLocationCard(loc);
        announceStatus(`Selected ${loc.name}.`);
    }

    function renderLocationCard(loc) {
        const card = document.getElementById('location-detail-card');
        if (!card) return;

        if (!loc) {
            card.hidden = true;
            return;
        }

        const titleEl = card.querySelector('[data-field="name"]');
        const badgeEl = card.querySelector('[data-field="category"]');
        const descEl = card.querySelector('[data-field="description"]');
        const hoursEl = card.querySelector('[data-field="hours"]');
        const favBtn = card.querySelector('[data-action="toggle-favorite"]');

        if (titleEl) titleEl.textContent = loc.name;
        if (badgeEl) {
            const meta = CampusMap.CATEGORY_META[loc.category];
            badgeEl.textContent = meta ? `${meta.symbol} · ${meta.label}` : loc.category;
        }
        if (descEl) descEl.textContent = loc.description;
        if (hoursEl) hoursEl.textContent = `Hours: ${loc.hours}`;
        if (favBtn) {
            const saved = CampusStorage.isFavorite(loc.id);
            favBtn.setAttribute('aria-pressed', String(saved));
            favBtn.textContent = saved ? '★ Saved' : '☆ Save';
        }

        card.hidden = false;
    }

    function computeAndRenderRoute() {
        const summaryEl = document.getElementById('route-summary');
        const stepsListEl = document.getElementById('route-steps-list');
        const altBtn = document.getElementById('toggle-alt-route-btn');

        if (!state.originLocation || !state.destinationLocation) {
            return;
        }

        announceStatus('Calculating pedestrian route...');
        const result = CampusRouting.calculateRoute(state.originLocation, state.destinationLocation);

        if (!result.ok) {
            state.currentRoute = null;
            CampusMap.clearRoute();
            if (summaryEl) summaryEl.hidden = true;
            if (stepsListEl) stepsListEl.innerHTML = '';
            announceStatus(result.message, true);
            return;
        }

        state.currentRoute = result;
        state.useAlternativeRoute = false;

        CampusMap.drawRoute(result, { useAlternative: false });
        renderRouteDetails(result, false);

        if (altBtn) {
            altBtn.hidden = !result.alternative;
            altBtn.textContent = 'Show Alternative Path';
        }

        const active = result.primary;
        announceStatus(
            result.sameLocation
                ? `You are already at ${state.destinationLocation.name}.`
                : `Route ready: ${active.distanceMeters} meters, approx. ${active.durationMinutes} min walk.`
        );
    }

    function renderRouteDetails(routeResult, useAlt) {
        const summaryEl = document.getElementById('route-summary');
        const distEl = document.getElementById('route-distance');
        const timeEl = document.getElementById('route-duration');
        const stepsListEl = document.getElementById('route-steps-list');

        const active = useAlt && routeResult.alternative ? routeResult.alternative : routeResult.primary;

        if (distEl) distEl.textContent = `${active.distanceMeters} m`;
        if (timeEl) timeEl.textContent = `${active.durationMinutes} min walk`;
        if (summaryEl) summaryEl.hidden = false;

        if (stepsListEl) {
            stepsListEl.innerHTML = '';
            const frag = document.createDocumentFragment();
            active.steps.forEach((step) => {
                const li = document.createElement('li');
                li.className = `route-step route-step--${step.icon}`;

                const textSpan = document.createElement('span');
                textSpan.className = 'route-step-text';
                textSpan.textContent = step.instruction;

                li.appendChild(textSpan);

                if (step.distanceMeters > 0) {
                    const distSpan = document.createElement('span');
                    distSpan.className = 'route-step-dist';
                    distSpan.textContent = `${step.distanceMeters} m`;
                    li.appendChild(distSpan);
                }

                frag.appendChild(li);
            });
            stepsListEl.appendChild(frag);
        }
    }

    function clearNavigation() {
        state.originLocation = null;
        state.destinationLocation = null;
        state.currentRoute = null;
        state.useAlternativeRoute = false;

        const originInput = document.getElementById('origin-input');
        const destInput = document.getElementById('destination-input');
        const summaryEl = document.getElementById('route-summary');
        const stepsListEl = document.getElementById('route-steps-list');

        if (originInput) originInput.value = '';
        if (destInput) destInput.value = '';
        if (summaryEl) summaryEl.hidden = true;
        if (stepsListEl) stepsListEl.innerHTML = '';

        CampusMap.clearRoute();
        announceStatus('Route cleared.');
    }

    function bindEvents() {
        const exploreInput = document.getElementById('explore-search-input');
        const exploreResults = document.getElementById('explore-search-results');
        const originInput = document.getElementById('origin-input');
        const originResults = document.getElementById('origin-search-results');
        const destInput = document.getElementById('destination-input');
        const destResults = document.getElementById('destination-search-results');

        const handleExploreSearch = debounce(() => {
            const q = exploreInput ? exploreInput.value : '';
            const matches = CampusSearch.searchLocations(CampusLocations.getAll(), q, {
                category: state.activeCategory,
                limit: 12
            });
            renderSearchResults(exploreResults, matches, q, 'explore');
            if (exploreResults) exploreResults.hidden = false;
        }, 120);

        if (exploreInput) {
            exploreInput.addEventListener('input', handleExploreSearch);
            exploreInput.addEventListener('focus', handleExploreSearch);
        }

        const bindRouteSearchInput = (inputEl, resultsEl, mode) => {
            if (!inputEl || !resultsEl) return;
            const run = debounce(() => {
                const q = inputEl.value;
                const matches = CampusSearch.searchLocations(CampusLocations.getAll(), q, { limit: 8 });
                renderSearchResults(resultsEl, matches, q, mode);
                resultsEl.hidden = false;
            }, 120);
            inputEl.addEventListener('input', run);
            inputEl.addEventListener('focus', run);
        };

        bindRouteSearchInput(originInput, originResults, 'origin');
        bindRouteSearchInput(destInput, destResults, 'destination');

        document.addEventListener('click', (event) => {
            const item = event.target.closest('.search-result-item');
            if (item) {
                const loc = CampusLocations.getById(item.dataset.locationId);
                const mode = item.dataset.targetMode;
                if (!loc) return;

                if (mode === 'explore') {
                    if (exploreInput) exploreInput.value = loc.name;
                    if (exploreResults) exploreResults.hidden = true;
                    selectLocation(loc, true);
                } else if (mode === 'origin') {
                    state.originLocation = loc;
                    if (originInput) originInput.value = loc.name;
                    if (originResults) originResults.hidden = true;
                    computeAndRenderRoute();
                } else if (mode === 'destination') {
                    state.destinationLocation = loc;
                    if (destInput) destInput.value = loc.name;
                    if (destResults) destResults.hidden = true;
                    computeAndRenderRoute();
                }
                return;
            }

            if (!event.target.closest('.search-box-wrapper')) {
                [exploreResults, originResults, destResults].forEach((el) => {
                    if (el) el.hidden = true;
                });
            }
        });

        const filterBar = document.getElementById('category-filter-bar');
        if (filterBar) {
            filterBar.addEventListener('click', (event) => {
                const btn = event.target.closest('[data-category]');
                if (!btn) return;
                state.activeCategory = btn.dataset.category;

                filterBar.querySelectorAll('[data-category]').forEach((el) => {
                    const active = el === btn;
                    el.classList.toggle('is-active', active);
                    el.setAttribute('aria-pressed', String(active));
                });

                refreshMarkers();
                if (exploreInput && !exploreResults.hidden) {
                    handleExploreSearch();
                }
            });
        }

        const detailCard = document.getElementById('location-detail-card');
        if (detailCard) {
            detailCard.addEventListener('click', (event) => {
                const actionBtn = event.target.closest('[data-action]');
                if (!actionBtn || !state.selectedLocation) return;
                const action = actionBtn.dataset.action;

                if (action === 'set-origin') {
                    state.originLocation = state.selectedLocation;
                    if (originInput) originInput.value = state.selectedLocation.name;
                    computeAndRenderRoute();
                } else if (action === 'set-destination') {
                    state.destinationLocation = state.selectedLocation;
                    if (destInput) destInput.value = state.selectedLocation.name;
                    computeAndRenderRoute();
                } else if (action === 'toggle-favorite') {
                    CampusStorage.toggleFavoriteId(state.selectedLocation.id);
                    renderLocationCard(state.selectedLocation);
                } else if (action === 'close-card') {
                    state.selectedLocation = null;
                    renderLocationCard(null);
                    refreshMarkers();
                }
            });
        }

        const swapBtn = document.getElementById('swap-locations-btn');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                const temp = state.originLocation;
                state.originLocation = state.destinationLocation;
                state.destinationLocation = temp;
                if (originInput) originInput.value = state.originLocation ? state.originLocation.name : '';
                if (destInput) destInput.value = state.destinationLocation ? state.destinationLocation.name : '';
                computeAndRenderRoute();
            });
        }

        const clearBtn = document.getElementById('clear-route-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearNavigation);
        }

        const resetViewBtn = document.getElementById('reset-map-view-btn');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => CampusMap.resetView());
        }

        const altBtn = document.getElementById('toggle-alt-route-btn');
        if (altBtn) {
            altBtn.addEventListener('click', () => {
                if (!state.currentRoute || !state.currentRoute.alternative) return;
                state.useAlternativeRoute = !state.useAlternativeRoute;
                CampusMap.drawRoute(state.currentRoute, { useAlternative: state.useAlternativeRoute });
                renderRouteDetails(state.currentRoute, state.useAlternativeRoute);
                altBtn.textContent = state.useAlternativeRoute
                    ? 'Show Shortest Path'
                    : 'Show Alternative Path';
            });
        }

        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            const savedTheme = CampusStorage.getTheme();
            document.documentElement.setAttribute('data-theme', savedTheme);
            themeBtn.addEventListener('click', () => {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                CampusStorage.setTheme(next);
            });
        }
    }

    function init() {
        try {
            CampusMap.initMap('campus-map', {
                onTileError: (msg) => announceStatus(msg, true)
            });
            refreshMarkers();
            bindEvents();
        } catch (err) {
            announceStatus(`Map initialization error: ${err.message}`, true);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

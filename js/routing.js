/**
 * CampusOrbit – Smart Campus Navigation Platform
 * Thapar Institute of Engineering & Technology (TIET), Patiala
 * "Your Campus, Within Reach"
 * 
 * Route Planning & Pathway Navigation Engine
 * 
 * Features:
 * - Real campus pathway Dijkstra shortest path (Primary Route)
 * - Edge-penalized alternative route discovery (Alternative Route)
 * - Walking distance in meters and walking time in minutes
 * - Intermediate landmark waypoints
 */

(function(window) {
  'use strict';

  // Average walking pace on campus: ~80 meters per minute (~4.8 km/h)
  const WALKING_METERS_PER_MIN = 80;

  class PriorityQueue {
    constructor() {
      this.elements = [];
    }
    push(item, priority) {
      this.elements.push({ item, priority });
      this.elements.sort((a, b) => a.priority - b.priority);
    }
    pop() {
      return this.elements.shift();
    }
    isEmpty() {
      return this.elements.length === 0;
    }
  }

  // Core Dijkstra solver supporting edge penalties
  function solveDijkstra(nodes, adjacency, startKey, destKey, penalizedEdges = null) {
    const distances = {};
    const previous = {};
    const pq = new PriorityQueue();

    distances[startKey] = 0;
    pq.push(startKey, 0);
    const visited = new Set();

    while (!pq.isEmpty()) {
      const { item: current } = pq.pop();

      if (current === destKey) {
        break;
      }

      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = adjacency[current] || {};
      for (const [neighbor, rawWeight] of Object.entries(neighbors)) {
        let weight = rawWeight;
        if (penalizedEdges) {
          const edgeKey1 = `${current}->${neighbor}`;
          const edgeKey2 = `${neighbor}->${current}`;
          if (penalizedEdges.has(edgeKey1) || penalizedEdges.has(edgeKey2)) {
            weight = rawWeight * 2.2; // Penalize traversed edges
          }
        }

        const tentativeDist = distances[current] + weight;
        if (distances[neighbor] === undefined || tentativeDist < distances[neighbor]) {
          distances[neighbor] = tentativeDist;
          previous[neighbor] = current;
          pq.push(neighbor, tentativeDist);
        }
      }
    }

    if (distances[destKey] === undefined) {
      return null;
    }

    // Reconstruct path
    const pathKeys = [];
    let curr = destKey;
    while (curr) {
      pathKeys.unshift(curr);
      curr = previous[curr];
    }

    // Calculate real unpenalized physical distance
    let actualDistance = 0;
    for (let i = 0; i < pathKeys.length - 1; i++) {
      actualDistance += (adjacency[pathKeys[i]][pathKeys[i + 1]] || 0);
    }

    return {
      keys: pathKeys,
      coordinates: pathKeys.map(k => nodes[k]),
      distance: Math.round(actualDistance)
    };
  }

  window.CampusRouting = {
    /**
     * Calculate primary and alternative routes between two canonical location IDs
     * @param {string} startId
     * @param {string} destId
     * @returns {Object|null}
     */
    findRoute: function(startId, destId) {
      if (!startId || !destId || startId === destId) {
        return null;
      }

      const graphData = window.CampusGraphData;
      if (!graphData || !graphData.nodes || !graphData.adjacency) {
        console.error('[CampusOrbit] Pathway graph data not loaded!');
        return null;
      }

      const locStartKey = graphData.locationNodes[startId];
      const locDestKey = graphData.locationNodes[destId];

      if (!locStartKey || !locDestKey) {
        console.warn('[CampusOrbit] Location node missing:', startId, destId);
        return null;
      }

      const nodes = graphData.nodes;
      const adjacency = graphData.adjacency;

      // 1. Calculate Primary Route (Shortest Path)
      const primaryResult = solveDijkstra(nodes, adjacency, locStartKey, locDestKey);
      if (!primaryResult) {
        return {
          available: false,
          message: 'No verified campus pathway is currently configured between these two points.'
        };
      }

      const primaryDistance = primaryResult.distance;
      const primaryDuration = Math.max(1, Math.round(primaryDistance / WALKING_METERS_PER_MIN));
      const primarySteps = this.generateSteps(startId, destId, primaryResult.coordinates, primaryDistance, 'Direct Pathway');

      const primaryRoute = {
        name: 'Direct Pathway',
        distanceMeters: primaryDistance,
        durationMinutes: primaryDuration,
        coordinates: primaryResult.coordinates,
        steps: primarySteps
      };

      // 2. Discover Alternative Route via edge penalization
      const penalizedEdges = new Set();
      for (let i = 0; i < primaryResult.keys.length - 1; i++) {
        penalizedEdges.add(`${primaryResult.keys[i]}->${primaryResult.keys[i + 1]}`);
      }

      const altResult = solveDijkstra(nodes, adjacency, locStartKey, locDestKey, penalizedEdges);
      let alternativeRoute = null;

      if (altResult && altResult.distance <= primaryDistance * 1.45) {
        // Measure node overlap between primary and alternative paths
        const setPrimary = new Set(primaryResult.keys);
        const overlapCount = altResult.keys.filter(k => setPrimary.has(k)).length;
        const overlapRatio = overlapCount / primaryResult.keys.length;

        // If paths are sufficiently distinct (differ by at least 15m and have distinct branches)
        if (overlapRatio < 0.85 && Math.abs(altResult.distance - primaryDistance) >= 12) {
          const altDistance = altResult.distance;
          const altDuration = Math.max(1, Math.round(altDistance / WALKING_METERS_PER_MIN));
          const altSteps = this.generateSteps(startId, destId, altResult.coordinates, altDistance, 'Alternative Scenic Path');

          alternativeRoute = {
            name: 'Alternative Scenic Path',
            distanceMeters: altDistance,
            durationMinutes: altDuration,
            coordinates: altResult.coordinates,
            steps: altSteps
          };
        }
      }

      return {
        available: true,
        startId: startId,
        destId: destId,
        primaryRoute: primaryRoute,
        alternativeRoute: alternativeRoute,
        activeRoute: primaryRoute
      };
    },

    /**
     * Generate step-by-step navigation directions identifying landmarks passed
     */
    generateSteps: function(startId, destId, pathCoords, totalDist, routeType) {
      const startLoc = window.CampusLocations.getById(startId);
      const destLoc = window.CampusLocations.getById(destId);
      const allLocs = window.CampusLocations.getAll();

      const steps = [];

      steps.push({
        type: 'start',
        text: `Depart from ${startLoc.name} (${startLoc.block || startLoc.category})`,
        distance: 0
      });

      // Scan for landmarks within 38m of pathway
      const passedLandmarks = [];
      const threshold = 38;

      for (let i = 2; i < pathCoords.length - 2; i += 3) {
        const pt = pathCoords[i];
        for (const loc of allLocs) {
          if (loc.id === startId || loc.id === destId) continue;
          if (passedLandmarks.some(l => l.id === loc.id)) continue;

          const dist = window.CampusLocations.calculateDistance(pt, loc.coordinates);
          if (dist <= threshold) {
            passedLandmarks.push({
              id: loc.id,
              name: loc.name,
              category: loc.category
            });
            break;
          }
        }
      }

      if (passedLandmarks.length > 0) {
        passedLandmarks.forEach((lm) => {
          steps.push({
            type: 'waypoint',
            text: `Walk along the paved avenue past ${lm.name}`,
            landmark: lm.name,
            category: lm.category
          });
        });
      } else {
        steps.push({
          type: 'waypoint',
          text: `Follow the main pedestrian pathway directly towards ${destLoc.block || 'destination zone'}`
        });
      }

      steps.push({
        type: 'end',
        text: `Arrive at ${destLoc.name}`,
        distance: totalDist
      });

      return steps;
    }
  };
})(window);

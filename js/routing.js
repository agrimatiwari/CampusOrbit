/**
 * js/routing.js
 * Pedestrian pathway routing engine using Dijkstra's shortest-path algorithm.
 * Enforces strict pathway-only routing without synthetic straight-line fallbacks.
 */

(function (global) {
    'use strict';

    const WALK_SPEED_MPS = 1.35;
    const MAX_SNAP_DISTANCE_M = 350;

    let cachedGraph = null;
    let cachedGraphRef = null;

    function haversineMeters(coordA, coordB) {
        if (!Array.isArray(coordA) || !Array.isArray(coordB)) return Infinity;
        const [lat1, lon1] = coordA;
        const [lat2, lon2] = coordB;
        if (lat1 === lat2 && lon1 === lon2) return 0;

        const R = 6371000;
        const toRad = (deg) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function getNodeCoord(node) {
        if (Array.isArray(node) && node.length >= 2 && Number.isFinite(node[0]) && Number.isFinite(node[1])) {
            return [node[0], node[1]];
        }
        if (node && Number.isFinite(node.lat) && Number.isFinite(node.lng)) {
            return [node.lat, node.lng];
        }
        return null;
    }

    function getAdjacencyGraph(graphSource) {
        const source = graphSource || global.CampusGraph;
        if (!source || !source.nodes || !source.edges) {
            return null;
        }
        if (cachedGraph && cachedGraphRef === source) {
            return cachedGraph;
        }

        const coords = new Map();
        const adj = new Map();

        for (const [nodeId, rawNode] of Object.entries(source.nodes)) {
            const coord = getNodeCoord(rawNode);
            if (coord) {
                coords.set(nodeId, coord);
                adj.set(nodeId, []);
            }
        }

        const seenEdges = new Set();
        for (const edge of source.edges) {
            if (!Array.isArray(edge) || edge.length < 2) continue;
            const [u, v] = edge;
            if (!coords.has(u) || !coords.has(v) || u === v) continue;

            const edgeKey = u < v ? `${u}|${v}` : `${v}|${u}`;
            if (seenEdges.has(edgeKey)) continue;
            seenEdges.add(edgeKey);

            const weight = haversineMeters(coords.get(u), coords.get(v));
            adj.get(u).push({ to: v, weight });
            adj.get(v).push({ to: u, weight });
        }

        cachedGraph = { coords, adj };
        cachedGraphRef = source;
        return cachedGraph;
    }

    function resolveGraphNode(location, graph) {
        if (!location || !graph) return null;

        if (location.nearestNode && graph.coords.has(location.nearestNode)) {
            const nodeCoord = graph.coords.get(location.nearestNode);
            const snapDist = haversineMeters([location.lat, location.lng], nodeCoord);
            if (snapDist <= MAX_SNAP_DISTANCE_M) {
                return { nodeId: location.nearestNode, snapDistance: snapDist };
            }
        }

        if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
            return null;
        }

        let bestNode = null;
        let bestDist = Infinity;

        for (const [nodeId, coord] of graph.coords.entries()) {
            const dist = haversineMeters([location.lat, location.lng], coord);
            if (dist < bestDist) {
                bestDist = dist;
                bestNode = nodeId;
            }
        }

        if (!bestNode || bestDist > MAX_SNAP_DISTANCE_M) {
            return null;
        }

        return { nodeId: bestNode, snapDistance: bestDist };
    }

    function runDijkstra(graph, startNodeId, endNodeId, penalizedEdges = new Set()) {
        if (!graph.adj.has(startNodeId) || !graph.adj.has(endNodeId)) {
            return null;
        }

        const dist = new Map();
        const prev = new Map();
        const visited = new Set();

        for (const nodeId of graph.adj.keys()) {
            dist.set(nodeId, Infinity);
        }
        dist.set(startNodeId, 0);

        while (visited.size < graph.adj.size) {
            let current = null;
            let smallestDist = Infinity;

            for (const [nodeId, d] of dist.entries()) {
                if (!visited.has(nodeId) && d < smallestDist) {
                    smallestDist = d;
                    current = nodeId;
                }
            }

            if (current === null || current === endNodeId) {
                break;
            }

            visited.add(current);

            for (const neighbor of graph.adj.get(current)) {
                if (visited.has(neighbor.to)) continue;
                const edgeKey = current < neighbor.to
                    ? `${current}|${neighbor.to}`
                    : `${neighbor.to}|${current}`;
                const penalty = penalizedEdges.has(edgeKey) ? 2.5 : 1.0;
                const candidateDist = smallestDist + neighbor.weight * penalty;

                if (candidateDist < dist.get(neighbor.to)) {
                    dist.set(neighbor.to, candidateDist);
                    prev.set(neighbor.to, current);
                }
            }
        }

        if (!Number.isFinite(dist.get(endNodeId))) {
            return null;
        }

        const pathNodes = [];
        let cursor = endNodeId;
        while (cursor !== undefined) {
            pathNodes.unshift(cursor);
            if (cursor === startNodeId) break;
            cursor = prev.get(cursor);
        }

        if (pathNodes[0] !== startNodeId) {
            return null;
        }

        let trueDistance = 0;
        for (let i = 0; i < pathNodes.length - 1; i++) {
            const a = graph.coords.get(pathNodes[i]);
            const b = graph.coords.get(pathNodes[i + 1]);
            trueDistance += haversineMeters(a, b);
        }

        return { pathNodes, distance: trueDistance };
    }

    function getBearing(coordA, coordB) {
        const toRad = (d) => (d * Math.PI) / 180;
        const toDeg = (r) => (r * 180) / Math.PI;
        const lat1 = toRad(coordA[0]);
        const lat2 = toRad(coordB[0]);
        const dLon = toRad(coordB[1] - coordA[1]);

        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                  Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    function bearingToCardinal(deg) {
        const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
        return dirs[Math.round(deg / 45) % 8];
    }

    function formatNodeLabel(nodeId) {
        return nodeId
            .replace(/^N_/, '')
            .replace(/_/g, ' ')
            .replace(/\w/g, (c) => c.toUpperCase());
    }

    function buildTurnByTurnSteps(coordinates, pathNodes, originName, destName) {
        if (coordinates.length < 2) {
            return [{
                instruction: `You are already at ${destName}.`,
                distanceMeters: 0,
                icon: 'arrive'
            }];
        }

        const steps = [];
        let prevBearing = getBearing(coordinates[0], coordinates[1]);

        steps.push({
            instruction: `Start at ${originName} and head ${bearingToCardinal(prevBearing)} along the campus walkway`,
            distanceMeters: Math.round(haversineMeters(coordinates[0], coordinates[1])),
            icon: 'start'
        });

        for (let i = 1; i < coordinates.length - 1; i++) {
            const segDist = Math.round(haversineMeters(coordinates[i], coordinates[i + 1]));
            if (segDist < 5) continue;

            const currBearing = getBearing(coordinates[i], coordinates[i + 1]);
            const diff = ((currBearing - prevBearing + 540) % 360) - 180;
            const nodeRef = pathNodes[i] ? ` near ${formatNodeLabel(pathNodes[i])}` : '';

            let turnText = `Continue straight${nodeRef}`;
            let icon = 'straight';

            if (diff > 35 && diff <= 135) {
                turnText = `Turn right${nodeRef}`;
                icon = 'right';
            } else if (diff < -35 && diff >= -135) {
                turnText = `Turn left${nodeRef}`;
                icon = 'left';
            } else if (Math.abs(diff) > 135) {
                turnText = `Turn back${nodeRef}`;
                icon = 'uturn';
            }

            steps.push({
                instruction: turnText,
                distanceMeters: segDist,
                icon
            });

            prevBearing = currBearing;
        }

        steps.push({
            instruction: `Arrive at ${destName}`,
            distanceMeters: 0,
            icon: 'arrive'
        });

        return steps;
    }

    function deduplicateCoordinates(coords) {
        const clean = [];
        for (const pt of coords) {
            if (!Array.isArray(pt) || pt.length < 2) continue;
            if (clean.length === 0 || haversineMeters(clean[clean.length - 1], pt) > 0.5) {
                clean.push([pt[0], pt[1]]);
            }
        }
        return clean;
    }

    function calculateRoute(origin, destination, graphSource) {
        if (!origin || !destination) {
            return {
                ok: false,
                error: 'INVALID_INPUT',
                message: 'Please select both a valid starting location and a destination.'
            };
        }

        if (origin.id && destination.id && origin.id === destination.id) {
            return {
                ok: true,
                sameLocation: true,
                primary: {
                    coordinates: [[origin.lat, origin.lng]],
                    pathNodes: origin.nearestNode ? [origin.nearestNode] : [],
                    distanceMeters: 0,
                    durationMinutes: 0,
                    steps: [{
                        instruction: `You are already at ${destination.name}.`,
                        distanceMeters: 0,
                        icon: 'arrive'
                    }]
                },
                alternative: null
            };
        }

        const graph = getAdjacencyGraph(graphSource);
        if (!graph || graph.coords.size === 0) {
            return {
                ok: false,
                error: 'GRAPH_UNAVAILABLE',
                message: 'Campus pathway network data is unavailable.'
            };
        }

        const startSnap = resolveGraphNode(origin, graph);
        const endSnap = resolveGraphNode(destination, graph);

        if (!startSnap || !endSnap) {
            return {
                ok: false,
                error: 'UNCONNECTED_LOCATION',
                message: 'One or both selected locations are not connected to a mapped pedestrian pathway.'
            };
        }

        const primaryResult = runDijkstra(graph, startSnap.nodeId, endSnap.nodeId);
        if (!primaryResult) {
            return {
                ok: false,
                error: 'NO_PATH',
                message: `No connected pedestrian pathway was found between ${origin.name} and ${destination.name}.`
            };
        }

        const buildRoutePackage = (result) => {
            const rawCoords = [
                [origin.lat, origin.lng],
                ...result.pathNodes.map((id) => graph.coords.get(id)),
                [destination.lat, destination.lng]
            ];
            const coordinates = deduplicateCoordinates(rawCoords);

            let totalMeters = 0;
            for (let i = 0; i < coordinates.length - 1; i++) {
                totalMeters += haversineMeters(coordinates[i], coordinates[i + 1]);
            }
            totalMeters = Math.round(totalMeters);

            const durationMinutes = Math.max(1, Math.round(totalMeters / (WALK_SPEED_MPS * 60)));
            const steps = buildTurnByTurnSteps(
                coordinates,
                result.pathNodes,
                origin.name,
                destination.name
            );

            return {
                pathNodes: result.pathNodes,
                coordinates,
                distanceMeters: totalMeters,
                durationMinutes,
                steps
            };
        };

        const primary = buildRoutePackage(primaryResult);

        let alternative = null;
        if (primaryResult.pathNodes.length > 2) {
            const penalized = new Set();
            for (let i = 0; i < primaryResult.pathNodes.length - 1; i++) {
                const u = primaryResult.pathNodes[i];
                const v = primaryResult.pathNodes[i + 1];
                penalized.add(u < v ? `${u}|${v}` : `${v}|${u}`);
            }

            const altResult = runDijkstra(graph, startSnap.nodeId, endSnap.nodeId, penalized);
            if (altResult) {
                const sameNodes =
                    altResult.pathNodes.length === primaryResult.pathNodes.length &&
                    altResult.pathNodes.every((n, idx) => n === primaryResult.pathNodes[idx]);

                if (!sameNodes) {
                    alternative = buildRoutePackage(altResult);
                }
            }
        }

        return {
            ok: true,
            sameLocation: false,
            primary,
            alternative
        };
    }

    const CampusRouting = {
        calculateRoute,
        haversineMeters,
        resolveGraphNode,
        getAdjacencyGraph,
        resetCache() {
            cachedGraph = null;
            cachedGraphRef = null;
        }
    };

    global.CampusRouting = CampusRouting;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CampusRouting;
    }
})(typeof window !== 'undefined' ? window : globalThis);

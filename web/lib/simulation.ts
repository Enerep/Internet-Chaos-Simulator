import type {
  EdgeState,
  NetworkEdge,
  NetworkModel,
  RouteResult,
  SimulationRun,
  SimulationSnapshot,
  SimulationStats,
  TrafficDemand,
} from './model.ts';

interface AllocationResult {
  edgeStates: Record<string, EdgeState>;
  routes: RouteResult[];
}

interface PathResult {
  edgeIds: string[];
  latencyMs: number;
}

const FRAME_SECONDS = [0, 3, 8, 15, 23, 30];

function makeEmptyLoads(edges: NetworkEdge[]): Record<string, number> {
  return Object.fromEntries(edges.map((edge) => [edge.id, 0]));
}

function shortestAvailablePath(
  model: NetworkModel,
  demand: TrafficDemand,
  loads: Record<string, number>,
  failedIds: Set<string>,
): PathResult | null {
  const distances = new Map<string, number>([[demand.from, 0]]);
  const previous = new Map<string, { nodeId: string; edgeId: string }>();
  const unvisited = new Set(model.nodes.map((node) => node.id));

  while (unvisited.size > 0) {
    let current: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (distance < currentDistance) {
        current = nodeId;
        currentDistance = distance;
      }
    }

    if (!current || currentDistance === Number.POSITIVE_INFINITY) break;
    if (current === demand.to) break;
    unvisited.delete(current);

    for (const edge of model.edges) {
      if (failedIds.has(edge.id)) continue;
      const neighbor = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (!neighbor || !unvisited.has(neighbor)) continue;

      const utilization = loads[edge.id] / edge.capacityGbps;
      const congestionPenalty = 1 + Math.pow(Math.max(0, utilization - 0.5), 2) * 5;
      const candidate = currentDistance + edge.latencyMs * congestionPenalty;

      if (candidate < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor, candidate);
        previous.set(neighbor, { nodeId: current, edgeId: edge.id });
      }
    }
  }

  if (!previous.has(demand.to)) return null;

  const edgeIds: string[] = [];
  let cursor = demand.to;
  while (cursor !== demand.from) {
    const step = previous.get(cursor);
    if (!step) return null;
    edgeIds.unshift(step.edgeId);
    cursor = step.nodeId;
  }

  const latencyMs = edgeIds.reduce(
    (total, edgeId) => total + (model.edges.find((edge) => edge.id === edgeId)?.latencyMs ?? 0),
    0,
  );
  return { edgeIds, latencyMs };
}

function allocateTraffic(
  model: NetworkModel,
  failedEdgeIds: string[],
  baselineRoutes?: RouteResult[],
): AllocationResult {
  const loads = makeEmptyLoads(model.edges);
  const failedIds = new Set(failedEdgeIds);
  const routes: RouteResult[] = [];

  const demands = [...model.demands].sort((a, b) => b.demandGbps - a.demandGbps);
  for (const demand of demands) {
    const path = shortestAvailablePath(model, demand, loads, failedIds);
    const baselinePath = baselineRoutes?.find((route) => route.demandId === demand.id)?.edgeIds ?? [];

    if (!path) {
      routes.push({
        demandId: demand.id,
        edgeIds: [],
        latencyMs: null,
        deliveredGbps: 0,
        rerouted: baselineRoutes !== undefined,
      });
      continue;
    }

    for (const edgeId of path.edgeIds) loads[edgeId] += demand.demandGbps;
    routes.push({
      demandId: demand.id,
      edgeIds: path.edgeIds,
      latencyMs: path.latencyMs,
      deliveredGbps: demand.demandGbps,
      rerouted: baselineRoutes !== undefined && path.edgeIds.join('|') !== baselinePath.join('|'),
    });
  }

  const reroutedEdges = new Set(
    routes.filter((route) => route.rerouted).flatMap((route) => route.edgeIds),
  );
  const edgeStates = Object.fromEntries(
    model.edges.map((edge) => {
      const utilization = failedIds.has(edge.id) ? 0 : loads[edge.id] / edge.capacityGbps;
      let status: EdgeState['status'] = reroutedEdges.has(edge.id) ? 'rerouted' : 'healthy';
      if (utilization >= 1) status = 'overloaded';
      else if (utilization >= 0.8) status = 'congested';
      if (failedIds.has(edge.id)) status = 'failed';

      return [edge.id, {
        edgeId: edge.id,
        loadGbps: failedIds.has(edge.id) ? 0 : loads[edge.id],
        utilization,
        status,
      }];
    }),
  );

  return { edgeStates, routes };
}

function calculateStats(
  model: NetworkModel,
  allocation: AllocationResult,
  baselineLatencyMs: number,
): SimulationStats {
  const totalDemand = model.demands.reduce((sum, demand) => sum + demand.demandGbps, 0);
  const totalDelivered = allocation.routes.reduce((sum, route) => sum + route.deliveredGbps, 0);
  const weightedLatency = allocation.routes.reduce(
    (sum, route) => sum + (route.latencyMs ?? 0) * route.deliveredGbps,
    0,
  );
  const meanLatencyMs = totalDelivered > 0 ? weightedLatency / totalDelivered : 0;

  const affectedPopulationMillions = model.demands.reduce((sum, demand) => {
    const route = allocation.routes.find((candidate) => candidate.demandId === demand.id);
    return sum + (route?.rerouted || route?.deliveredGbps === 0 ? demand.usersMillions : 0);
  }, 0);

  return {
    meanLatencyMs,
    latencyIncreaseMs: Math.max(0, meanLatencyMs - baselineLatencyMs),
    availabilityPercent: totalDemand > 0 ? (totalDelivered / totalDemand) * 100 : 100,
    reroutedRoutes: allocation.routes.filter((route) => route.rerouted).length,
    overloadedEdges: Object.values(allocation.edgeStates).filter((edge) => edge.utilization >= 0.8).length,
    affectedPopulationMillions,
  };
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function makeFrame(
  model: NetworkModel,
  baseline: SimulationSnapshot,
  final: SimulationSnapshot,
  failedEdgeIds: string[],
  second: number,
): SimulationSnapshot {
  const progressBySecond: Record<number, number> = { 0: 0, 3: 0.08, 8: 0.42, 15: 0.76, 23: 0.96, 30: 1 };
  const progress = progressBySecond[second];
  const failed = new Set(failedEdgeIds);

  const edgeStates = Object.fromEntries(model.edges.map((edge) => {
    const start = baseline.edgeStates[edge.id];
    const end = final.edgeStates[edge.id];
    if (failed.has(edge.id)) return [edge.id, { ...end, status: 'failed' as const }];

    const loadGbps = interpolate(start.loadGbps, end.loadGbps, progress);
    const utilization = loadGbps / edge.capacityGbps;
    let status = progress < 0.18 ? start.status : end.status;
    if (utilization >= 1) status = 'overloaded';
    else if (utilization >= 0.8) status = 'congested';
    return [edge.id, { edgeId: edge.id, loadGbps, utilization, status }];
  }));

  const phase = second === 0 ? 'Physical failure'
    : second <= 3 ? 'Routes withdrawing'
      : second <= 8 ? 'Traffic rerouting'
        : second <= 15 ? 'Backup paths loading'
          : second <= 23 ? 'Congestion propagating'
            : 'New equilibrium';

  const eventBySecond: Record<number, string[]> = {
    0: ['Three Singapore cable systems stop forwarding traffic.'],
    3: ['Five modeled paths are withdrawn from the routing table.'],
    8: ['Indonesia traffic shifts south through the Jakarta–Perth backup.'],
    15: ['Tokyo and Sydney absorb traffic previously crossing Singapore.'],
    23: ['The Tokyo–Mumbai reserve exceeds its modeled safe load.'],
    30: ['The network stabilizes with higher latency and two hot corridors.'],
  };

  return {
    second,
    phase,
    edgeStates,
    routes: progress < 0.18 ? baseline.routes : final.routes,
    stats: {
      meanLatencyMs: interpolate(baseline.stats.meanLatencyMs, final.stats.meanLatencyMs, progress),
      latencyIncreaseMs: interpolate(0, final.stats.latencyIncreaseMs, progress),
      availabilityPercent: interpolate(100, final.stats.availabilityPercent, progress),
      reroutedRoutes: Math.round(interpolate(0, final.stats.reroutedRoutes, progress)),
      overloadedEdges: Object.values(edgeStates).filter((edge) => edge.utilization >= 0.8).length,
      affectedPopulationMillions: interpolate(0, final.stats.affectedPopulationMillions, progress),
    },
    events: eventBySecond[second],
  };
}

export function simulateFailure(model: NetworkModel, failedEdgeIds: string[]): SimulationRun {
  const baselineAllocation = allocateTraffic(model, []);
  const baselineStats = calculateStats(model, baselineAllocation, 0);
  baselineStats.latencyIncreaseMs = 0;
  baselineStats.affectedPopulationMillions = 0;

  const baseline: SimulationSnapshot = {
    second: 0,
    phase: 'Baseline',
    edgeStates: baselineAllocation.edgeStates,
    routes: baselineAllocation.routes,
    stats: baselineStats,
    events: ['All modeled routes are available.'],
  };

  const finalAllocation = allocateTraffic(model, failedEdgeIds, baseline.routes);
  const finalStats = calculateStats(model, finalAllocation, baselineStats.meanLatencyMs);
  const final: SimulationSnapshot = {
    second: 30,
    phase: 'New equilibrium',
    edgeStates: finalAllocation.edgeStates,
    routes: finalAllocation.routes,
    stats: finalStats,
    events: ['The network has reached a new modeled equilibrium.'],
  };

  const frames = FRAME_SECONDS.map((second) =>
    makeFrame(model, baseline, final, failedEdgeIds, second),
  );
  return { failedEdgeIds, baseline, final, frames };
}

export function snapshotAt(run: SimulationRun, second: number): SimulationSnapshot {
  const clampedSecond = Math.max(0, Math.min(30, Math.round(second)));
  let closest = run.frames[0];
  for (const frame of run.frames) {
    if (frame.second <= clampedSecond) closest = frame;
  }
  return { ...closest, second: clampedSecond };
}

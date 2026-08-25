export type Position = [longitude: number, latitude: number];

export type NodeKind = 'metro' | 'cloud-region' | 'ixp' | 'landing-station';
export type EdgeKind = 'submarine' | 'terrestrial' | 'cloud-backbone';
export type EdgeStatus = 'healthy' | 'rerouted' | 'congested' | 'overloaded' | 'failed';

export interface NetworkNode {
  id: string;
  name: string;
  country: string;
  kind: NodeKind;
  coordinates: Position;
}

export interface NetworkEdge {
  id: string;
  name: string;
  from: string;
  to: string;
  kind: EdgeKind;
  latencyMs: number;
  capacityGbps: number;
  path: Position[];
  confidence: 'observed' | 'inferred' | 'synthetic';
}

export interface TrafficDemand {
  id: string;
  label: string;
  from: string;
  to: string;
  demandGbps: number;
  usersMillions: number;
}

export interface NetworkModel {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  demands: TrafficDemand[];
}

export interface EdgeState {
  edgeId: string;
  loadGbps: number;
  utilization: number;
  status: EdgeStatus;
}

export interface RouteResult {
  demandId: string;
  edgeIds: string[];
  latencyMs: number | null;
  deliveredGbps: number;
  rerouted: boolean;
}

export interface SimulationStats {
  meanLatencyMs: number;
  latencyIncreaseMs: number;
  availabilityPercent: number;
  reroutedRoutes: number;
  overloadedEdges: number;
  affectedPopulationMillions: number;
}

export interface SimulationSnapshot {
  second: number;
  phase: string;
  edgeStates: Record<string, EdgeState>;
  routes: RouteResult[];
  stats: SimulationStats;
  events: string[];
}

export interface SimulationRun {
  failedEdgeIds: string[];
  baseline: SimulationSnapshot;
  final: SimulationSnapshot;
  frames: SimulationSnapshot[];
}

import type { NetworkModel } from './model.ts';

export const SINGAPORE_FAILURE_IDS = [
  'sea-me-we-3',
  'asia-submarine-express',
  'australia-singapore',
];

export const demoNetwork: NetworkModel = {
  nodes: [
    { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', kind: 'metro', coordinates: [106.85, -6.18] },
    { id: 'singapore', name: 'Singapore', country: 'Singapore', kind: 'landing-station', coordinates: [103.82, 1.28] },
    { id: 'hong-kong', name: 'Hong Kong', country: 'China', kind: 'ixp', coordinates: [114.17, 22.32] },
    { id: 'tokyo', name: 'Tokyo', country: 'Japan', kind: 'cloud-region', coordinates: [139.69, 35.68] },
    { id: 'sydney', name: 'Sydney', country: 'Australia', kind: 'cloud-region', coordinates: [151.21, -33.87] },
    { id: 'mumbai', name: 'Mumbai', country: 'India', kind: 'cloud-region', coordinates: [72.88, 19.08] },
    { id: 'dubai', name: 'Dubai', country: 'UAE', kind: 'ixp', coordinates: [55.27, 25.2] },
    { id: 'frankfurt', name: 'Frankfurt', country: 'Germany', kind: 'cloud-region', coordinates: [8.68, 50.11] },
    { id: 'seattle', name: 'Seattle', country: 'United States', kind: 'cloud-region', coordinates: [-122.33, 47.61] },
  ],
  edges: [
    {
      id: 'java-access', name: 'Java–Singapore terrestrial', from: 'jakarta', to: 'singapore', kind: 'terrestrial',
      latencyMs: 14, capacityGbps: 420, confidence: 'synthetic', path: [[106.85, -6.18], [104.7, -2.1], [103.82, 1.28]],
    },
    {
      id: 'sea-me-we-3', name: 'SEA-ME-WE westbound', from: 'singapore', to: 'mumbai', kind: 'submarine',
      latencyMs: 52, capacityGbps: 280, confidence: 'inferred', path: [[103.82, 1.28], [95.1, 5.4], [84.2, 7.2], [72.88, 19.08]],
    },
    {
      id: 'asia-submarine-express', name: 'Asia Submarine Express', from: 'singapore', to: 'hong-kong', kind: 'submarine',
      latencyMs: 31, capacityGbps: 260, confidence: 'inferred', path: [[103.82, 1.28], [110.2, 10.3], [114.17, 22.32]],
    },
    {
      id: 'australia-singapore', name: 'Australia–Singapore Cable', from: 'singapore', to: 'sydney', kind: 'submarine',
      latencyMs: 71, capacityGbps: 230, confidence: 'inferred', path: [[103.82, 1.28], [112.4, -13.5], [115.86, -31.95], [151.21, -33.87]],
    },
    {
      id: 'jakarta-perth', name: 'Jakarta–Perth backup', from: 'jakarta', to: 'sydney', kind: 'submarine',
      latencyMs: 91, capacityGbps: 170, confidence: 'synthetic', path: [[106.85, -6.18], [113.4, -21.2], [115.86, -31.95], [151.21, -33.87]],
    },
    {
      id: 'hk-tokyo', name: 'Hong Kong–Tokyo', from: 'hong-kong', to: 'tokyo', kind: 'submarine',
      latencyMs: 43, capacityGbps: 320, confidence: 'synthetic', path: [[114.17, 22.32], [126.4, 27.6], [139.69, 35.68]],
    },
    {
      id: 'hk-mumbai', name: 'Hong Kong–Mumbai backup', from: 'hong-kong', to: 'mumbai', kind: 'submarine',
      latencyMs: 79, capacityGbps: 155, confidence: 'synthetic', path: [[114.17, 22.32], [98.4, 11.1], [82.3, 12.7], [72.88, 19.08]],
    },
    {
      id: 'sydney-tokyo', name: 'Sydney–Tokyo backbone', from: 'sydney', to: 'tokyo', kind: 'submarine',
      latencyMs: 104, capacityGbps: 245, confidence: 'synthetic', path: [[151.21, -33.87], [153.2, -12.1], [145.4, 15.3], [139.69, 35.68]],
    },
    {
      id: 'tokyo-mumbai', name: 'Tokyo–Mumbai reserve', from: 'tokyo', to: 'mumbai', kind: 'cloud-backbone',
      latencyMs: 102, capacityGbps: 145, confidence: 'synthetic', path: [[139.69, 35.68], [119.1, 30.2], [94.2, 25.1], [72.88, 19.08]],
    },
    {
      id: 'mumbai-dubai', name: 'India–Middle East corridor', from: 'mumbai', to: 'dubai', kind: 'submarine',
      latencyMs: 41, capacityGbps: 310, confidence: 'synthetic', path: [[72.88, 19.08], [64.2, 21.8], [55.27, 25.2]],
    },
    {
      id: 'dubai-frankfurt', name: 'Dubai–Frankfurt corridor', from: 'dubai', to: 'frankfurt', kind: 'terrestrial',
      latencyMs: 64, capacityGbps: 390, confidence: 'synthetic', path: [[55.27, 25.2], [36.1, 35.4], [22.2, 42.1], [8.68, 50.11]],
    },
    {
      id: 'tokyo-seattle', name: 'Japan–US transpacific', from: 'tokyo', to: 'seattle', kind: 'submarine',
      latencyMs: 91, capacityGbps: 420, confidence: 'synthetic', path: [[139.69, 35.68], [170, 42], [-155, 46], [-122.33, 47.61]],
    },
    {
      id: 'seattle-frankfurt', name: 'US–Europe backbone', from: 'seattle', to: 'frankfurt', kind: 'cloud-backbone',
      latencyMs: 133, capacityGbps: 360, confidence: 'synthetic', path: [[-122.33, 47.61], [-86, 49], [-38, 52], [8.68, 50.11]],
    },
  ],
  demands: [
    { id: 'id-eu', label: 'Indonesia → Europe', from: 'jakarta', to: 'frankfurt', demandGbps: 145, usersMillions: 23.4 },
    { id: 'id-jp', label: 'Indonesia → Japan', from: 'jakarta', to: 'tokyo', demandGbps: 108, usersMillions: 17.2 },
    { id: 'sg-au', label: 'Singapore → Australia', from: 'singapore', to: 'sydney', demandGbps: 76, usersMillions: 5.8 },
    { id: 'sg-eu', label: 'Singapore → Europe', from: 'singapore', to: 'frankfurt', demandGbps: 91, usersMillions: 7.1 },
    { id: 'sg-us', label: 'Singapore → US West', from: 'singapore', to: 'seattle', demandGbps: 82, usersMillions: 6.4 },
    { id: 'au-eu', label: 'Australia → Europe', from: 'sydney', to: 'frankfurt', demandGbps: 69, usersMillions: 4.9 },
  ],
};

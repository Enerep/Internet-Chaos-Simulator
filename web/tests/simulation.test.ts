import assert from 'node:assert/strict';
import test from 'node:test';
import { demoNetwork, SINGAPORE_FAILURE_IDS } from '../lib/demo-network.ts';
import { simulateFailure, snapshotAt } from '../lib/simulation.ts';

test('the baseline delivers all modeled traffic', () => {
  const run = simulateFailure(demoNetwork, SINGAPORE_FAILURE_IDS);

  assert.equal(run.baseline.stats.availabilityPercent, 100);
  assert.equal(run.baseline.routes.every((route) => route.deliveredGbps > 0), true);
  assert.equal(
    Object.values(run.baseline.edgeStates).every((edge) => edge.status !== 'failed'),
    true,
  );
});

test('the Singapore scenario removes all selected cable edges', () => {
  const run = simulateFailure(demoNetwork, SINGAPORE_FAILURE_IDS);

  for (const edgeId of SINGAPORE_FAILURE_IDS) {
    assert.equal(run.final.edgeStates[edgeId].status, 'failed');
    assert.equal(run.final.edgeStates[edgeId].loadGbps, 0);
  }
});

test('the failure creates rerouting, impact, and additional latency', () => {
  const run = simulateFailure(demoNetwork, SINGAPORE_FAILURE_IDS);

  assert.ok(run.final.stats.reroutedRoutes > 0);
  assert.ok(run.final.stats.affectedPopulationMillions > 0);
  assert.ok(run.final.stats.meanLatencyMs > run.baseline.stats.meanLatencyMs);
  assert.ok(run.final.stats.latencyIncreaseMs > 0);
});

test('identical inputs produce identical simulation frames', () => {
  const first = simulateFailure(demoNetwork, SINGAPORE_FAILURE_IDS);
  const second = simulateFailure(demoNetwork, SINGAPORE_FAILURE_IDS);

  assert.deepEqual(first, second);
});

test('timeline lookup clamps model time to its supported range', () => {
  const run = simulateFailure(demoNetwork, SINGAPORE_FAILURE_IDS);

  assert.equal(snapshotAt(run, -10).second, 0);
  assert.equal(snapshotAt(run, 99).second, 30);
  assert.equal(snapshotAt(run, 16).phase, 'Backup paths loading');
});

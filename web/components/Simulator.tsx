'use client';

import { useEffect, useMemo, useState } from 'react';
import { NetworkMap } from '@/components/NetworkMap.tsx';
import { demoNetwork, SINGAPORE_FAILURE_IDS } from '@/lib/demo-network.ts';
import { simulateFailure, snapshotAt } from '@/lib/simulation.ts';

const timelineEvents = [
  { second: 0, title: 'Physical failure', detail: 'Three cable systems go dark.' },
  { second: 3, title: 'Route withdrawal', detail: 'Unavailable paths are removed.' },
  { second: 8, title: 'Traffic shift', detail: 'Japan and Australia take more load.' },
  { second: 15, title: 'Congestion', detail: 'Reserve capacity begins to run hot.' },
  { second: 23, title: 'Cascade', detail: 'A backup corridor crosses 100% load.' },
  { second: 30, title: 'Equilibrium', detail: 'The model reaches a stable state.' },
];

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}

export function Simulator() {
  const run = useMemo(() => simulateFailure(demoNetwork, SINGAPORE_FAILURE_IDS), []);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [second, setSecond] = useState(0);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showHubs, setShowHubs] = useState(true);

  const snapshot = active ? snapshotAt(run, second) : run.baseline;
  const visibleEvents = active ? timelineEvents.filter((event) => event.second <= second).slice(-3).reverse() : [];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setSecond((current) => {
        if (current >= 30) {
          setPlaying(false);
          return 30;
        }
        return current + 1;
      });
    }, 280);
    return () => window.clearInterval(timer);
  }, [playing]);

  function startSimulation() {
    setActive(true);
    setSecond(0);
    setPlaying(true);
  }

  function resetSimulation() {
    setPlaying(false);
    setSecond(0);
    setActive(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Internet Chaos Simulator</span>
          <span className="alpha-tag">ALPHA</span>
        </div>
        <div className="model-status"><span /> Deterministic model · Southeast Asia demo</div>
      </header>

      <section className="workspace">
        <aside className="control-panel">
          <div className="panel-scroll">
            <p className="eyebrow">Failure laboratory</p>
            <h1>What breaks when the internet breaks?</h1>
            <p className="lede">Remove physical infrastructure and watch estimated traffic find a way around it.</p>

            <div className="scenario-card">
              <div className="scenario-number">01</div>
              <div>
                <p className="scenario-label">Selected scenario</p>
                <h2>Singapore cable cluster</h2>
                <p>Cut three modeled routes near the Malacca Strait.</p>
              </div>
            </div>

            <div className="asset-list" aria-label="Infrastructure selected for failure">
              {SINGAPORE_FAILURE_IDS.map((edgeId) => {
                const edge = demoNetwork.edges.find((candidate) => candidate.id === edgeId);
                return <div key={edgeId}><span className={active ? 'asset-light failed' : 'asset-light'} />{edge?.name}</div>;
              })}
            </div>

            {!active ? (
              <button className="simulate-button" type="button" onClick={startSimulation}>
                Simulate cable cuts <span aria-hidden="true">→</span>
              </button>
            ) : (
              <div className="simulation-actions">
                <button
                  className="play-button"
                  type="button"
                  onClick={() => {
                    if (second >= 30) {
                      setSecond(0);
                      setPlaying(true);
                    } else {
                      setPlaying((value) => !value);
                    }
                  }}
                >
                  {playing ? 'Pause' : second >= 30 ? 'Replay' : 'Continue'}
                </button>
                <button className="reset-button" type="button" onClick={resetSimulation}>Reset model</button>
              </div>
            )}

            <div className="assumption-note">
              <span>Model notice</span>
              This demo uses synthetic capacity and demand. It explains a plausible outcome, not a live prediction.
            </div>
          </div>

          <div className="baseline">
            <div><span>Mean latency</span><strong>{formatNumber(snapshot.stats.meanLatencyMs)} ms</strong></div>
            <div><span>Availability</span><strong>{formatNumber(snapshot.stats.availabilityPercent, 1)}%</strong></div>
            <div><span>Hot links</span><strong>{snapshot.stats.overloadedEdges}</strong></div>
          </div>
        </aside>

        <section className={`map-stage ${active ? 'is-active' : ''}`}>
          <NetworkMap model={demoNetwork} snapshot={snapshot} showTraffic={showTraffic} showHubs={showHubs} />

          <div className="map-heading">
            <span>{active ? `MODEL TIME / T+${second.toString().padStart(2, '0')}s` : 'LIVE MODEL / BASELINE'}</span>
            <strong>{active ? snapshot.phase : 'Asia-Pacific backbone'}</strong>
          </div>

          <div className="layer-controls" aria-label="Map layers">
            <span>Layers</span>
            <label><input type="checkbox" checked={showTraffic} onChange={(event) => setShowTraffic(event.target.checked)} /> Routes</label>
            <label><input type="checkbox" checked={showHubs} onChange={(event) => setShowHubs(event.target.checked)} /> Hubs</label>
          </div>

          {active && (
            <aside className="impact-panel" aria-live="polite">
              <p className="scenario-label">Estimated impact</p>
              <div className="impact-primary">
                <span>+{formatNumber(snapshot.stats.latencyIncreaseMs)} ms</span>
                <small>mean latency</small>
              </div>
              <div className="impact-grid">
                <div><strong>{snapshot.stats.reroutedRoutes}</strong><span>rerouted flows</span></div>
                <div><strong>{formatNumber(snapshot.stats.affectedPopulationMillions, 1)}M</strong><span>people affected</span></div>
              </div>
              <div className="event-feed">
                {visibleEvents.map((event) => (
                  <div key={event.second}>
                    <time>T+{event.second}s</time>
                    <p><strong>{event.title}</strong>{event.detail}</p>
                  </div>
                ))}
              </div>
            </aside>
          )}

          <div className="legend">
            <span><i className="legend-line healthy" /> Healthy</span>
            <span><i className="legend-line rerouted" /> Rerouted</span>
            <span><i className="legend-line overloaded" /> Overloaded / failed</span>
          </div>

          {active && (
            <div className="timeline-panel">
              <div className="timeline-copy"><span>{snapshot.phase}</span><strong>T+{second}s / 30s</strong></div>
              <input
                aria-label="Simulation time"
                type="range"
                min="0"
                max="30"
                value={second}
                onChange={(event) => { setSecond(Number(event.target.value)); setPlaying(false); }}
                style={{ '--timeline-progress': `${(second / 30) * 100}%` } as React.CSSProperties}
              />
              <div className="timeline-marks"><span>Failure</span><span>Rerouting</span><span>Congestion</span><span>Stable</span></div>
            </div>
          )}

          <div className="map-attribution">Map © OpenFreeMap · OpenStreetMap</div>
        </section>
      </section>
    </main>
  );
}

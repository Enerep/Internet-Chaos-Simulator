# Internet Chaos Simulator

An interactive failure laboratory for exploring what might happen when critical internet infrastructure goes offline.

The current vertical slice models a three-cable failure near Singapore. It shows estimated route withdrawal, traffic rerouting through Japan and Australia, rising latency, overloaded backup corridors, and the network settling into a new equilibrium over a 30-second model timeline.

> [!IMPORTANT]
> This is an explanatory model, not a live network monitor or an operational forecast. The demo topology, capacity, demand, and population effects are synthetic or inferred and are labeled accordingly.

## What works today

- Interactive MapLibre world map with modeled routes and network hubs
- Singapore three-cable failure scenario
- Deterministic shortest-path routing with congestion-aware costs
- Failed, rerouted, congested, and overloaded edge states
- Accelerated 30-second model timeline with manual scrubbing
- Estimated latency, availability, affected population, and hot-link metrics
- Clickable route inspection with load and confidence labels
- Responsive desktop and mobile layout
- Unit tests for determinism and core failure behavior
- Dependency lifecycle scripts disabled by default

## Quick start

Requirements:

- Node.js 24 LTS (the exact recommended version is in `web/.nvmrc`)
- npm 12.0.2
- No Conda or Python environment is required for the current application

```bash
cd web
nvm use
npm ci
npm run dev
```

Open `http://localhost:3000`.

Dependency lifecycle scripts are disabled in `web/.npmrc`. If a future dependency genuinely needs an installation script, review the package and exact version before changing that policy.

## Commands

Run these from `web/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local application |
| `npm test` | Run simulation tests with Node's built-in test runner |
| `npm run lint` | Check code quality |
| `npm run build` | Create the production build |
| `npm audit` | Check the locked dependency graph for advisories |
| `npm audit signatures` | Verify available npm registry signatures and provenance |

## Repository guide

```text
.
├── ARCHITECTURE.md          # Boundaries, data flow, algorithms, and roadmap
├── SECURITY.md              # Dependency and credential safety policy
├── README.md                # Product and contributor entry point
└── web/
    ├── app/                 # Route, metadata, and global styles
    ├── components/          # Simulator UI and MapLibre renderer
    ├── lib/                 # Domain model, demo topology, simulation engine
    ├── tests/               # Deterministic graph-engine tests
    └── public/              # Static assets
```

Read [ARCHITECTURE.md](./ARCHITECTURE.md) before changing the model. It explains why physical assets, logical routes, traffic demand, and presentation are kept separate.

## How the demo simulation works

1. Allocate each modeled traffic demand across the healthy graph.
2. Remove the selected failed cable edges.
3. Recompute available paths with Dijkstra's algorithm.
4. Increase route cost as an edge approaches modeled capacity.
5. Mark traffic that changed paths and edges that exceed safe utilization.
6. Interpolate baseline and final loads into six timeline phases.

The actual internet uses policy-driven BGP routing, private peering, carrier contracts, and proprietary traffic engineering. This simplified engine is intentionally understandable and deterministic. A later AS-level model can introduce commercial routing policy without coupling it to the UI.

## Data roadmap

The demo is deliberately self-contained. The next ingestion layer should add versioned snapshots from sources such as:

- OpenStreetMap or a properly licensed cable dataset for physical geometry
- PeeringDB for IXPs and facilities
- CAIDA for inferred autonomous-system relationships
- RIPE Atlas for latency calibration
- Official AWS, Azure, and Google Cloud region lists
- World Bank or ITU indicators for population and internet usage

Every normalized record should retain `source`, `sourceVersion`, `retrievedAt`, `license`, and `confidence`. Raw third-party data should not be committed until its redistribution terms are confirmed.

## Near-term milestones

1. Replace synthetic edges with a versioned, licensed topology snapshot.
2. Move simulation work into a Web Worker once the graph grows.
3. Add user-selected failures and shareable scenario URLs.
4. Add k-shortest and edge-disjoint route alternatives.
5. Calibrate latency and capacity ranges and show uncertainty bands.
6. Introduce optional AS-level routing policy.

## Next steps

The demo is ready to run. The next milestone depends on a few product decisions:

- Whether the project must remain commercially usable; this changes which cable datasets are acceptable.
- Whether realism or dramatic educational storytelling is the first priority.
- Whether the next scenario should focus on a country outage, a cloud-region outage, or another cable chokepoint.

## Later(Deploy to Vercel)

The web application is standard Next.js and does not require a custom Vercel build configuration.

1. Import this GitHub repository in Vercel.
2. Set **Root Directory** to `web`.
3. Keep the detected **Next.js** framework preset and default build settings.
4. Deploy.

Vercel provides the production hostname to the application automatically. Set `NEXT_PUBLIC_SITE_URL` only when you want social metadata to use a custom domain.

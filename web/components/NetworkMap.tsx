'use client';

import * as maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import type { FeatureCollection } from 'geojson';
import type { NetworkModel, SimulationSnapshot } from '@/lib/model.ts';

interface NetworkMapProps {
  model: NetworkModel;
  snapshot: SimulationSnapshot;
  showTraffic: boolean;
  showHubs: boolean;
}

function makeEdgeGeoJson(model: NetworkModel, snapshot: SimulationSnapshot): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: model.edges.map((edge) => {
      const state = snapshot.edgeStates[edge.id];
      return {
        type: 'Feature',
        properties: {
          id: edge.id,
          name: edge.name,
          status: state.status,
          utilization: state.utilization,
          utilizationLabel: `${Math.round(state.utilization * 100)}%`,
          loadLabel: `${Math.round(state.loadGbps)} Gbps`,
          confidence: edge.confidence,
        },
        geometry: { type: 'LineString', coordinates: edge.path },
      };
    }),
  };
}

const lineColor: maplibregl.ExpressionSpecification = [
  'match', ['get', 'status'],
  'failed', '#ff5e56',
  'overloaded', '#ff665f',
  'congested', '#ffb347',
  'rerouted', '#8f7dff',
  '#70ead5',
];

export function NetworkMap({ model, snapshot, showTraffic, showHubs }: NetworkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const edgeData = useMemo(() => makeEdgeGeoJson(model, snapshot), [model, snapshot]);
  const initialEdgeData = useRef(edgeData);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [103, 11],
      zoom: 2.15,
      minZoom: 1.4,
      maxZoom: 8,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('network-edges', { type: 'geojson', data: initialEdgeData.current });
      map.addLayer({
        id: 'edge-glow',
        type: 'line',
        source: 'network-edges',
        paint: {
          'line-color': lineColor,
          'line-opacity': 0.18,
          'line-width': ['interpolate', ['linear'], ['zoom'], 1, 5, 6, 11],
        },
      });
      map.addLayer({
        id: 'edge-lines',
        type: 'line',
        source: 'network-edges',
        paint: {
          'line-color': lineColor,
          'line-opacity': ['match', ['get', 'status'], 'failed', 1, 0.88],
          'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.4, 6, 3.2],
          'line-dasharray': ['match', ['get', 'status'], 'failed', ['literal', [1, 1]], ['literal', [2, 1.4]]],
        },
      });

      const hubData: FeatureCollection = {
        type: 'FeatureCollection',
        features: model.nodes.map((node) => ({
          type: 'Feature',
          properties: { id: node.id, name: node.name, kind: node.kind },
          geometry: { type: 'Point', coordinates: node.coordinates },
        })),
      };
      map.addSource('network-hubs', { type: 'geojson', data: hubData });
      map.addLayer({
        id: 'hub-rings',
        type: 'circle',
        source: 'network-hubs',
        paint: {
          'circle-radius': ['match', ['get', 'kind'], 'cloud-region', 7, 'landing-station', 6, 5],
          'circle-color': '#091318',
          'circle-stroke-color': ['match', ['get', 'kind'], 'cloud-region', '#b3a7ff', '#9ff8e8'],
          'circle-stroke-width': 1.6,
        },
      });
      map.addLayer({
        id: 'hub-labels',
        type: 'symbol',
        source: 'network-hubs',
        minzoom: 2.3,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-offset': [0, 1.35],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: { 'text-color': '#b7cac7', 'text-halo-color': '#071015', 'text-halo-width': 1.5 },
      });

      map.on('mouseenter', 'edge-lines', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'edge-lines', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'edge-lines', (event) => {
        const properties = event.features?.[0]?.properties;
        if (!properties) return;

        const content = document.createElement('div');
        content.className = 'route-popup-content';
        const title = document.createElement('strong');
        title.textContent = properties.name;
        const load = document.createElement('span');
        load.textContent = `${properties.loadLabel} · ${properties.utilizationLabel} utilized`;
        const confidence = document.createElement('small');
        confidence.textContent = `${properties.confidence} model input`;
        content.append(title, load, confidence);

        new maplibregl.Popup({ closeButton: false, offset: 8, className: 'route-popup' })
          .setLngLat(event.lngLat)
          .setDOMContent(content)
          .addTo(map);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [model]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    (map.getSource('network-edges') as maplibregl.GeoJSONSource | undefined)?.setData(edgeData);
  }, [edgeData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    map.setLayoutProperty('edge-glow', 'visibility', showTraffic ? 'visible' : 'none');
    map.setLayoutProperty('edge-lines', 'visibility', showTraffic ? 'visible' : 'none');
  }, [showTraffic]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    map.setLayoutProperty('hub-rings', 'visibility', showHubs ? 'visible' : 'none');
    map.setLayoutProperty('hub-labels', 'visibility', showHubs ? 'visible' : 'none');
  }, [showHubs]);

  return <div ref={containerRef} className="network-map" aria-label="Interactive model of internet routes" />;
}

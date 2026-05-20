import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { fetchMapViewport } from '../../services/intelligenceApi';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const zoneIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [24, 40],
  iconAnchor: [12, 38],
});

const enterpriseIcon = new L.DivIcon({
  className: 'enterprise-marker-dot',
  html: '<span></span>',
  iconSize: [12, 12],
});

function FlyToZone({ selectedZone }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedZone?.cell_lat || !selectedZone?.cell_lon) return;
    map.flyTo([parseFloat(selectedZone.cell_lat), parseFloat(selectedZone.cell_lon)], 12, { duration: 0.9 });
  }, [map, selectedZone?.id]);
  return null;
}

function HeatLayer({ points, enabled }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !points?.length) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }
    if (layerRef.current) map.removeLayer(layerRef.current);
    layerRef.current = L.heatLayer(
      points.map((p) => [p.lat, p.lng, Math.min(1, (p.intensity || 0) / 3)]),
      { radius: 24, blur: 16, maxZoom: 14 }
    );
    layerRef.current.addTo(map);
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [enabled, map, points]);

  return null;
}

function ViewportWatcher({ onViewportChange }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onViewportChange({
        bbox: `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`,
        zoom: map.getZoom(),
      });
    },
    zoomend: () => {
      const b = map.getBounds();
      onViewportChange({
        bbox: `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`,
        zoom: map.getZoom(),
      });
    },
  });

  useEffect(() => {
    const b = map.getBounds();
    onViewportChange({
      bbox: `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`,
      zoom: map.getZoom(),
    });
  }, [map, onViewportChange]);

  return null;
}

const GeoIntelligenceMap = ({
  city,
  sector,
  selectedZone,
  onSelectZone,
  mapLevel,
  onMapLevelChange,
  showHeatmap,
  onZoneCountChange,
}) => {
  const [viewport, setViewport] = useState(null);
  const [zones, setZones] = useState([]);
  const [companies, setCompanies] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!viewport?.bbox) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const data = await fetchMapViewport({
          city,
          sector: sector || undefined,
          bbox: viewport.bbox,
          zoom: viewport.zoom,
          zone_id: selectedZone?.id || undefined,
          zone_page_size: 800,
          enterprise_page_size: viewport.zoom >= 14 ? 350 : 150,
        });
        const zoneItems = data?.zones?.items || [];
        setZones(zoneItems);
        onZoneCountChange?.(data?.zones?.count || zoneItems.length || 0);
        if (viewport.zoom >= 12) {
          setCompanies(data?.enterprises?.items || []);
        } else {
          setCompanies([]);
        }
      } catch {
        setZones([]);
        setCompanies([]);
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [viewport, city, sector, selectedZone?.id, onZoneCountChange]);

  const heatPoints = useMemo(
    () =>
      zones.map((z) => ({
        lat: parseFloat(z.cell_lat),
        lng: parseFloat(z.cell_lon),
        intensity: Number(z.density_log || 0),
      })),
    [zones]
  );

  const effectiveLevel = !selectedZone?.id ? 1 : viewport?.zoom >= 14 ? 3 : 2;
  useEffect(() => {
    onMapLevelChange?.(effectiveLevel);
  }, [effectiveLevel, onMapLevelChange]);

  return (
    <div className="intel-map-wrap">
      <motion.div
        className="intel-level-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={mapLevel}
      >
        {effectiveLevel === 1 && 'Niveau 1 — Clusters nationaux'}
        {effectiveLevel === 2 && 'Niveau 2 — Zone sélectionnée'}
        {effectiveLevel === 3 && `Niveau 3 — ${companies.length} entreprises visibles`}
      </motion.div>

      <MapContainer center={[31.7917, -7.0926]} zoom={6} minZoom={5} scrollWheelZoom>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ViewportWatcher onViewportChange={setViewport} />
        <FlyToZone selectedZone={selectedZone} />
        <HeatLayer points={heatPoints} enabled={showHeatmap && effectiveLevel < 3} />

        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {zones.map((z) => (
            <Marker
              key={`${z.id}-${z.cell_id}`}
              position={[parseFloat(z.cell_lat), parseFloat(z.cell_lon)]}
              icon={zoneIcon}
              eventHandlers={{
                click: () => onSelectZone?.(z, 2),
              }}
            >
              <Popup>
                <strong>{z.display_name}</strong>
                <br />
                {z.entity_count_real} entités · {z.sectors_count || 1} secteurs
                <br />
                <button type="button" onClick={() => onSelectZone?.(z, 3)}>
                  Voir entreprises
                </button>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {effectiveLevel >= 3 && (
          <MarkerClusterGroup chunkedLoading maxClusterRadius={36}>
            {companies.map((c) => (
              <Marker
                key={`ent-${c.id}`}
                position={[parseFloat(c.latitude), parseFloat(c.longitude)]}
                icon={enterpriseIcon}
              >
                <Popup>
                  <strong>{c.entity_name}</strong>
                  <br />
                  {c.sector_main} · {c.company_status}
                  <br />
                  {c.city}
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
};

export default GeoIntelligenceMap;

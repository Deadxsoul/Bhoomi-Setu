import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../api/client';

const RISK_COLOR = { green: '#16a34a', yellow: '#f59e0b', red: '#dc2626' };

export default function MapView() {
  const [parcels, setParcels] = useState([]);
  const [nearbyUnused, setNearbyUnused] = useState([]);
  const [radius, setRadius] = useState(500);

  useEffect(() => {
    api.get('/parcels').then((r) => setParcels(r.data));
  }, []);

  async function findUnusedNear(lat, lng) {
    const res = await api.get('/parcels/unused/nearby', { params: { lat, lng, radiusKm: radius } });
    setNearbyUnused(res.data);
  }

  const center = parcels.length
    ? [parcels[0].latitude || 22.5, parcels[0].longitude || 78.9]
    : [22.5, 78.9];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">GIS-Based Land Parcel Map</h1>
      <p className="text-sm text-gray-500">
        Marker color = Litigation Risk Indicator (<span style={{ color: RISK_COLOR.green }}>●</span> low ·{' '}
        <span style={{ color: RISK_COLOR.yellow }}>●</span> medium · <span style={{ color: RISK_COLOR.red }}>●</span> high)
      </p>

      <div className="card" style={{ height: 500, padding: 0, overflow: 'hidden' }}>
        <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='Tiles &copy; Esri — Source: Esri, HERE, Garmin, USGS, Intermap, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, &copy; OpenStreetMap contributors, GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          {parcels.filter(p => p.latitude && p.longitude).map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={10}
              pathOptions={{ color: RISK_COLOR[p.litigation_risk], fillColor: RISK_COLOR[p.litigation_risk], fillOpacity: 0.7 }}
              eventHandlers={{ click: () => findUnusedNear(p.latitude, p.longitude) }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{p.parcel_code}</strong><br />
                  Owner: {p.owner_name}<br />
                  Area: {p.area_acres} acres<br />
                  Status: {p.status}<br />
                  Disputes: {p.dispute_count} → <span className="capitalize">{p.litigation_risk} risk</span><br />
                  Project: {p.project_name || '—'}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Unused Acquired Land Finder</h2>
        <p className="text-xs text-gray-500 mb-3">Click any parcel marker above to search for unused acquired land nearby (helps new projects reuse land instead of fresh acquisition).</p>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs">Radius (km):</label>
          <input type="number" className="input w-24" value={radius} onChange={(e) => setRadius(e.target.value)} />
        </div>
        {nearbyUnused.length > 0 ? (
          <ul className="text-sm space-y-1">
            {nearbyUnused.map((p) => (
              <li key={p.id} className="flex justify-between border-b py-1">
                <span>{p.parcel_code} — {p.owner_name} ({p.area_acres} acres)</span>
                <span className="text-gray-500">{p.distance_km} km away</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">Click a marker to search nearby unused land.</p>
        )}
      </div>
    </div>
  );
}

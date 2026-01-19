import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Reading } from '@shared/schema';
import { useMemo, useEffect } from 'react';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to handle map view updates
function MapController({ locations }: { locations: { lat: number; lon: number; lastSeen: Date }[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      // Find the most recently updated device to track
      const activeDevice = locations.reduce((prev, current) =>
        (prev.lastSeen > current.lastSeen) ? prev : current
      );

      // Fly to the new location smoothly
      map.flyTo([activeDevice.lat, activeDevice.lon], 13, {
        animate: true,
        duration: 1.5 // Smooth animation duration in seconds
      });
    }
  }, [locations, map]);

  return null;
}

interface WorldMapProps {
  readings: Reading[];
}

export function WorldMap({ readings }: WorldMapProps) {
  // Aggregate latest lat/lon per device
  const deviceLocations = useMemo(() => {
    const locations = new Map<number, { lat?: number; lon?: number; lastSeen: Date }>();

    readings.forEach(r => {
      const type = r.type.toLowerCase();
      if (!locations.has(r.deviceId)) {
        locations.set(r.deviceId, { lastSeen: new Date(0) });
      }

      const loc = locations.get(r.deviceId)!;
      const ts = r.timestamp ? new Date(r.timestamp) : new Date(0);
      if (ts > loc.lastSeen) {
        loc.lastSeen = ts;
      }

      if (type === 'lat' || type === 'latitude') loc.lat = r.value;
      if (type === 'lon' || type === 'long' || type === 'longitude') loc.lon = r.value;
    });

    return Array.from(locations.entries())
      .map(([id, data]) => ({ id, ...data }))
      .filter(d => d.lat !== undefined && d.lon !== undefined) as { id: number; lat: number; lon: number; lastSeen: Date }[];
  }, [readings]);

  // Default center (e.g., Equator or a lively spot)
  const center: [number, number] = deviceLocations.length > 0
    ? [deviceLocations[0].lat, deviceLocations[0].lon]
    : [20, 0];

  return (
    <div className="glass-card p-0 rounded-2xl h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-4 left-4 z-[400] bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Geo-Tracking
        </h3>
      </div>

      <MapContainer
        center={center}
        zoom={2}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ minHeight: '100%', background: '#1e1e1e' }}
      >
        <MapController locations={deviceLocations} />

        {/* Dark themed tiles using CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {deviceLocations.map(device => (
          <Marker key={device.id} position={[device.lat, device.lon]}>
            <Popup className="glass-popup">
              <div className="p-2 min-w-[150px]">
                <h4 className="font-bold text-sm mb-1">Device #{device.id}</h4>
                <p className="text-xs text-muted-foreground">Status: <span className="text-emerald-500">Active</span></p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {device.lat.toFixed(4)}, {device.lon.toFixed(4)}
                </p>
                <p className="text-[10px] text-muted-foreground italic mt-1">
                  Last seen: {device.lastSeen.toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {deviceLocations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
          <p className="bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
            Waiting for GPS data...
          </p>
        </div>
      )}
    </div>
  );
}

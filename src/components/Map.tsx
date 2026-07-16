"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {

  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
    contextmenu(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });

  return null;
}

export default function Map({ position, onLocationSelect }: { position: [number, number] | null, onLocationSelect?: (lat: number, lng: number) => void }) {
  const defaultPosition: [number, number] = [-6.200000, 106.816666]; // Jakarta
  const center = position || defaultPosition;

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner z-0 relative">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        {position && <Marker position={position} />}
        <MapUpdater center={center} />
        {onLocationSelect && <MapEvents onLocationSelect={onLocationSelect} />}
      </MapContainer>
    </div>
  );
}

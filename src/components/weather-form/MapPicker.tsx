"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L, { type LeafletMouseEvent } from "leaflet";
import { useMemo } from "react";

// A modern, theme-aware SVG pin rendered through Leaflet's divIcon.
// Includes a gradient body, soft shadow, and an animated pulse ring.
function usePinIcon() {
  return useMemo(
    () =>
      L.divIcon({
        className: "map-pin-root",
        html: `
          <div class="map-pin">
            <div class="map-pin-pulse"></div>
            <div class="map-pin-body">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pinGradient" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#67e8f9"/>
                    <stop offset="1" stop-color="#22d3ee"/>
                  </linearGradient>
                  <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.45"/>
                  </filter>
                </defs>
                <path d="M12 0C6.48 0 2 4.48 2 10c0 7 10 22 10 22s10-15 10-22c0-5.52-4.48-10-10-10z" fill="url(#pinGradient)" filter="url(#pinShadow)"/>
                <circle cx="12" cy="10" r="4.5" fill="#0a0d16"/>
                <circle cx="12" cy="10" r="2" fill="#e6e9f2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
    [],
  );
}

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick(Number(event.latlng.lat.toFixed(4)), Number(event.latlng.lng.toFixed(4)));
    },
  });
  return null;
}

export function MapPicker({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lon: number) => void;
}) {
  const icon = usePinIcon();
  const hasCoords = latitude != null && longitude != null;
  // Default to central India when no coordinates have been picked yet.
  const center: [number, number] = [latitude ?? 20.5937, longitude ?? 78.9629];

  return (
    <div className="map-picker-container">
      <MapContainer
        center={center}
        zoom={hasCoords ? 6 : 2}
        scrollWheelZoom
        className="h-80 w-full rounded-xl"
        aria-label="Click the map to select coordinates"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onPick} />
        {hasCoords && (
          <Marker
            key={`${latitude}-${longitude}`}
            position={[latitude, longitude]}
            icon={icon}
          />
        )}
      </MapContainer>

      {!hasCoords && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="glass-panel rounded-full px-4 py-2 text-sm text-slate-300 shadow-xl">
            Click anywhere to select coordinates
          </div>
        </div>
      )}
    </div>
  );
}

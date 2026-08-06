"use client";

export const EXAMPLE_LOCATIONS = [
  { label: "New York, US", latitude: 40.7128, longitude: -74.006 },
  { label: "London, UK", latitude: 51.5074, longitude: -0.1278 },
  { label: "Tokyo, JP", latitude: 35.6762, longitude: 139.6503 },
  { label: "Nairobi, KE", latitude: -1.2921, longitude: 36.8219 },
  { label: "São Paulo, BR", latitude: -23.5505, longitude: -46.6333 },
  { label: "Reykjavík, IS", latitude: 64.1466, longitude: -21.9426 },
];

export function ExampleLocations({ onSelect }: { onSelect: (loc: (typeof EXAMPLE_LOCATIONS)[number]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLE_LOCATIONS.map((loc) => (
        <button
          key={loc.label}
          type="button"
          onClick={() => onSelect(loc)}
          className="focus-ring rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300 transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}

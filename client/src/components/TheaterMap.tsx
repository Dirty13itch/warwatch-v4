import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { MapFeature } from "@shared/types";
import "maplibre-gl/dist/maplibre-gl.css";

interface TheaterMapProps {
  layers: Record<string, MapFeature[]>;
}

const layerColors: Record<string, string> = {
  country_attacks: "#ff7a59",
  nuclear_sites: "#ffc857",
  iran_bases: "#ff4d5e",
  us_bases: "#59d3ff",
  oil_infra: "#7ee787"
};

export function TheaterMap({ layers }: TheaterMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [50.55, 30.2],
      zoom: 3.2,
      attributionControl: false
    });

    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    return () => {
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];

    for (const [layerKey, features] of Object.entries(layers)) {
      for (const feature of features) {
        const marker = new maplibregl.Marker({
          color: layerColors[layerKey] ?? "#b7c7d6",
          scale: layerKey === "country_attacks" ? 0.9 : 0.7
        })
          .setLngLat([feature.lon, feature.lat])
          .setPopup(
            new maplibregl.Popup({ closeButton: false }).setHTML(`
              <div style="padding:8px 10px;background:#081018;color:#d9e5ef;font-family:IBM Plex Sans,system-ui,sans-serif;max-width:260px">
                <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#59d3ff;margin-bottom:4px">${layerKey.replace(/_/g, " ")}</div>
                <div style="font-weight:700;margin-bottom:4px">${feature.title}</div>
                <div style="font-size:12px;opacity:0.84;margin-bottom:6px">${feature.status}</div>
                <div style="font-size:11px;line-height:1.45">${feature.sourceText}</div>
              </div>
            `)
          )
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      }
    }
  }, [layers]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-line/80 bg-shell/70 shadow-shell">
      <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal/70">
            Theater map
          </p>
          <h3 className="font-display text-2xl text-white">Operational geography</h3>
        </div>
        <p className="max-w-[18rem] text-right text-sm text-calm/80">
          Seeded layers from the V3 map deck are now API-backed and ready for live refresh.
        </p>
      </div>
      <div
        ref={containerRef}
        className="h-[20rem] w-full md:h-[28rem]"
      />
    </div>
  );
}


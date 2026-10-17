"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Chapter } from "@/lib/types";
import "leaflet/dist/leaflet.css";

export function ChapterMap({
  chapters,
  onSelect,
}: {
  chapters: Chapter[];
  onSelect: (chapter: Chapter) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);
  const [status, setStatus] = useState("Loading chapter map…");
  const located = chapters.filter(
    (c) =>
      typeof c.lat === "number" &&
      typeof c.lng === "number" &&
      Number.isFinite(c.lat) &&
      Number.isFinite(c.lng) &&
      Math.abs(c.lat) <= 90 &&
      Math.abs(c.lng) <= 180,
  );
  useEffect(() => {
    let disposed = false;
    let instance: LeafletMap | null = null;
    import("leaflet")
      .then((L) => {
        if (disposed || !host.current) return;
        instance = L.map(host.current, { scrollWheelZoom: false }).setView(
          [39, -98],
          4,
        );
        map.current = instance;
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 18,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        ).addTo(instance);
        tiles.on("tileerror", () => {
          if (!disposed)
            setStatus(
              "Map background unavailable. Chapter pins and the list below still work.",
            );
        });
        const positions: [number, number][] = [];
        for (const c of located) {
          const point: [number, number] = [c.lat!, c.lng!];
          positions.push(point);
          const marker = L.marker(point, {
            title: `View ${c.name}`,
            alt: `View ${c.name}`,
            icon: L.divIcon({
              className: "chapter-pin",
              html: '<span aria-hidden="true">S</span>',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            }),
          }).addTo(instance);
          const label = document.createElement("span");
          label.textContent = c.name;
          marker.bindTooltip(label).on("click", () => select.current(c));
        }
        if (positions.length)
          instance.fitBounds(L.latLngBounds(positions), {
            padding: [42, 42],
            maxZoom: 10,
          });
        setStatus(
          positions.length
            ? "Select a pin to open a chapter. Drag to explore; use + and − to zoom."
            : "No matching chapters have confirmed coordinates. Use the chapter list below.",
        );
      })
      .catch(() => {
        if (!disposed)
          setStatus(
            "The map could not load. All chapters remain available in the list below.",
          );
      });
    return () => {
      disposed = true;
      instance?.remove();
      map.current = null;
    };
    // Chapter data determines the markers; selection is read from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(located.map((c) => [c.id, c.name, c.lat, c.lng]))]);
  return (
    <section className="chapter-map-panel" aria-label="Chapter map">
      <div className="map-caption">
        <span>
          <strong>{located.length}</strong> chapters on the map
          {chapters.length > located.length
            ? ` · ${chapters.length - located.length} awaiting location`
            : ""}
        </span>
        <span>Campus locations · sample chapters are fictional</span>
      </div>
      <div
        ref={host}
        className="chapter-map"
        aria-label="Interactive chapter locations"
      />
      <p role="status" className="map-help">
        {status}
      </p>
    </section>
  );
}

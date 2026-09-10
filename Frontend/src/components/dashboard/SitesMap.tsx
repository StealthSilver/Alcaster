import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { ArrowUpRight, MapPin } from "lucide-react";

import type { Site, SiteType } from "@/lib/api";
import {
  countryForLocation,
  formatCoordinate,
  getCountryView,
  resolveSiteCoordinates,
} from "@/lib/countries";
import { siteStatusLabel, siteStatusLozenge, siteTypeLabel } from "@/lib/labels";

import "leaflet/dist/leaflet.css";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const TYPE_COLOR: Record<SiteType, string> = {
  solar: "#e6740a",
  wind: "#6ea8d6",
  bess: "#8fbf9a",
  hybrid: "#c4a0e0",
};

type SitesMapProps = {
  sites: Site[];
  onOpenSite: (site: Site) => void;
  initialSiteId?: string | null;
};

type LocatedSite = Site & {
  country: string;
  mapLatitude: number;
  mapLongitude: number;
  approximate: boolean;
};

function spreadOverlapping(sites: LocatedSite[]) {
  const groups = new Map<string, LocatedSite[]>();
  for (const site of sites) {
    const key = `${site.mapLatitude.toFixed(3)},${site.mapLongitude.toFixed(3)}`;
    const list = groups.get(key) ?? [];
    list.push(site);
    groups.set(key, list);
  }

  return sites.map((site) => {
    const key = `${site.mapLatitude.toFixed(3)},${site.mapLongitude.toFixed(3)}`;
    const group = groups.get(key) ?? [site];
    if (group.length === 1) return site;
    const index = group.findIndex((item) => item.id === site.id);
    const angle = (index / group.length) * Math.PI * 2;
    const radius = 0.28;
    return {
      ...site,
      mapLatitude: site.mapLatitude + Math.sin(angle) * radius,
      mapLongitude: site.mapLongitude + Math.cos(angle) * radius,
    };
  });
}

function markerIcon(site: LocatedSite, selected: boolean) {
  const color = TYPE_COLOR[site.type];
  return L.divIcon({
    className: "alcaster-map-marker-wrap",
    html: `<button type="button" class="alcaster-map-marker${
      selected ? " is-selected" : ""
    }" tabindex="-1" style="--marker-color:${color}"><span class="alcaster-map-marker-dot"></span></button>`,
    iconSize: selected ? [28, 28] : [18, 18],
    iconAnchor: selected ? [14, 14] : [9, 9],
  });
}

export function SitesMap({ sites, onOpenSite, initialSiteId }: SitesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [countryOverride, setCountryOverride] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSiteId ?? null,
  );

  const located = useMemo<LocatedSite[]>(() => {
    const next: LocatedSite[] = [];
    for (const site of sites) {
      const resolved = resolveSiteCoordinates(
        site.address,
        site.latitude,
        site.longitude,
      );
      if (!resolved) continue;
      next.push({
        ...site,
        country: countryForLocation(
          site.address,
          resolved.latitude,
          resolved.longitude,
        ),
        mapLatitude: resolved.latitude,
        mapLongitude: resolved.longitude,
        approximate: resolved.approximate,
      });
    }
    return spreadOverlapping(next);
  }, [sites]);

  const grouped = useMemo(() => {
    const next = new Map<string, LocatedSite[]>();
    for (const site of located) {
      const list = next.get(site.country) ?? [];
      list.push(site);
      next.set(site.country, list);
    }
    for (const list of next.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return next;
  }, [located]);

  const countries = useMemo(
    () =>
      [...grouped.entries()]
        .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
        .map(([name]) => name),
    [grouped],
  );

  const defaultCountry = useMemo(() => {
    if (initialSiteId) {
      const match = located.find((site) => site.id === initialSiteId);
      if (match) return match.country;
    }
    return countries[0] ?? null;
  }, [countries, initialSiteId, located]);

  const country =
    countryOverride && grouped.has(countryOverride)
      ? countryOverride
      : defaultCountry;

  const countrySites = country ? (grouped.get(country) ?? []) : [];
  const selected = countrySites.find((site) => site.id === selectedId) ?? null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 18,
      worldCopyJump: true,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.attributionControl.setPrefix("");
    map.on("click", () => setSelectedId(null));

    mapRef.current = map;
    setMapReady(true);

    const resize = () => map.invalidateSize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    requestAnimationFrame(resize);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      tilesRef.current = null;
      markersRef.current.clear();
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (tilesRef.current) {
      map.removeLayer(tilesRef.current);
    }

    const layer = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      subdomains: "abc",
      maxZoom: 19,
    });
    layer.addTo(map);
    tilesRef.current = layer;
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !country) return;

    const view = getCountryView(country);
    if (view) {
      map.fitBounds(view.bounds, {
        padding: [48, 48],
        maxZoom: view.zoom,
        animate: true,
      });
      return;
    }

    const fallbackSites = grouped.get(country) ?? [];
    if (fallbackSites.length === 0) return;
    const bounds = L.latLngBounds(
      fallbackSites.map((site) => [site.mapLatitude, site.mapLongitude]),
    );
    map.fitBounds(bounds.pad(0.4), { maxZoom: 6, animate: true });
  }, [country, grouped, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    for (const marker of markersRef.current.values()) {
      marker.remove();
    }
    markersRef.current.clear();

    for (const site of countrySites) {
      const selectedMarker = site.id === selectedId;
      const marker = L.marker([site.mapLatitude, site.mapLongitude], {
        icon: markerIcon(site, selectedMarker),
        title: `${site.name} — ${site.address}`,
        keyboard: false,
        zIndexOffset: selectedMarker ? 200 : 0,
      });
      marker.bindTooltip(
        `<span class="alcaster-map-label-name">${site.name}</span>${
          site.address
            ? `<span class="alcaster-map-label-address">${site.address}</span>`
            : ""
        }`,
        {
          permanent: selectedMarker,
          direction: "top",
          offset: [0, -12],
          className: "alcaster-map-label",
          opacity: 1,
        },
      );
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        setSelectedId(site.id);
      });
      marker.addTo(map);
      markersRef.current.set(site.id, marker);
    }
  }, [countrySites, mapReady, selectedId]);

  if (located.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-edge bg-surface px-4 py-12 text-center text-sm text-muted">
        No sites with coordinates yet. Add a site address and location to see
        it on the map.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
      <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-md border border-edge bg-surface md:w-[22rem]">
        <div className="border-b border-edge px-4 py-3">
          {countries.length > 1 ? (
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                Country
              </span>
              <select
                value={country ?? ""}
                onChange={(event) => setCountryOverride(event.target.value)}
                className="h-8 w-full rounded-md border border-edge-strong bg-input px-2.5 text-sm font-medium text-fg"
              >
                {countries.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-sm font-medium text-fg">{country}</p>
          )}
          <p className="mt-0.5 text-xs text-muted">
            {countrySites.length}{" "}
            {countrySites.length === 1 ? "site on the map" : "sites on the map"}
          </p>
        </div>

        <ul className="min-h-0 max-h-44 flex-1 overflow-y-auto py-1 md:max-h-none">
          {countrySites.map((site) => {
            const active = site.id === selected?.id;
            return (
              <li key={site.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(site.id)}
                  className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    active
                      ? "bg-fill text-fg"
                      : "text-secondary hover:bg-fill hover:text-fg"
                  }`}
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: active
                        ? TYPE_COLOR[site.type]
                        : "var(--alcaster-subtle)",
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-fg">
                        {site.name}
                      </span>
                      <span
                        className={`inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[10px] font-medium ${
                          siteStatusLozenge[site.status]
                        }`}
                      >
                        {siteStatusLabel[site.status]}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 block truncate text-xs text-muted"
                      title={site.address}
                    >
                      {site.address || "No address"}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-subtle">
                      {siteTypeLabel[site.type]}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-edge">
          {selected ? (
            <SiteInfoCard
              site={selected}
              onOpen={() => onOpenSite(selected)}
            />
          ) : (
            <p className="flex items-center gap-1.5 px-4 py-3 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
              Select a site to see details
            </p>
          )}
        </div>
      </aside>

      <div className="alcaster-map relative z-0 min-h-[320px] min-w-0 flex-1 isolate overflow-hidden rounded-md border border-edge bg-page">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}

function SiteInfoCard({
  site,
  onOpen,
}: {
  site: LocatedSite;
  onOpen: () => void;
}) {
  return (
    <div className="px-4 py-3">
      <p className="truncate text-sm font-medium text-fg">{site.name}</p>
      <p className="mt-0.5 text-xs text-muted">{siteTypeLabel[site.type]}</p>
      <dl className="mt-3 space-y-2 text-xs">
        <div>
          <dt className="text-muted">Address</dt>
          <dd className="mt-0.5 break-words font-medium text-fg">
            {site.address || "—"}
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-muted">Coordinates</dt>
            <dd className="mt-0.5 font-medium text-fg">
              {formatCoordinate(site.mapLatitude)},{" "}
              {formatCoordinate(site.mapLongitude)}
              {site.approximate ? (
                <span className="mt-0.5 block font-normal text-muted">
                  From address
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Projects</dt>
            <dd className="mt-0.5 font-medium text-fg">{site.projectCount}</dd>
          </div>
        </div>
      </dl>
      <button
        type="button"
        onClick={onOpen}
        className="mt-3 inline-flex h-8 items-center gap-1 rounded-md bg-[#2a6b45] px-3 text-xs font-medium text-white transition-colors hover:bg-[#245c3b]"
      >
        Open dashboard
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}

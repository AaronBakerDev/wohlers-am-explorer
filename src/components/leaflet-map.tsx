"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// State name to abbreviation mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  // US States
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  // Canadian Provinces and Territories
  Alberta: "AB",
  "British Columbia": "BC",
  Manitoba: "MB",
  "New Brunswick": "NB",
  "Newfoundland and Labrador": "NL",
  "Northwest Territories": "NT",
  "Nova Scotia": "NS",
  Nunavut: "NU",
  Ontario: "ON",
  "Prince Edward Island": "PE",
  Quebec: "QC",
  Saskatchewan: "SK",
  Yukon: "YT",
};

// GeoJSON URLs (local fallback preferred)
const US_STATES_GEOJSON_URL =
  "/data/us-states.json";
const US_STATES_GEOJSON_FALLBACK =
  "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";
// const CANADA_PROVINCES_GEOJSON_URL =
//   "https://gist.githubusercontent.com/M1r1k/d5731bf39e1dfda5b53b4e4c560d968d/raw/c774258085ddc11776591ce95f2240d0fd0657a2/canada_provinces.geo.json";

// Fix for Leaflet default markers in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface CompanyMarker {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  technologies: string[];
  materials: string[];
  website: string | null;
  type: string | null;
  totalMachines: number;
  uniqueProcesses: number;
  uniqueMaterials: number;
  uniqueManufacturers: number;
}

interface StateHeatmapData {
  state: string;
  country: string;
  company_count: number;
  total_machines: number;
}

interface LeafletMapProps {
  companies: CompanyMarker[];
  selectedCompany: CompanyMarker | null;
  onCompanySelect: (company: CompanyMarker | null) => void;
  getMarkerColor: (type: string | null) => string;
  isHeatmapMode?: boolean;
  stateData?: StateHeatmapData[];
  onViewportChange?: (bbox: [number, number, number, number]) => void;
}

// Basic HTML-escaping to prevent XSS in string-based Leaflet popups
function escapeHtml(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHttpUrl(input: unknown): string | null {
  const s = String(input ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(s, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (u.protocol === "http:" || u.protocol === "https:") {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// State coordinates for heatmap visualization (approximate center points) - currently unused
// const STATE_COORDINATES: Record<string, [number, number]> = {
//   CA: [36.7783, -119.4179],
//   TX: [31.9686, -99.9018],
//   FL: [27.7663, -82.6404],
//   NY: [42.1657, -74.9481],
//   PA: [40.5908, -77.2098],
//   IL: [40.3495, -88.9861],
//   OH: [40.3888, -82.7649],
//   GA: [33.0406, -83.6431],
//   NC: [35.5397, -79.8431],
//   MI: [43.3266, -84.5361],
//   NJ: [40.2989, -74.521],
//   VA: [37.7693, -78.2057],
//   WA: [47.4009, -121.4905],
//   AZ: [33.7712, -111.3877],
//   MA: [42.2352, -71.0275],
//   TN: [35.7478, -86.7123],
//   IN: [39.8647, -86.2604],
//   MO: [38.4561, -92.2884],
//   MD: [39.0639, -76.8021],
//   WI: [44.2619, -89.6165],
//   CO: [39.0598, -105.3111],
//   MN: [45.6945, -93.9002],
//   SC: [33.8191, -80.9066],
//   AL: [32.9668, -86.9048],
//   LA: [31.1801, -91.8749],
//   KY: [37.6681, -84.6701],
//   OR: [44.5672, -122.1269],
//   OK: [35.5653, -96.9289],
//   CT: [41.5978, -72.7554],
//   UT: [40.1135, -111.8535],
//   IA: [42.0115, -93.2105],
//   NV: [38.4199, -117.1219],
//   AR: [34.9513, -92.3809],
//   MS: [32.7673, -89.6812],
//   KS: [38.5266, -96.7265],
//   NM: [34.8405, -106.2485],
//   NE: [41.1289, -98.2883],
//   WV: [38.468, -80.9696],
//   ID: [44.2394, -114.5103],
//   HI: [21.0943, -157.4983],
//   NH: [43.4525, -71.5639],
//   ME: [44.6939, -69.3819],
//   RI: [41.6809, -71.5118],
//   MT: [47.0527, -110.2148],
//   DE: [39.3185, -75.5071],
//   SD: [44.2853, -99.4632],
//   ND: [47.5289, -99.784],
//   AK: [61.3025, -152.7764],
//   VT: [44.0459, -72.7107],
//   WY: [42.7475, -107.2085],
  // Canadian provinces
  // ON: [51.2538, -85.3232], // Ontario
  // BC: [53.7267, -127.6476], // British Columbia
  // AB: [53.9333, -116.5765], // Alberta
  // MB: [53.7609, -98.8139], // Manitoba
  // SK: [52.9399, -106.4509], // Saskatchewan
  // QC: [52.9399, -73.5491], // Quebec
  // NB: [46.5653, -66.4619], // New Brunswick
  // NS: [44.682, -63.7443], // Nova Scotia
  // PE: [46.5107, -63.4168], // Prince Edward Island
  // NL: [53.1355, -57.6604], // Newfoundland and Labrador
  // NT: [61.2181, -113.537], // Northwest Territories
  // YT: [64.0685, -139.0686], // Yukon
  // NU: [70.2998, -83.1076], // Nunavut
// };

export default function LeafletMap({
  companies,
  selectedCompany,
  onCompanySelect,
  getMarkerColor,
  isHeatmapMode = false,
  stateData = [],
  onViewportChange,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterLayerRef = useRef<any>(null);
  const choroplethLayerRef = useRef<L.GeoJSON | null>(null);
  const onViewportChangeRef = useRef<((bbox: [number, number, number, number]) => void) | undefined>(undefined);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isLoadingGeoData, setIsLoadingGeoData] = useState(false);
  const [clusterReady, setClusterReady] = useState(false);
  const [legendBuckets, setLegendBuckets] = useState<
    Array<{ color: string; min: number; max: number | null; label: string }>
  >([]);

  // Load Leaflet.markercluster (CSS + JS) on the client for clustering
  useEffect(() => {
    if (typeof window === "undefined") return;
    // If already available, mark as ready
    if ((L as any).markerClusterGroup) {
      setClusterReady(true);
      return;
    }

    const ensureLink = (id: string, href: string) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    };

    ensureLink(
      "leaflet-markercluster-css",
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
    );
    ensureLink(
      "leaflet-markercluster-default-css",
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
    );

    const scriptId = "leaflet-markercluster-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      script.async = true;
      script.onload = () => setClusterReady(true);
      script.onerror = () => setClusterReady(false);
      document.body.appendChild(script);
    } else {
      setClusterReady(true);
    }
  }, []);

  // Load GeoJSON data for states and provinces
  useEffect(() => {
    const loadGeoJsonData = async () => {
      if (geoJsonData) return; // Already loaded

      setIsLoadingGeoData(true);
      try {
        // Load US states, prefer local file then fallback to CDN
        let usData: any = null;
        try {
          const resLocal = await fetch(US_STATES_GEOJSON_URL, { cache: 'force-cache' });
          if (resLocal.ok) usData = await resLocal.json();
        } catch {}
        if (!usData) {
          const resRemote = await fetch(US_STATES_GEOJSON_FALLBACK);
          usData = await resRemote.json();
        }

        // Add country information to US features
        const combinedFeatures = usData.features.map((feature: any) => ({
          ...feature,
          properties: {
            ...feature.properties,
            country: "USA",
            code:
              STATE_ABBREVIATIONS[feature.properties.name] ||
              feature.properties.name,
          },
        }));

        const combinedGeoJson = {
          type: "FeatureCollection",
          features: combinedFeatures,
        };

        setGeoJsonData(combinedGeoJson);
      } catch (error) {
        console.error("Error loading GeoJSON data:", error);
      } finally {
        setIsLoadingGeoData(false);
      }
    };

    loadGeoJsonData();
  }, [geoJsonData]);

  // Keep latest viewport callback in a ref to avoid tearing down the map
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  // Initialize map (once)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove existing map if it exists
    if (mapRef.current) {
      try {
        mapRef.current.stop?.();
        mapRef.current.off();
        mapRef.current.remove();
      } catch (_) {}
      mapRef.current = null;
    }

    // Create new map with animations disabled to avoid transition-end races
    const map = L.map(mapContainerRef.current, {
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    }).setView([39.8283, -98.5795], 4);

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Emit initial viewport bbox
    const initialCb = onViewportChangeRef.current;
    if (initialCb) {
      const b = map.getBounds();
      initialCb([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    }

    // Emit bbox after move/zoom end (read latest callback from ref)
    const emit = () => {
      const cb = onViewportChangeRef.current;
      if (!cb) return;
      const bounds = map.getBounds();
      cb([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
    };
    map.on("moveend", emit);
    map.on("zoomend", emit);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.stop?.();
          mapRef.current.off();
          mapRef.current.remove();
        } catch (_) {}
        mapRef.current = null;
      }
    };
  }, []);

  // Handle map resize when container dimensions change
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        // Small delay to ensure container has resized
        setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 300);
      }
    };

    // Listen for window resize and container changes
    window.addEventListener("resize", handleResize);

    // Use ResizeObserver to detect container size changes (sidebar collapse/expand)
    let resizeObserver: ResizeObserver | null = null;

    if (mapContainerRef.current && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Memoize array dependencies to prevent useEffect dependency array size changes
  const memoizedCompanies = useMemo(() => companies, [companies]);
  const memoizedStateData = useMemo(() => stateData, [stateData]);

  // Update map visualization based on mode
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers, cluster and choropleth layer
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (clusterLayerRef.current) {
      clusterLayerRef.current.clearLayers();
      clusterLayerRef.current.remove();
      clusterLayerRef.current = null;
    }
    if (choroplethLayerRef.current) {
      choroplethLayerRef.current.remove();
      choroplethLayerRef.current = null;
    }

    if (isHeatmapMode) {
      // Choropleth mode - show colored state polygons
      const intensities = memoizedStateData
        .map((s) => (s.total_machines && s.total_machines > 0 ? s.total_machines : s.company_count || 0))
        .filter((v) => v > 0)
        .sort((a, b) => a - b);
      const safeMax = Math.max(...(intensities.length ? intensities : [1]));

      // Compute quantile thresholds for 5 buckets
      const q = (arr: number[], p: number) => {
        if (!arr.length) return 0;
        const idx = Math.floor((arr.length - 1) * p);
        return arr[idx];
      };
      const t1 = q(intensities, 0.2);
      const t2 = q(intensities, 0.4);
      const t3 = q(intensities, 0.6);
      const t4 = q(intensities, 0.8);
      const thresholds = [t1, t2, t3, t4].filter((v, i, a) => i === 0 || v !== a[i - 1]);

      const colors = ["#FFEDA0", "#FED976", "#FEB24C", "#FD8D3C", "#E31A1C"];

      const getBucketIndex = (val: number) => {
        if (thresholds.length === 0) return val > 0 ? 4 : 0;
        if (val <= thresholds[0]) return 0;
        if (thresholds.length >= 2 && val <= thresholds[1]) return 1;
        if (thresholds.length >= 3 && val <= thresholds[2]) return 2;
        if (thresholds.length >= 4 && val <= thresholds[3]) return 3;
        return 4;
      };

      const buildLegend = () => {
        if (!intensities.length) {
          setLegendBuckets((prev) => (prev.length === 0 ? prev : []));
          return;
        }
        const bucketRanges: Array<{ min: number; max: number | null; color: string; label: string }> = [];
        const bounds = [0, ...thresholds, Infinity];
        for (let i = 0; i < colors.length; i++) {
          const min = i === 0 ? 1 : Math.floor(bounds[i] + 1);
          const max = i < colors.length - 1 && Number.isFinite(bounds[i + 1]) ? Math.floor(bounds[i + 1]) : null;
          const label = max ? `${min}-${max}` : `${min}+`;
          bucketRanges.push({ min, max, color: colors[i], label });
        }
        setLegendBuckets((prev) => {
          if (
            prev.length === bucketRanges.length &&
            prev.every((p, i) => p.color === bucketRanges[i].color && p.label === bucketRanges[i].label)
          ) {
            return prev;
          }
          return bucketRanges;
        });
      };
      buildLegend();

      // Create a lookup map for state data
      // Map different country formats and state codes
      const stateDataMap = new Map();
      memoizedStateData.forEach((state) => {
        const country =
          state.country === "United States"
            ? "USA"
            : state.country === "Canada"
              ? "Canada"
              : state.country;
        stateDataMap.set(`${state.state}-${country}`, state);
        // Also try without country suffix for flexibility
        stateDataMap.set(state.state, state);
      });

      // Color function based on quantile buckets of intensity
      const getColor = (intensity: number) => colors[getBucketIndex(intensity)];

      // Style function for each feature
      const style = (feature: any) => {
        const stateCode = feature.properties.code;
        const country = feature.properties.country === "USA" ? "USA" : "Canada";
        const stateKey = `${stateCode}-${country}`;
        const stateInfo = stateDataMap.get(stateKey) || stateDataMap.get(stateCode);
        const intensity = stateInfo
          ? stateInfo.total_machines && stateInfo.total_machines > 0
            ? Number(stateInfo.total_machines)
            : Number(stateInfo.company_count || 0)
          : 0;

        return {
          fillColor: getColor(intensity),
          weight: 2,
          opacity: 1,
          color: "white",
          dashArray: "",
          fillOpacity: intensity > 0 ? 0.7 : 0.1,
        };
      };

      // Highlight function
      const highlightFeature = (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 5,
          color: "#666",
          dashArray: "",
          fillOpacity: 0.7,
        });
        layer.bringToFront();
      };

      // Reset highlight
      const resetHighlight = (e: any) => {
        choroplethLayerRef.current?.resetStyle(e.target);
      };

      // Click handler
      const zoomToFeature = (e: any) => {
        mapRef.current?.fitBounds(e.target.getBounds());
      };

      // Feature event handlers
      const onEachFeature = (feature: any, layer: any) => {
        const stateCode = feature.properties.code;
        const country = feature.properties.country === "USA" ? "USA" : "Canada";
        const stateKey = `${stateCode}-${country}`;
        const stateInfo =
          stateDataMap.get(stateKey) || stateDataMap.get(stateCode);

        // Add popup (sanitized)
        if (stateInfo) {
          const stateName = escapeHtml(feature.properties.name);
          const companies = Number(stateInfo.company_count) || 0;
          const machines = Number(stateInfo.total_machines) || 0;
          const avg = companies ? Math.round(machines / companies) : 0;
          const popupContent = `
            <div class="p-3 min-w-48">
              <h3 class="font-medium text-lg mb-2">${stateName}</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Companies:</span>
                  <span class="font-medium">${companies}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Total Machines:</span>
                  <span class="font-medium">${machines}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Avg per Company:</span>
                  <span class="font-medium">${avg}</span>
                </div>
              </div>
            </div>
          `;
          layer.bindPopup(popupContent);
        }

        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature,
        });
      };

      // Create choropleth layer only if GeoJSON data is loaded
      if (geoJsonData) {
        choroplethLayerRef.current = L.geoJSON(geoJsonData, {
          style: style,
          onEachFeature: onEachFeature,
        }).addTo(mapRef.current!);

        // Fit map to choropleth bounds
        mapRef.current.fitBounds(choroplethLayerRef.current.getBounds(), {
          padding: [20, 20],
        });
      }
    } else {
      // Pin mode - show individual company markers (with clustering if available)
      const validCompanies = memoizedCompanies.filter((c) => c.lat && c.lng);
      const markers: L.Marker[] = [];
      const useCluster = clusterReady && (L as any).markerClusterGroup;
      const clusterGroup = useCluster
        ? (L as any).markerClusterGroup({
            disableClusteringAtZoom: 10,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
          })
        : null;
      if (clusterGroup && mapRef.current) {
        clusterGroup.addTo(mapRef.current);
        clusterLayerRef.current = clusterGroup;
      }

      validCompanies.forEach((company) => {
        const color = getMarkerColor(company.type);
        const isSelected = selectedCompany?.id === company.id;
        const size = isSelected ? 25 : 20;

        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `
            <div style="
              background-color: ${color};
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ${isSelected ? "transform: scale(1.2); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);" : ""}
            "></div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([company.lat!, company.lng!], { icon }).on(
          "click",
          () => onCompanySelect(company),
        );

        if (clusterGroup) {
          clusterGroup.addLayer(marker);
        } else {
          marker.addTo(mapRef.current!);
        }

        // Add popup with company info including machine count (sanitized)
        const techTags = company.technologies
          .slice(0, 3)
          .map((tech) =>
            `<span class="inline-block bg-primary/10 text-primary text-xs px-1 py-0.5 rounded">${escapeHtml(
              tech,
            )}</span>`,
          )
          .join("");

        const materialTags = company.materials
          .slice(0, 3)
          .map((material) =>
            `<span class="inline-block bg-chart-2/10 text-chart-2 text-xs px-1 py-0.5 rounded">${escapeHtml(
              material,
            )}</span>`,
          )
          .join("");

        const safeName = escapeHtml(company.name);
        const safeCity = escapeHtml(company.city);
        const safeState = escapeHtml(company.state);
        const safeWebsite = safeHttpUrl(company.website);
        const popupContent = `
          <div class="p-3 min-w-48">
            <h3 class="font-medium text-sm mb-1">${safeName}</h3>
            <p class="text-xs text-muted-foreground mb-3">${safeCity}${company.city && company.state ? ", " : ""}${safeState}</p>

            <div class="grid grid-cols-2 gap-3 mb-3 p-2 bg-muted/30 rounded">
              <div class="text-center">
                <div class="text-lg font-bold text-chart-4">${company.totalMachines}</div>
                <div class="text-xs text-muted-foreground">Machines</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-chart-2">${company.uniqueProcesses}</div>
                <div class="text-xs text-muted-foreground">Processes</div>
              </div>
            </div>

            ${company.technologies.length > 0 ? `
              <div class="mb-2">
                <div class="text-xs font-medium text-muted-foreground mb-1">Technologies:</div>
                <div class="flex flex-wrap gap-1">
                  ${techTags}
                  ${company.technologies.length > 3 ? `<span class="text-xs text-muted-foreground">+${company.technologies.length - 3} more</span>` : ''}
                </div>
              </div>
            ` : ''}

            ${company.materials.length > 0 ? `
              <div class="mb-2">
                <div class="text-xs font-medium text-muted-foreground mb-1">Materials:</div>
                <div class="flex flex-wrap gap-1">
                  ${materialTags}
                  ${company.materials.length > 3 ? `<span class="text-xs text-muted-foreground">+${company.materials.length - 3} more</span>` : ''}
                </div>
              </div>
            ` : ''}

            ${safeWebsite ? `
              <a href="${safeWebsite}" target="_blank" rel="noopener noreferrer"
                 class="text-xs text-primary underline">
                Visit Website
              </a>
            ` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        markers.push(marker);
      });

      markersRef.current = markers;

      // Fit bounds to show all markers
      if (validCompanies.length > 0) {
        const group = new L.FeatureGroup(markers);
        mapRef.current.fitBounds(group.getBounds(), {
          padding: [20, 20],
          maxZoom: 10,
        });
      }
    }
  }, [
    memoizedCompanies,
    selectedCompany,
    getMarkerColor,
    onCompanySelect,
    isHeatmapMode,
    memoizedStateData,
    geoJsonData,
    clusterReady,
  ]);

  return (
    <div ref={mapContainerRef} className="h-full w-full relative">
      {isLoadingGeoData && isHeatmapMode && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-[400]">
          <div className="text-sm text-muted-foreground">
            Loading map data...
          </div>
        </div>
      )}
      {isHeatmapMode && legendBuckets.length > 0 && (
        <div className="absolute left-3 bottom-3 z-[400] bg-card/90 backdrop-blur-sm border border-border rounded-md shadow p-2">
          <div className="text-[11px] font-medium text-foreground mb-1">Heatmap Intensity</div>
          <div className="space-y-1">
            {legendBuckets.map((b, i) => (
              <div key={`${b.color}-${i}`} className="flex items-center gap-2 text-[11px]">
                <span className="inline-block w-4 h-3 rounded-sm" style={{ backgroundColor: b.color }} />
                <span className="text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

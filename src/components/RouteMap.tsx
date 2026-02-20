import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { PropertyMapDestination } from "../types";
import type { LatLng } from "../types";

const DEFAULT_USER: LatLng = [16.7797, 96.1497];

function makeIcon(color: string, label: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:32px;height:32px;margin:0;padding:0;
      border-radius:50%;box-sizing:border-box;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:12px;font-weight:bold;
    ">${label || ""}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const ARROW_W = 20;
const ARROW_H = 24;
const ARROW_TIP_X = 10;
const ARROW_TIP_Y = 0;
function makeArrowIcon(rotationDeg: number) {
  return L.divIcon({
    className: "arrow-marker",
    html: `<div style="
      position:absolute;
      left:0;top:0;
      width:0;height:0;
      border-left:${ARROW_TIP_X}px solid transparent;
      border-right:${ARROW_TIP_X}px solid transparent;
      border-bottom:${ARROW_H}px solid #ef4444;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));
      transform:rotate(${rotationDeg}deg);
      transform-origin:${ARROW_TIP_X}px ${ARROW_TIP_Y}px;
    "></div>`,
    iconSize: [ARROW_W, ARROW_H],
    iconAnchor: [ARROW_TIP_X, ARROW_TIP_Y],
  });
}

function bearing(from: LatLng, to: LatLng): number {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1r = (lat1 * Math.PI) / 180;
  const lat2r = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2r);
  const x = Math.cos(lat1r) * Math.sin(lat2r) - Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dLng);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/** Fallback: straight line if routing API fails */
function getStraightLinePoints(start: LatLng, end: LatLng, steps = 120): LatLng[] {
  const points: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push([
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
    ]);
  }
  return points;
}

/** Fetch road route from OSRM (driving). Returns points [lat, lng] and distance in km. */
async function fetchRoadRoute(start: LatLng, end: LatLng): Promise<{ points: LatLng[]; distanceKm: number } | null> {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes?.[0]?.geometry?.coordinates?.length) return null;
    const coords = data.routes[0].geometry.coordinates as [number, number][];
    const points: LatLng[] = coords.map(([lng, lat]) => [lat, lng]);
    const distanceM = data.routes[0].distance as number;
    return { points, distanceKm: distanceM / 1000 };
  } catch {
    return null;
  }
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Total route length in meters (sum of segment lengths). */
function routeLengthM(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += haversineKm(points[i - 1], points[i]) * 1000;
  }
  return d;
}

function interpolateOnRoute(points: LatLng[], t: number): LatLng {
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];
  const seg = t * (points.length - 1);
  const i = Math.floor(seg);
  const frac = seg - i;
  const a = points[i];
  const b = points[i + 1];
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

interface RouteMapProps {
  destination: PropertyMapDestination;
  destinationImage?: string;
  userPosition?: LatLng;
  height?: number;
  fullScreen?: boolean;
  onRouteDistance?: (km: number) => void;
}

export default function RouteMap({
  destination,
  destinationImage,
  userPosition: userPositionProp,
  height = 400,
  fullScreen = false,
  onRouteDistance,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const trailLayerRef = useRef<L.Polyline | null>(null);
  const animMarkerRef = useRef<L.Marker | null>(null);
  const destRef = useRef<LatLng | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showArrivedPopup, setShowArrivedPopup] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [routeStatus, setRouteStatus] = useState<"loading" | "road" | "straight">("loading");
  const [browserPosition, setBrowserPosition] = useState<LatLng | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "ok" | "fallback">("pending");
  const routePointsRef = useRef<LatLng[]>([]);
  const routeDistanceMRef = useRef<number>(0);

  type TravelMode = "walking" | "cycling" | "driving";
  const TRAVEL_SPEED_RANGE: Record<TravelMode, { min: number; max: number }> = {
    walking: { min: 4, max: 10 },
    cycling: { min: 10, max: 30 },
    driving: { min: 30, max: 60 },
  };
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");

  const [controlsPosition, setControlsPosition] = useState({ left: 16, bottom: 64 });
  const controlsRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; left: number; bottom: number } | null>(null);

  const handleControlsPointerDown = useCallback((e: React.PointerEvent) => {
    if (!fullScreen) return;
    e.preventDefault();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      left: controlsPosition.left,
      bottom: controlsPosition.bottom,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [fullScreen, controlsPosition.left, controlsPosition.bottom]);

  const handleControlsPointerMove = useCallback((e: PointerEvent) => {
    const start = dragStartRef.current;
    if (!start) return;
    const w = typeof window !== "undefined" ? window.innerWidth : 400;
    const h = typeof window !== "undefined" ? window.innerHeight : 600;
    const maxW = 320;
    const minBottom = 20;
    const maxBottom = h - 280;
    const left = Math.max(0, Math.min(w - maxW, start.left + (e.clientX - start.pointerX)));
    const bottom = Math.max(minBottom, Math.min(maxBottom, start.bottom - (e.clientY - start.pointerY)));
    setControlsPosition({ left, bottom });
  }, []);

  const handleControlsPointerUp = useCallback((e: React.PointerEvent) => {
    dragStartRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  useEffect(() => {
    if (!fullScreen) return;
    const onMove = (e: PointerEvent) => handleControlsPointerMove(e);
    const onUp = () => { dragStartRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [fullScreen, handleControlsPointerMove]);

  function randomSpeedMps(mode: TravelMode): number {
    const { min, max } = TRAVEL_SPEED_RANGE[mode];
    return min + Math.random() * (max - min);
  }

  const userPosition: LatLng = userPositionProp ?? browserPosition ?? DEFAULT_USER;

  useEffect(() => {
    if (userPositionProp !== undefined) return;
    if (!navigator.geolocation) {
      setBrowserPosition(DEFAULT_USER);
      setLocationStatus("fallback");
      return;
    }
    setLocationStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBrowserPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocationStatus("ok");
      },
      () => {
        setBrowserPosition(DEFAULT_USER);
        setLocationStatus("fallback");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [userPositionProp]);

  useEffect(() => {
    if (!containerRef.current || !destination) return;
    const dest: LatLng = [destination.lat, destination.lng];
    destRef.current = dest;
    const straightPoints = getStraightLinePoints(userPosition, dest);
    routePointsRef.current = straightPoints;
    routeDistanceMRef.current = routeLengthM(straightPoints);
    setRouteStatus("loading");

    const map = L.map(containerRef.current, {
      center: [(userPosition[0] + destination.lat) / 2, (userPosition[1] + destination.lng) / 2],
      zoom: 13,
      zoomControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const userLabel = locationStatus === "ok" ? "Your location" : "Your location (simulated)";
    L.marker(userPosition, { icon: makeIcon("#3b82f6", "U") })
      .addTo(map)
      .bindPopup(userLabel);
    L.marker(dest, { icon: makeIcon("#22c55e", "B") })
      .addTo(map)
      .bindPopup(`<strong>${destination.title || "Property"}</strong><br/>${destination.address || ""}`);

    const routeLayer = L.polyline(straightPoints, { color: "#4a5568", weight: 5, opacity: 0.5 });
    routeLayer.addTo(map);
    routeLayerRef.current = routeLayer;

    const trailLayer = L.polyline([], { color: "#3b82f6", weight: 6, opacity: 0.95 });
    trailLayer.addTo(map);
    trailLayerRef.current = trailLayer;

    const animMarker = L.marker(straightPoints[0], { icon: makeArrowIcon(0) }).addTo(map);
    animMarkerRef.current = animMarker;
    mapRef.current = map;

    onRouteDistance?.(Math.round((haversineKm(userPosition, dest)) * 10) / 10);

    let cancelled = false;
    fetchRoadRoute(userPosition, dest).then((result) => {
      if (cancelled || !routeLayerRef.current || !trailLayerRef.current || !animMarkerRef.current) return;
      if (result && result.points.length > 0) {
        routePointsRef.current = result.points;
        routeDistanceMRef.current = result.distanceKm * 1000;
        routeLayerRef.current.setLatLngs(result.points);
        trailLayerRef.current.setLatLngs([result.points[0]]);
        animMarkerRef.current.setLatLng(result.points[0]);
        onRouteDistance?.(Math.round(result.distanceKm * 10) / 10);
        setRouteStatus("road");
      } else {
        setRouteStatus("straight");
      }
    }).catch(() => {
      if (!cancelled) setRouteStatus("straight");
    });

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      trailLayerRef.current = null;
      animMarkerRef.current = null;
      destRef.current = null;
    };
  }, [destination?.id, userPosition[0], userPosition[1], locationStatus]);

  useEffect(() => {
    if (!fullScreen || !mapRef.current) return;
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [fullScreen]);

  useEffect(() => {
    if (!playing && animMarkerRef.current) {
      animMarkerRef.current.setIcon(makeArrowIcon(0));
    }
  }, [playing]);

  useEffect(() => {
    if (!playing || routePointsRef.current.length === 0) return;
    const points = routePointsRef.current;
    const dest = destRef.current;
    const totalDistanceM = routeDistanceMRef.current || routeLengthM(points);
    const speedMps = randomSpeedMps(travelMode);
    const startTime = performance.now();
    let rafId: number;
    let arrivedTimeoutId: ReturnType<typeof setTimeout>;

    const tick = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      const distanceCoveredM = elapsedSec * speedMps;
      const t = Math.min(distanceCoveredM / totalDistanceM, 1);
      setProgress(t * 100);
      const current = interpolateOnRoute(points, t);
      const seg = t * (points.length - 1);
      const idx = Math.min(Math.floor(seg), points.length - 1);
      const trailPoints: LatLng[] = idx > 0 ? points.slice(0, idx + 1) : [points[0]];
      if (
        t > 0 &&
        (idx === 0 ||
          trailPoints[trailPoints.length - 1][0] !== current[0] ||
          trailPoints[trailPoints.length - 1][1] !== current[1])
      ) {
        trailPoints.push(current);
      }
      trailLayerRef.current?.setLatLngs(trailPoints);
      if (animMarkerRef.current) {
        animMarkerRef.current.setLatLng(current);
        const nextIdx = Math.min(idx + 1, points.length - 1);
        const nextPoint = points[nextIdx];
        const angle = nextPoint && (nextPoint[0] !== current[0] || nextPoint[1] !== current[1])
          ? bearing(current, nextPoint)
          : dest ? bearing(current, dest) : 0;
        animMarkerRef.current.setIcon(makeArrowIcon(angle));
        mapRef.current?.panTo(current, { animate: false });
      }
      if (t >= 1) {
        trailLayerRef.current?.setStyle({ color: "#22c55e" });
        arrivedTimeoutId = setTimeout(() => {
          setPlaying(false);
          setHasArrived(true);
          setShowArrivedPopup(true);
        }, 300);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(arrivedTimeoutId);
    };
  }, [playing, travelMode]);

  const startAnimation = () => {
    setProgress(0);
    setShowArrivedPopup(false);
    setHasArrived(false);
    if (trailLayerRef.current && routePointsRef.current.length > 0) {
      trailLayerRef.current.setStyle({ color: "#3b82f6" });
      trailLayerRef.current.setLatLngs([routePointsRef.current[0]]);
    }
    setPlaying(true);
  };

  return (
    <div className={fullScreen ? "flex flex-col flex-1 min-h-0 relative" : "relative"}>
      {locationStatus === "pending" && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-labelledby="location-loading-title"
        >
          <div
            className="w-full max-w-[280px] sm:max-w-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 overflow-hidden bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-xl p-4 sm:p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-white/20 border-t-amber-400 animate-spin" />
            <h2 id="location-loading-title" className="text-base sm:text-lg font-bold text-white mb-0.5 sm:mb-1">
              Getting your location
            </h2>
            <p className="text-white/80 text-xs sm:text-sm">
              Please allow location access so we can show your position and the route.
            </p>
          </div>
        </div>
      )}
      {routeStatus === "loading" && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-labelledby="route-loading-title"
        >
          <div
            className="w-full max-w-[280px] sm:max-w-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 overflow-hidden bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-xl p-4 sm:p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-full border-2 border-white/20 border-t-emerald-400 animate-spin" />
            <h2 id="route-loading-title" className="text-base sm:text-lg font-bold text-white mb-0.5 sm:mb-1">
              Calculating route
            </h2>
            <p className="text-white/80 text-xs sm:text-sm">
              Fetching road route from OSRM…
            </p>
          </div>
        </div>
      )}
      {showArrivedPopup && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowArrivedPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="arrived-title"
        >
          <div
            className="relative w-full max-w-[280px] sm:max-w-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 overflow-hidden bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {destinationImage ? (
              <div className="relative h-24 sm:h-32 md:h-36 w-full bg-white/10 shrink-0">
                <img
                  src={destinationImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/400x144/1a1f26/6e7681?text=Property`;
                  }}
                />
              </div>
            ) : null}
            <div className="p-4 sm:p-5 md:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-emerald-500/90 flex items-center justify-center text-2xl sm:text-3xl shadow-lg">
                ✓
              </div>
              <h2 id="arrived-title" className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1">
                You've arrived!
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mb-4 sm:mb-6">
                You've reached the property location.
              </p>
              <button
                type="button"
                onClick={() => setShowArrivedPopup(false)}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-white text-sm sm:text-base bg-emerald-500 hover:bg-emerald-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={fullScreen ? "flex-1 min-h-0 w-full rounded-none overflow-hidden" : "rounded-xl overflow-hidden"}
        style={fullScreen ? { minHeight: 0, height: "100%" } : { height: `${height}px` }}
      />
      <div
        ref={controlsRef}
        className={fullScreen ? "absolute md:max-w-sm flex flex-col gap-2 p-0 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 z-[1000] pointer-events-auto" : "mt-3 flex flex-col gap-2 z-10 relative"}
        style={fullScreen ? { left: controlsPosition.left, bottom: controlsPosition.bottom, maxWidth: "min(24rem, calc(100vw - 2rem))" } : undefined}
      >
        {fullScreen && (
          <div
            role="button"
            tabIndex={0}
            onPointerDown={handleControlsPointerDown}
            onPointerUp={handleControlsPointerUp}
            onPointerLeave={handleControlsPointerUp}
            className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing touch-none rounded-t-xl border-b border-white/10"
            aria-label="Drag to move"
          >
            <span className="w-10 h-1 rounded-full bg-white/40" />
          </div>
        )}
        <div className="flex flex-col gap-2 p-3 pt-2">
        {locationStatus === "pending" && (
          <p className="text-sm text-amber-300/90">Getting your location…</p>
        )}
        {locationStatus === "ok" && (
          <p className="text-sm text-white/80">Using your location</p>
        )}
        {locationStatus === "fallback" && (
          <>
            <p className="text-sm text-white/60">Using default location (Yangon)</p>
            
          </>
        )}
        {routeStatus === "loading" && (
          <p className="text-sm text-white/80">Loading road route…</p>
        )}
        {routeStatus === "road" && (
          <p className="text-sm text-emerald-400">Route follows roads (driving).</p>
        )}
        {routeStatus === "straight" && (
          <p className="text-sm text-white/70">Using straight line (routing unavailable).</p>
        )}
        <div className={`flex flex-wrap gap-1.5 ${playing || hasArrived ? "hidden sm:flex" : ""}`}>
          {(["walking", "cycling", "driving"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={playing}
              onClick={() => setTravelMode(mode)}
              className={
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors " +
                (travelMode === mode
                  ? "bg-emerald-500/90 text-white border-emerald-400"
                  : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20")
              }
            >
              {mode === "walking" && "🚶 Walking"}
              {mode === "cycling" && "🚴 Cycling"}
              {mode === "driving" && "🚗 Driving"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={startAnimation}
          disabled={playing}
          className={`px-4 py-2 bg-emerald-500 text-white border-0 rounded-lg font-semibold cursor-pointer disabled:opacity-70 hover:bg-emerald-600 ${playing ? "hidden sm:inline-flex" : ""}`}
        >
          {playing ? "Moving…" : hasArrived ? "Re-start" : "▶ Start fake trip to property"}
        </button>
        {playing && (
          <div className="relative w-full min-w-[200px] h-7 bg-white/20 rounded-lg overflow-hidden border border-white/20">
            <div
              className="absolute inset-y-0 left-0 rounded-lg bg-emerald-500 transition-[width] duration-150 ease-out min-w-0"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {Math.round(progress)}%
            </span>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

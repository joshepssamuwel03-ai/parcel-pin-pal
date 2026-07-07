import { useEffect, useRef, useState } from "react";

export type GpsStatus = "searching" | "ready" | "disabled";

export interface GpsState {
  position: [number, number] | null;
  accuracy: number | null;
  heading: number | null;
  status: GpsStatus;
}

const DEFAULT: [number, number] = [6.9271, 79.8612]; // Colombo fallback

export function useGps(active = true): GpsState & { refresh: () => void } {
  const [state, setState] = useState<GpsState>({
    position: null,
    accuracy: null,
    heading: null,
    status: "searching",
  });
  const watchId = useRef<number | null>(null);

  const start = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, status: "disabled", position: s.position ?? DEFAULT }));
      return;
    }
    setState((s) => ({ ...s, status: "searching" }));
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          status: "ready",
        });
      },
      () => {
        setState((s) => ({
          ...s,
          status: "disabled",
          position: s.position ?? DEFAULT,
        }));
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 },
    );
  };

  useEffect(() => {
    if (!active) return;
    start();
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const refresh = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    start();
  };

  return { ...state, refresh };
}

export const FALLBACK_POSITION = DEFAULT;

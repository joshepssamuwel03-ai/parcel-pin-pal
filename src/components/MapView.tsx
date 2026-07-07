import { useEffect, useRef, useState } from "react";
import type * as LT from "leaflet";
import type { Customer } from "@/lib/store";
import { markerColor, markerSvg } from "@/lib/markers";

export interface MapControl {
  flyTo: (pos: [number, number], zoom?: number) => void;
  setLayer: (type: "street" | "satellite") => void;
  getDraggedPosition: () => [number, number] | null;
}

const STREET = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export function MapView({
  position,
  accuracy,
  customers,
  selectedId,
  onSelectCustomer,
  draggable,
  controlRef,
}: {
  position: [number, number] | null;
  accuracy: number | null;
  customers: Customer[];
  selectedId?: string | null;
  onSelectCustomer?: (c: Customer) => void;
  draggable?: boolean;
  controlRef?: React.MutableRefObject<MapControl | null>;
}) {
  const el = useRef<HTMLDivElement>(null);
  const L = useRef<typeof LT | null>(null);
  const map = useRef<LT.Map | null>(null);
  const tile = useRef<LT.TileLayer | null>(null);
  const riderMarker = useRef<LT.Marker | null>(null);
  const accCircle = useRef<LT.Circle | null>(null);
  const dragMarker = useRef<LT.Marker | null>(null);
  const custLayer = useRef<LT.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const selectRef = useRef(onSelectCustomer);
  selectRef.current = onSelectCustomer;

  // init — dynamic import so Leaflet never loads during SSR
  useEffect(() => {
    let disposed = false;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      if (disposed || !el.current || map.current) return;
      L.current = leaflet;
      const m = leaflet.map(el.current, {
        center: position ?? [6.9271, 79.8612],
        zoom: 15,
        zoomControl: false,
        attributionControl: true,
      });
      tile.current = leaflet
        .tileLayer(STREET, { maxZoom: 19, attribution: "© OpenStreetMap" })
        .addTo(m);
      custLayer.current = leaflet.layerGroup().addTo(m);
      map.current = m;
      setTimeout(() => m.invalidateSize(), 200);

      if (controlRef) {
        controlRef.current = {
          flyTo: (pos, zoom = 16) => m.flyTo(pos, zoom, { duration: 0.8 }),
          setLayer: (type) => tile.current?.setUrl(type === "satellite" ? SAT : STREET),
          getDraggedPosition: () => {
            const ll = dragMarker.current?.getLatLng();
            return ll ? [ll.lat, ll.lng] : null;
          },
        };
      }
      setReady(true);
    })();
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rider marker + accuracy
  useEffect(() => {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m || !position) return;
    const icon = leaflet.divIcon({
      className: "",
      html: `<div class="gps-pulse" style="position:relative;width:20px;height:20px;color:#2563EB;transform:translate(-50%,-50%)"><div style="position:absolute;inset:0;border-radius:9999px;background:#2563EB;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.4)"></div></div>`,
      iconSize: [20, 20],
    });
    if (!riderMarker.current) {
      riderMarker.current = leaflet.marker(position, { icon, zIndexOffset: 500 }).addTo(m);
    } else {
      riderMarker.current.setLatLng(position);
    }
    if (accuracy) {
      if (!accCircle.current) {
        accCircle.current = leaflet
          .circle(position, {
            radius: accuracy,
            color: "#2563EB",
            fillColor: "#2563EB",
            fillOpacity: 0.08,
            weight: 1,
          })
          .addTo(m);
      } else {
        accCircle.current.setLatLng(position).setRadius(accuracy);
      }
    }
  }, [position, accuracy, ready]);

  // draggable add marker
  useEffect(() => {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m) return;
    if (draggable && position) {
      if (!dragMarker.current) {
        const icon = leaflet.divIcon({ className: "", html: markerSvg("#2563EB", true), iconSize: [36, 46] });
        dragMarker.current = leaflet.marker(position, { icon, draggable: true, zIndexOffset: 1000 }).addTo(m);
      } else {
        dragMarker.current.setLatLng(position);
      }
    } else if (dragMarker.current) {
      dragMarker.current.remove();
      dragMarker.current = null;
    }
  }, [draggable, position, ready]);

  // customer markers
  useEffect(() => {
    const leaflet = L.current;
    const layer = custLayer.current;
    if (!leaflet || !layer) return;
    layer.clearLayers();
    customers.forEach((c) => {
      const selected = c.id === selectedId;
      const icon = leaflet.divIcon({
        className: "",
        html: markerSvg(markerColor(c), selected),
        iconSize: [36, 46],
      });
      leaflet
        .marker([c.lat, c.lng], { icon, zIndexOffset: selected ? 800 : 0 })
        .addTo(layer)
        .on("click", () => selectRef.current?.(c));
    });
  }, [customers, selectedId, ready]);

  return <div ref={el} className="absolute inset-0" />;
}

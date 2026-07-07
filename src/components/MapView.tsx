import { useEffect, useRef } from "react";
import L from "leaflet";
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
  const map = useRef<L.Map | null>(null);
  const tile = useRef<L.TileLayer | null>(null);
  const riderMarker = useRef<L.Marker | null>(null);
  const accCircle = useRef<L.Circle | null>(null);
  const dragMarker = useRef<L.Marker | null>(null);
  const custLayer = useRef<L.LayerGroup | null>(null);
  const selectRef = useRef(onSelectCustomer);
  selectRef.current = onSelectCustomer;

  // init
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      center: position ?? [6.9271, 79.8612],
      zoom: 15,
      zoomControl: false,
      attributionControl: true,
    });
    tile.current = L.tileLayer(STREET, { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    custLayer.current = L.layerGroup().addTo(m);
    map.current = m;
    setTimeout(() => m.invalidateSize(), 200);

    if (controlRef) {
      controlRef.current = {
        flyTo: (pos, zoom = 16) => m.flyTo(pos, zoom, { duration: 0.8 }),
        setLayer: (type) => {
          tile.current?.setUrl(type === "satellite" ? SAT : STREET);
        },
        getDraggedPosition: () => {
          const ll = dragMarker.current?.getLatLng();
          return ll ? [ll.lat, ll.lng] : null;
        },
      };
    }
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rider marker + accuracy
  useEffect(() => {
    const m = map.current;
    if (!m || !position) return;
    const icon = L.divIcon({
      className: "",
      html: `<div class="gps-pulse" style="position:relative;width:20px;height:20px;color:#2563EB;transform:translate(-50%,-50%)"><div style="position:absolute;inset:0;border-radius:9999px;background:#2563EB;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.4)"></div></div>`,
      iconSize: [20, 20],
    });
    if (!riderMarker.current) {
      riderMarker.current = L.marker(position, { icon, zIndexOffset: 500 }).addTo(m);
    } else {
      riderMarker.current.setLatLng(position);
    }
    if (accuracy) {
      if (!accCircle.current) {
        accCircle.current = L.circle(position, {
          radius: accuracy,
          color: "#2563EB",
          fillColor: "#2563EB",
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(m);
      } else {
        accCircle.current.setLatLng(position).setRadius(accuracy);
      }
    }
  }, [position, accuracy]);

  // draggable add marker
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (draggable && position) {
      if (!dragMarker.current) {
        const icon = L.divIcon({ className: "", html: markerSvg("#2563EB", true), iconSize: [36, 46] });
        dragMarker.current = L.marker(position, { icon, draggable: true, zIndexOffset: 1000 }).addTo(m);
      } else {
        dragMarker.current.setLatLng(position);
      }
    } else if (dragMarker.current) {
      dragMarker.current.remove();
      dragMarker.current = null;
    }
  }, [draggable, position]);

  // customer markers
  useEffect(() => {
    const layer = custLayer.current;
    if (!layer) return;
    layer.clearLayers();
    customers.forEach((c) => {
      const selected = c.id === selectedId;
      const icon = L.divIcon({
        className: "",
        html: markerSvg(markerColor(c), selected),
        iconSize: [36, 46],
      });
      L.marker([c.lat, c.lng], { icon, zIndexOffset: selected ? 800 : 0 })
        .addTo(layer)
        .on("click", () => selectRef.current?.(c));
    });
  }, [customers, selectedId]);

  return <div ref={el} className="absolute inset-0" />;
}

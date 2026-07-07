export type CustomerStatus = "saved" | "frequent" | "favorite" | "vip";

export interface Delivery {
  id: string;
  date: string; // ISO
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark?: string;
  notes?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  favorite: boolean;
  createdAt: string;
  deliveries: Delivery[];
}

const KEY = "pclt.customers.v1";
const THEME_KEY = "pclt.theme";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): Customer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedIfEmpty();
    return JSON.parse(raw) as Customer[];
  } catch {
    return [];
  }
}

function write(list: Customer[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((l) => l());
}

function seedIfEmpty(): Customer[] {
  const now = new Date();
  const demo: Customer[] = [
    {
      id: crypto.randomUUID(),
      name: "Nimal Perera",
      phone: "0771234567",
      address: "24 Galle Road, Colombo 03",
      landmark: "Near the blue mosque",
      notes: "Ring the bell twice",
      lat: 6.9105,
      lng: 79.8508,
      accuracy: 8,
      favorite: true,
      createdAt: now.toISOString(),
      deliveries: [
        { id: crypto.randomUUID(), date: now.toISOString() },
        { id: crypto.randomUUID(), date: new Date(now.getTime() - 6e8).toISOString() },
        { id: crypto.randomUUID(), date: new Date(now.getTime() - 12e8).toISOString() },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Kamala Silva",
      phone: "0719876543",
      address: "8 Duplication Road, Bambalapitiya",
      landmark: "Green gate, 2nd floor",
      lat: 6.8905,
      lng: 79.8565,
      accuracy: 12,
      favorite: false,
      createdAt: now.toISOString(),
      deliveries: [{ id: crypto.randomUUID(), date: new Date(now.getTime() - 3e8).toISOString() }],
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(demo));
  return demo;
}

export const customerStore = {
  getAll: read,
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(data: Omit<Customer, "id" | "createdAt" | "deliveries" | "favorite">) {
    const list = read();
    const customer: Customer = {
      ...data,
      id: crypto.randomUUID(),
      favorite: false,
      createdAt: new Date().toISOString(),
      deliveries: [{ id: crypto.randomUUID(), date: new Date().toISOString() }],
    };
    write([customer, ...list]);
    return customer;
  },
  update(id: string, patch: Partial<Customer>) {
    write(read().map((c) => (c.id === id ? { ...c, ...patch } : c)));
  },
  remove(id: string) {
    write(read().filter((c) => c.id !== id));
  },
  toggleFavorite(id: string) {
    write(read().map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)));
  },
  logDelivery(id: string, note?: string) {
    write(
      read().map((c) =>
        c.id === id
          ? {
              ...c,
              deliveries: [
                { id: crypto.randomUUID(), date: new Date().toISOString(), note },
                ...c.deliveries,
              ],
            }
          : c,
      ),
    );
  },
};

export function statusOf(c: Customer): CustomerStatus {
  if (c.favorite) return "favorite";
  if (c.deliveries.length >= 3) return "frequent";
  const today = new Date().toDateString();
  if (c.deliveries.some((d) => new Date(d.date).toDateString() === today)) return "saved";
  return "saved";
}

export function deliveredToday(c: Customer): boolean {
  const today = new Date().toDateString();
  return c.deliveries.some((d) => new Date(d.date).toDateString() === today);
}

export const CREDIT = "Designed and Concept Created by RM THILINA PRASAD (Joshep)";

/* Theme helpers */
export function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
}
export function setStoredTheme(t: "light" | "dark") {
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("dark", t === "dark");
}

import { supabase } from "@/integrations/supabase/client";

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

type Listener = () => void;
const listeners = new Set<Listener>();
let customers: Customer[] = [];
let userId: string | null = null;
let syncing = false;

const THEME_KEY = "pclt.theme";

function cacheKey() {
  return `pclt.customers.${userId ?? "anon"}`;
}
function pendingKey() {
  return `pclt.pending.${userId ?? "anon"}`;
}
function deletedKey() {
  return `pclt.deleted.${userId ?? "anon"}`;
}

function loadCache() {
  if (typeof window === "undefined") return;
  try {
    customers = JSON.parse(localStorage.getItem(cacheKey()) || "[]");
  } catch {
    customers = [];
  }
}
function saveCache() {
  if (typeof window === "undefined") return;
  localStorage.setItem(cacheKey(), JSON.stringify(customers));
}
function notify() {
  listeners.forEach((l) => l());
}

function getSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}
function saveSet(key: string, s: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...s]));
}
function markPending(id: string) {
  const s = getSet(pendingKey());
  s.add(id);
  saveSet(pendingKey(), s);
}
function markDeleted(id: string) {
  const p = getSet(pendingKey());
  p.delete(id);
  saveSet(pendingKey(), p);
  const d = getSet(deletedKey());
  d.add(id);
  saveSet(deletedKey(), d);
}

function toRow(c: Customer) {
  return {
    id: c.id,
    user_id: userId!,
    name: c.name,
    phone: c.phone,
    address: c.address,
    landmark: c.landmark ?? null,
    notes: c.notes ?? null,
    lat: c.lat,
    lng: c.lng,
    accuracy: c.accuracy ?? null,
    favorite: c.favorite,
    deliveries: c.deliveries,
    created_at: c.createdAt,
  };
}

function fromRow(r: Record<string, unknown>): Customer {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    address: r.address as string,
    landmark: (r.landmark as string) ?? undefined,
    notes: (r.notes as string) ?? undefined,
    lat: r.lat as number,
    lng: r.lng as number,
    accuracy: (r.accuracy as number) ?? undefined,
    favorite: !!r.favorite,
    createdAt: (r.created_at as string) ?? new Date().toISOString(),
    deliveries: (r.deliveries as Delivery[]) ?? [],
  };
}

async function flushPending() {
  if (!userId) return;
  const pending = getSet(pendingKey());
  const deleted = getSet(deletedKey());

  if (deleted.size) {
    const ids = [...deleted];
    const { error } = await supabase.from("customers").delete().in("id", ids);
    if (!error) saveSet(deletedKey(), new Set());
  }
  if (pending.size) {
    const rows = customers.filter((c) => pending.has(c.id)).map(toRow);
    if (rows.length) {
      const { error } = await supabase.from("customers").upsert(rows);
      if (!error) saveSet(pendingKey(), new Set());
    }
  }
}

export async function syncFromCloud() {
  if (!userId || syncing) return;
  syncing = true;
  try {
    await flushPending();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      customers = data.map(fromRow);
      saveCache();
      notify();
    }
  } finally {
    syncing = false;
  }
}

export function setActiveUser(id: string | null) {
  userId = id;
  loadCache();
  notify();
  if (id) void syncFromCloud();
}

export const customerStore = {
  getAll: () => customers,
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(data: Omit<Customer, "id" | "createdAt" | "deliveries" | "favorite">) {
    const customer: Customer = {
      ...data,
      id: crypto.randomUUID(),
      favorite: false,
      createdAt: new Date().toISOString(),
      deliveries: [{ id: crypto.randomUUID(), date: new Date().toISOString() }],
    };
    customers = [customer, ...customers];
    saveCache();
    notify();
    markPending(customer.id);
    void pushOne(customer.id);
    return customer;
  },
  update(id: string, patch: Partial<Customer>) {
    customers = customers.map((c) => (c.id === id ? { ...c, ...patch } : c));
    saveCache();
    notify();
    markPending(id);
    void pushOne(id);
  },
  remove(id: string) {
    customers = customers.filter((c) => c.id !== id);
    saveCache();
    notify();
    markDeleted(id);
    void pushDelete(id);
  },
  toggleFavorite(id: string) {
    const c = customers.find((x) => x.id === id);
    if (c) customerStore.update(id, { favorite: !c.favorite });
  },
  logDelivery(id: string, note?: string) {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    customerStore.update(id, {
      deliveries: [{ id: crypto.randomUUID(), date: new Date().toISOString(), note }, ...c.deliveries],
    });
  },
};

async function pushOne(id: string) {
  if (!userId) return;
  const c = customers.find((x) => x.id === id);
  if (!c) return;
  const { error } = await supabase.from("customers").upsert(toRow(c));
  if (!error) {
    const s = getSet(pendingKey());
    s.delete(id);
    saveSet(pendingKey(), s);
  }
}
async function pushDelete(id: string) {
  if (!userId) return;
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (!error) {
    const d = getSet(deletedKey());
    d.delete(id);
    saveSet(deletedKey(), d);
  }
}

export function statusOf(c: Customer): "saved" | "frequent" | "favorite" {
  if (c.favorite) return "favorite";
  if (c.deliveries.length >= 3) return "frequent";
  return "saved";
}

export function deliveredToday(c: Customer): boolean {
  const today = new Date().toDateString();
  return c.deliveries.some((d) => new Date(d.date).toDateString() === today);
}

export const CREDIT = "Designed and Concept Created by RM THILINA PRASAD (Joshep)";

export function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
}
export function setStoredTheme(t: "light" | "dark") {
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("dark", t === "dark");
}

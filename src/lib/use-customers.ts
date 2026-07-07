import { useEffect, useState } from "react";
import { customerStore, type Customer } from "./store";

export function useCustomers(): Customer[] {
  const [list, setList] = useState<Customer[]>([]);
  useEffect(() => {
    setList(customerStore.getAll());
    const unsub = customerStore.subscribe(() => setList(customerStore.getAll()));
    return () => {
      unsub();
    };
  }, []);
  return list;
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

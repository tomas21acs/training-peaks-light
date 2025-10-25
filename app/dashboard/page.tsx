"use client";
import { useEffect, useState } from "react";
import type { ParsedWorkout } from "@/types";

export default function Dashboard() {
  const [items, setItems] = useState<ParsedWorkout[]>([]);
  useEffect(() => {
    const arr = JSON.parse(localStorage.getItem("tp-lite-history") || "[]");
    setItems(arr);
  }, []);
  return (
    <div>
      <h1>Dashboard</h1>
      {items.length === 0 && <div>Zatím žádné tréninky. Nahraj první.</div>}
      {items.map((w, i) => (
        <div key={i} style={{ border: "1px solid #eee", padding: 12, marginBottom: 8, borderRadius: 8 }}>
          <div><strong>{w.title}</strong></div>
          <div>NP {fmt(w.normalized_power)} W · IF {fmt(w.if)} · TSS {fmt(w.tss)}</div>
          <div>{fmt(w.duration_min)} min · {new Date(w.timestamp).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
const fmt = (x?: number) => (x || x === 0 ? x.toFixed(1) : "—");

"use client";
import { useState } from "react";
import type { ParsedWorkout } from "@/types";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend
} from "chart.js";
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParsedWorkout | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const buf = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, base64 })
    });

    const data: ParsedWorkout = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div>
      <h1>Nahrát trénink</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input type="file" accept=".fit,.tcx,.gpx" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button disabled={!file || loading} type="submit">
          {loading ? "Zpracovávám…" : "Spočítat metriky"}
        </button>
      </form>

      {result && (
        <div>
          <h2>Výsledky</h2>
          <p><b>Normalized Power:</b> {result.normalized_power?.toFixed(1)} W</p>
          <p><b>IF:</b> {result.if?.toFixed(2)} | <b>TSS:</b> {result.tss?.toFixed(0)}</p>
          <Line data={{
            labels: result.series.map(p => p.t / 60),
            datasets: [
              { label: "Power (W)", data: result.series.map(p => p.power ?? null), borderColor: "red", borderWidth: 1 },
              { label: "HR (bpm)", data: result.series.map(p => p.hr ?? null), borderColor: "blue", borderWidth: 1 }
            ]
          }} height={300} />
        </div>
      )}
    </div>
  );
}

"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

import type { StoredWorkout } from "@/types/workout";

type WorkoutChartProps = {
  points: StoredWorkout["points"];
};

export function WorkoutChart({ points }: WorkoutChartProps) {
  if (!points.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No chart data available yet.
      </div>
    );
  }

  const data = points.map(point => ({
    minutes: Number((point.seconds / 60).toFixed(2)),
    power: point.powerWatts,
    heartRate: point.heartRateBpm,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="minutes"
          tickFormatter={value => `${value}`}
          label={{ value: "Minutes", position: "insideBottom", offset: -4, style: { fill: "#475569", fontSize: 12 } }}
        />
        <YAxis
          yAxisId="left"
          stroke="#f87171"
          width={48}
          label={{ value: "Watts", angle: -90, position: "insideLeft", style: { fill: "#f87171", fontSize: 12 } }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#60a5fa"
          width={48}
          label={{ value: "BPM", angle: -90, position: "insideRight", style: { fill: "#60a5fa", fontSize: 12 } }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="power" name="Power" stroke="#ef4444" dot={false} strokeWidth={2} yAxisId="left" />
        <Line type="monotone" dataKey="heartRate" name="Heart rate" stroke="#3b82f6" dot={false} strokeWidth={2} yAxisId="right" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length || typeof label !== "number") {
    return null;
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-slate-700">{label.toFixed(2)} min</div>
      {payload.map(item => (
        <div key={item.dataKey} className="text-slate-600">
          {item.dataKey === "power" ? "Power" : "Heart rate"}: {Math.round(Number(item.value))}
          {item.dataKey === "power" ? " W" : " bpm"}
        </div>
      ))}
    </div>
  );
}

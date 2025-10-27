import FitParser from "fit-file-parser";
import { Parser as XmlParser } from "xml2js";

import type { ParsedWorkout, WorkoutMetrics, WorkoutPoint } from "@/types/workout";

type StoredPoint = { seconds: number; powerWatts?: number; heartRateBpm?: number };

export const SUPPORTED_EXTENSIONS = ["fit", "tcx"] as const;

export function isSupportedWorkoutFile(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension != null && SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number]);
}

export async function parseWorkoutFile(file: File): Promise<ParsedWorkout> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !isSupportedWorkoutFile(file.name)) {
    throw new Error("Only .fit and .tcx files are supported");
  }

  if (extension === "fit") {
    const points = await parseFitFile(await file.arrayBuffer());
    return { metrics: computeMetrics(points), points };
  }

  const points = await parseTcxFile(await file.text());
  return { metrics: computeMetrics(points), points };
}

async function parseFitFile(buffer: ArrayBuffer): Promise<WorkoutPoint[]> {
  const parser = new FitParser({ force: true, speedUnit: "km/h" });

  return new Promise((resolve, reject) => {
    parser.parse(buffer, (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      const records: Array<Record<string, unknown>> = Array.isArray(data?.records) ? data.records : [];
      const points: WorkoutPoint[] = [];
      let startTimestamp: number | null = null;

      for (const record of records) {
        const timestampValue = record.timestamp;
        if (!timestampValue) continue;
        const timestampSeconds = new Date(String(timestampValue)).getTime() / 1000;
        if (Number.isNaN(timestampSeconds)) continue;
        if (startTimestamp == null) startTimestamp = timestampSeconds;

        const point: WorkoutPoint = {
          seconds: startTimestamp != null ? timestampSeconds - startTimestamp : 0,
        };

        if (typeof record.power === "number") point.powerWatts = record.power;
        if (typeof record.heart_rate === "number") point.heartRateBpm = record.heart_rate;
        if (typeof record.distance === "number") point.distanceMeters = record.distance;

        points.push(point);
      }

      resolve(points.sort((a, b) => a.seconds - b.seconds));
    });
  });
}

async function parseTcxFile(xml: string): Promise<WorkoutPoint[]> {
  const parser = new XmlParser();
  const document = await parser.parseStringPromise(xml);

  const activities = document?.TrainingCenterDatabase?.Activities?.[0]?.Activity ?? [];
  const points: WorkoutPoint[] = [];
  let startTimestamp: number | null = null;

  const tryReadNumber = (input: unknown): number | undefined => {
    const numeric = Number(input);
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  for (const activity of activities) {
    const laps = activity?.Lap ?? [];
    for (const lap of laps) {
      const trackPoints = lap?.Track?.[0]?.Trackpoint ?? [];
      for (const trackPoint of trackPoints) {
        const rawTime = trackPoint?.Time?.[0];
        if (!rawTime) continue;
        const timestampSeconds = new Date(String(rawTime)).getTime() / 1000;
        if (Number.isNaN(timestampSeconds)) continue;
        if (startTimestamp == null) startTimestamp = timestampSeconds;

        const point: WorkoutPoint = {
          seconds: timestampSeconds - startTimestamp,
        };

        const hrValue = trackPoint?.HeartRateBpm?.[0]?.Value?.[0];
        const hrNumber = tryReadNumber(hrValue);
        if (hrNumber !== undefined) point.heartRateBpm = hrNumber;

        const distanceValue = trackPoint?.DistanceMeters?.[0];
        const distanceNumber = tryReadNumber(distanceValue);
        if (distanceNumber !== undefined) point.distanceMeters = distanceNumber;

        const extensions = trackPoint?.Extensions?.[0];
        const tpx =
          extensions?.TPX?.[0] ??
          extensions?.["ns3:TPX"]?.[0] ??
          extensions?.["ns2:TPX"]?.[0] ??
          extensions?.["TrainingCenterDatabasev2:TPX"]?.[0];
        const wattsValue = tpx?.Watts?.[0] ?? tpx?.["ns3:Watts"]?.[0] ?? tpx?.["ns2:Watts"]?.[0];
        const powerNumber = tryReadNumber(wattsValue);
        if (powerNumber !== undefined) point.powerWatts = powerNumber;

        points.push(point);
      }
    }
  }

  return points.sort((a, b) => a.seconds - b.seconds);
}

function computeMetrics(points: WorkoutPoint[]): WorkoutMetrics {
  if (points.length === 0) {
    return { totalTimeSeconds: 0 };
  }

  const totalTimeSeconds = points[points.length - 1].seconds;
  const distances = points
    .map(point => point.distanceMeters)
    .filter((value): value is number => value !== undefined);
  const totalDistanceMeters = distances.length ? Math.max(...distances) : undefined;

  const average = (values: Array<number | undefined>) => {
    const filtered = values.filter((value): value is number => value !== undefined);
    if (filtered.length === 0) return undefined;
    const sum = filtered.reduce((acc, value) => acc + value, 0);
    return sum / filtered.length;
  };

  return {
    totalTimeSeconds,
    totalDistanceMeters,
    avgPowerWatts: average(points.map(point => point.powerWatts)),
    avgHeartRateBpm: average(points.map(point => point.heartRateBpm)),
  };
}

export function preparePointsForStorage(points: WorkoutPoint[], intervalSeconds = 5): StoredPoint[] {
  if (points.length === 0) return [];

  const sanitized: StoredPoint[] = [];
  let lastSavedSecond = -Infinity;

  points.forEach((point, index) => {
    const shouldSave =
      sanitized.length === 0 ||
      point.seconds - lastSavedSecond >= intervalSeconds ||
      index === points.length - 1;

    if (!shouldSave) return;

    sanitized.push({
      seconds: Math.round(point.seconds),
      ...(point.powerWatts !== undefined
        ? { powerWatts: Math.round(point.powerWatts * 10) / 10 }
        : {}),
      ...(point.heartRateBpm !== undefined
        ? { heartRateBpm: Math.round(point.heartRateBpm) }
        : {}),
    });

    lastSavedSecond = point.seconds;
  });

  return sanitized;
}

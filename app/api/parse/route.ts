import { NextRequest } from "next/server";
const Fit = require("fit-file-parser").default;
import { Parser } from "xml2js";

type Point = { t: number; power?: number; hr?: number; speed_kmh?: number; };

export async function POST(req: NextRequest) {
  try {
    const { filename, base64 } = await req.json();
    const buf = Buffer.from(base64, "base64");

    let series: Point[] = [];
    const ext = (filename.split(".").pop() || "").toLowerCase();

    if (ext === "fit") series = await parseFIT(buf);
    else if (ext === "tcx") series = await parseTCX(buf);
    else if (ext === "gpx") series = await parseGPX(buf);
    else return Response.json({ error: "Unsupported file type" }, { status: 400 });

    // --- výpočty metrik ---
    const avg = (arr: (number | undefined)[]) => {
      const vals = arr.filter((x): x is number => x != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
    };

    const avg_power = avg(series.map(s => s.power));
    const avg_hr = avg(series.map(s => s.hr));
    const avg_speed_kmh = avg(series.map(s => s.speed_kmh));
    const duration = series.length ? series[series.length - 1].t - series[0].t : 0;
    const np = normalizedPower(series.map(s => s.power ?? 0));
    const ftp = 250; // později načteme z nastavení uživatele
    const IF = np ? np / ftp : undefined;
    const TSS = np && IF ? ((duration * np * IF) / (ftp * 3600)) * 100 : undefined;

    return Response.json({
      filename,
      title: filename.replace(/\.[^.]+$/, ""),
      timestamp: Date.now(),
      duration_min: duration / 60,
      avg_power, avg_hr, avg_speed_kmh,
      normalized_power: np, if: IF, tss: TSS,
      series
    });
  } catch (err: any) {
    console.error("Error parsing file:", err);
    return Response.json({ error: err?.message || "Parsing failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// FIT parser
async function parseFIT(buf: Buffer): Promise<Point[]> {
  const fit = new Fit({ force: true, speedUnit: "km/h" });
  return new Promise((resolve, reject) => {
    fit.parse(buf.buffer, (err: any, data: any) => {
      if (err) return reject(err);
      const rec = data.records || [];
      if (!rec.length) return resolve([]);
      const t0 = new Date(rec[0].timestamp).getTime() / 1000;
      const out = rec.map((r: any) => ({
        t: new Date(r.timestamp).getTime() / 1000 - t0,
        power: r.power ?? undefined,
        hr: r.heart_rate ?? undefined,
        speed_kmh: r.speed ?? undefined
      }));
      resolve(out);
    });
  });
}

// ---------------------------------------------------------------
// TCX parser
async function parseTCX(buf: Buffer): Promise<Point[]> {
  const xml = buf.toString("utf8");
  const parser = new Parser();
  const doc = await parser.parseStringPromise(xml);
  const laps = doc?.TrainingCenterDatabase?.Activities?.[0]?.Activity?.[0]?.Lap || [];
  const points: Point[] = [];
  let t0: number | null = null;

  for (const lap of laps) {
    const track = lap.Track?.[0]?.Trackpoint || [];
    for (const p of track) {
      const ts = p.Time?.[0] ? new Date(p.Time[0]).getTime() / 1000 : null;
      if (ts == null) continue;
      if (t0 == null) t0 = ts;
      const ext = p.Extensions?.[0]?.TPX?.[0];
      const watts = ext?.Watts?.[0] ? Number(ext.Watts[0]) : undefined;
      const hr = p.HeartRateBpm?.[0]?.Value?.[0] ? Number(p.HeartRateBpm[0].Value[0]) : undefined;
      const speed = ext?.Speed?.[0] ? Number(ext.Speed[0]) * 3.6 : undefined;
      points.push({ t: ts - t0, power: watts, hr, speed_kmh: speed });
    }
  }
  return points;
}

// ---------------------------------------------------------------
// GPX parser
async function parseGPX(buf: Buffer): Promise<Point[]> {
  const xml = buf.toString("utf8");
  const parser = new Parser();
  const doc = await parser.parseStringPromise(xml);
  const segs = doc?.gpx?.trk?.[0]?.trkseg || [];
  const points: Point[] = [];
  let t0: number | null = null;

  for (const seg of segs) {
    for (const p of seg.trkpt || []) {
      const ts = p.time?.[0] ? new Date(p.time[0]).getTime() / 1000 : null;
      if (ts == null) continue;
      if (t0 == null) t0 = ts;
      const hr = p.extensions?.[0]?.["gpxtpx:TrackPointExtension"]?.[0]?.["gpxtpx:hr"]?.[0];
      points.push({ t: ts - t0, hr: hr ? Number(hr) : undefined });
    }
  }
  return points;
}

// ---------------------------------------------------------------
// Výpočet Normalized Power
function normalizedPower(power: number[]) {
  if (power.length === 0) return undefined;
  const roll = movingAvg(power, 30);
  const mean4 = roll.reduce((a, b) => a + Math.pow(b, 4), 0) / roll.length;
  return Math.pow(mean4, 0.25);
}

function movingAvg(arr: number[], window: number) {
  const res: number[] = [];
  let sum = 0;
  const q: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    q.push(arr[i]);
    if (q.length > window) sum -= q.shift()!;
    res.push(sum / q.length);
  }
  return res;
}

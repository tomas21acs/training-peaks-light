export type SeriesPoint = { t: number; power?: number; hr?: number; speed_kmh?: number; };

export type ParsedWorkout = {
  filename: string;
  title: string;
  timestamp: number;
  duration_min?: number;
  avg_power?: number;
  avg_hr?: number;
  avg_speed_kmh?: number;
  normalized_power?: number;
  if?: number;
  tss?: number;
  series: SeriesPoint[];
};

export type WorkoutPoint = {
  seconds: number;
  powerWatts?: number;
  heartRateBpm?: number;
  distanceMeters?: number;
};

export type WorkoutMetrics = {
  totalTimeSeconds: number;
  totalDistanceMeters?: number;
  avgPowerWatts?: number;
  avgHeartRateBpm?: number;
};

export type ParsedWorkout = {
  metrics: WorkoutMetrics;
  points: WorkoutPoint[];
};

export type StoredWorkout = WorkoutMetrics & {
  id: string;
  fileName: string;
  storagePath: string;
  uploadedAt: number;
  aiSummary?: string;
  points: Array<{
    seconds: number;
    powerWatts?: number;
    heartRateBpm?: number;
  }>;
};

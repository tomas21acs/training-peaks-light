"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import { WorkoutChart } from "@/components/WorkoutChart";
import { useAuth } from "@/components/AuthProvider";
import { formatAverage, formatDistance, formatDuration } from "@/lib/format";
import { firestore } from "@/lib/firebase";
import type { StoredWorkout } from "@/types/workout";

type WorkoutListItem = StoredWorkout;

type FirestoreWorkout = Omit<StoredWorkout, "id"> & { points?: StoredWorkout["points"] };

export default function DashboardPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setWorkouts([]);
      setSelectedId(null);
      return;
    }

    setFetching(true);
    const workoutsRef = collection(firestore, "users", user.uid, "workouts");
    const q = query(workoutsRef, orderBy("uploadedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const items: WorkoutListItem[] = snapshot.docs.map(doc => mapWorkoutDoc(doc.id, doc.data() as FirestoreWorkout));
        setWorkouts(items);
        setSelectedId(prev => {
          if (prev && items.some(item => item.id === prev)) return prev;
          return items[0]?.id ?? null;
        });
        setFetching(false);
        setError(null);
      },
      err => {
        console.error("Failed to load workouts", err);
        setError(err.message);
        setFetching(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const selectedWorkout = useMemo(
    () => workouts.find(workout => workout.id === selectedId) ?? null,
    [workouts, selectedId]
  );

  if (loading) {
    return <div className="text-sm text-slate-500">Checking authentication…</div>;
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Your workouts in one place</h1>
        <p className="mt-3 text-sm text-slate-600">
          Connect your Google account to sync uploads and see AI-powered insights for each ride.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={signInWithGoogle}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">Review all of your uploaded workouts and dive into the details.</p>
        </div>
        <Link
          href="/upload"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          Upload another file
        </Link>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 md:grid-cols-[260px,1fr]">
        <aside className="space-y-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Workouts</div>
          <div className="space-y-2">
            {fetching && workouts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading workouts…</div>
            ) : workouts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                No workouts yet. <Link href="/upload" className="font-medium">Upload your first ride</Link> to see stats here.
              </div>
            ) : (
              workouts.map(workout => (
                <button
                  key={workout.id}
                  onClick={() => setSelectedId(workout.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    workout.id === selectedId
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{workout.fileName}</span>
                    <span className="text-xs opacity-75">{formatDate(workout.uploadedAt)}</span>
                  </div>
                  <div className="mt-1 text-xs opacity-75">
                    {formatDuration(workout.totalTimeSeconds)} · {formatDistance(workout.totalDistanceMeters)}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="space-y-6">
          {selectedWorkout ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{selectedWorkout.fileName}</h2>
                    <p className="text-sm text-slate-500">Uploaded {formatFullDate(selectedWorkout.uploadedAt)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 md:grid-cols-4">
                    <Metric label="Duration" value={formatDuration(selectedWorkout.totalTimeSeconds)} />
                    <Metric label="Distance" value={formatDistance(selectedWorkout.totalDistanceMeters)} />
                    <Metric label="Avg Power" value={formatAverage(selectedWorkout.avgPowerWatts, " W")} />
                    <Metric label="Avg HR" value={formatAverage(selectedWorkout.avgHeartRateBpm, " bpm")} />
                  </div>
                </div>
                {selectedWorkout.aiSummary && (
                  <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <span className="font-semibold">AI insight:</span> {selectedWorkout.aiSummary}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Power &amp; heart rate</h3>
                <p className="text-sm text-slate-500">Visualise how your effort changed through the ride.</p>
                <div className="mt-4">
                  <WorkoutChart points={selectedWorkout.points} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
              Select a workout to see detailed analytics.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function mapWorkoutDoc(id: string, data: FirestoreWorkout): WorkoutListItem {
  const toNumber = (value: unknown) => (typeof value === "number" ? value : undefined);
  const toStringValue = (value: unknown, fallback: string) => (typeof value === "string" && value.trim() ? value : fallback);

  const points = Array.isArray(data.points)
    ? data.points
        .map(point => ({
          seconds: toNumber(point.seconds) ?? 0,
          ...(toNumber(point.powerWatts) !== undefined ? { powerWatts: toNumber(point.powerWatts) } : {}),
          ...(toNumber(point.heartRateBpm) !== undefined ? { heartRateBpm: toNumber(point.heartRateBpm) } : {}),
        }))
        .sort((a, b) => a.seconds - b.seconds)
    : [];

  return {
    id,
    fileName: toStringValue(data.fileName, "Workout"),
    storagePath: toStringValue(data.storagePath, ""),
    uploadedAt: typeof data.uploadedAt === "number" ? data.uploadedAt : Date.now(),
    totalTimeSeconds: toNumber(data.totalTimeSeconds) ?? 0,
    totalDistanceMeters: toNumber(data.totalDistanceMeters),
    avgPowerWatts: toNumber(data.avgPowerWatts),
    avgHeartRateBpm: toNumber(data.avgHeartRateBpm),
    aiSummary: typeof data.aiSummary === "string" ? data.aiSummary : undefined,
    points,
  };
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
}

function formatFullDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

import { useAuth } from "@/components/AuthProvider";
import { generateAiSummary } from "@/lib/ai";
import { formatAverage, formatDistance, formatDuration } from "@/lib/format";
import { firestore, storage } from "@/lib/firebase";
import { preparePointsForStorage, parseWorkoutFile, SUPPORTED_EXTENSIONS } from "@/lib/workouts";
import type { ParsedWorkout } from "@/types/workout";

type LastUpload = {
  fileName: string;
  metrics: ParsedWorkout["metrics"];
  aiSummary: string;
};

export default function UploadPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<LastUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setError(null);
    setLastUpload(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError("Please sign in to upload workouts.");
      return;
    }
    if (!file) {
      setError("Select a .fit or .tcx file to continue.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
      setError("Unsupported file type. Please upload a .fit or .tcx file.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const storagePath = `users/${user.uid}/workouts/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);

      const parsedWorkout = await parseWorkoutFile(file);
      const aiSummary = await generateAiSummary(parsedWorkout);

      const workoutPayload = {
        fileName: file.name,
        storagePath,
        uploadedAt: Date.now(),
        totalTimeSeconds: parsedWorkout.metrics.totalTimeSeconds,
        ...(parsedWorkout.metrics.totalDistanceMeters !== undefined
          ? { totalDistanceMeters: parsedWorkout.metrics.totalDistanceMeters }
          : {}),
        ...(parsedWorkout.metrics.avgPowerWatts !== undefined
          ? { avgPowerWatts: parsedWorkout.metrics.avgPowerWatts }
          : {}),
        ...(parsedWorkout.metrics.avgHeartRateBpm !== undefined
          ? { avgHeartRateBpm: parsedWorkout.metrics.avgHeartRateBpm }
          : {}),
        aiSummary,
        points: preparePointsForStorage(parsedWorkout.points),
      };

      await addDoc(collection(firestore, "users", user.uid, "workouts"), workoutPayload);

      setLastUpload({ fileName: file.name, metrics: parsedWorkout.metrics, aiSummary });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Failed to upload workout", err);
      const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Checking authentication…</div>;
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Upload your ride files</h1>
        <p className="mt-3 text-sm text-slate-600">Sign in with Google to link uploads to your account and unlock AI summaries.</p>
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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Upload a workout</h1>
        <p className="text-sm text-slate-600">Choose a .fit or .tcx file to store it in Firebase and extract the key metrics automatically.</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_EXTENSIONS.map(ext => `.${ext}`).join(",")}
            onChange={onFileChange}
            className="w-full cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!file || uploading}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-70"
          >
            {uploading ? "Uploading…" : "Upload workout"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Supported formats: {SUPPORTED_EXTENSIONS.map(ext => `.${ext}`).join(", ")}</p>
      </form>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {lastUpload && !error && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-emerald-900">Upload saved</h2>
              <p className="text-sm text-emerald-800">{lastUpload.fileName}</p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:border-emerald-400"
            >
              View in dashboard
            </Link>
          </div>
          <div className="mt-4 grid gap-4 text-sm text-emerald-900 md:grid-cols-4">
            <Metric label="Duration" value={formatDuration(lastUpload.metrics.totalTimeSeconds)} />
            <Metric label="Distance" value={formatDistance(lastUpload.metrics.totalDistanceMeters)} />
            <Metric label="Avg Power" value={formatAverage(lastUpload.metrics.avgPowerWatts, " W")} />
            <Metric label="Avg HR" value={formatAverage(lastUpload.metrics.avgHeartRateBpm, " bpm")} />
          </div>
          <div className="mt-4 rounded-lg border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900">
            <span className="font-semibold">AI insight:</span> {lastUpload.aiSummary}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

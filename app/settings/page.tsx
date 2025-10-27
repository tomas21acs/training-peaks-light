"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [ftp, setFtp] = useState<number>(250);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = Number(localStorage.getItem("tp-lite-ftp") || 250);
    if (Number.isFinite(stored)) {
      setFtp(stored);
    }
  }, []);

  const onSave = () => {
    localStorage.setItem("tp-lite-ftp", String(ftp));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Personal settings</h1>
        <p className="text-sm text-slate-600">Configure default training values used across the dashboard.</p>
      </div>
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">FTP (Functional Threshold Power)</label>
        <p className="mt-1 text-xs text-slate-500">Used to calculate intensity metrics such as IF and TSS.</p>
        <input
          type="number"
          value={ftp}
          onChange={event => setFtp(Number(event.target.value))}
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          min={100}
          max={500}
        />
        <button
          onClick={onSave}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Save settings
        </button>
        {saved && <div className="mt-3 text-sm text-emerald-600">Saved!</div>}
      </div>
    </div>
  );
}

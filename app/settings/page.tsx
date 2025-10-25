"use client";
import { useEffect, useState } from "react";

export default function Settings() {
  const [ftp, setFtp] = useState(250);
  useEffect(() => {
    const f = Number(localStorage.getItem("tp-lite-ftp") || "250");
    setFtp(f);
  }, []);
  return (
    <div>
      <h1>Nastavení</h1>
      <label>FTP (W): </label>
      <input type="number" value={ftp} onChange={e => setFtp(Number(e.target.value))} />
      <button onClick={() => {
        localStorage.setItem("tp-lite-ftp", String(ftp));
        alert("Uloženo");
      }}>Uložit</button>
    </div>
  );
}

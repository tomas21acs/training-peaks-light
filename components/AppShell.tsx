"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useMemo } from "react";

import { useAuth } from "@/components/AuthProvider";

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Sign-out failed", error);
    }
  };

  const navLinks = useMemo(
    () => [
      { href: "/upload", label: "Upload" },
      { href: "/dashboard", label: "Dashboard" },
    ],
    []
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/upload" className="text-lg font-semibold tracking-wide text-slate-900">
              TP Lite
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={isActive ? "text-slate-900" : "transition hover:text-slate-900"}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-sm text-slate-500">Loading…</span>
            ) : user ? (
              <>
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "Profile"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium text-slate-900">{user.displayName}</span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}

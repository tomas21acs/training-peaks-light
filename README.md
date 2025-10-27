# TP Lite 🚴‍♂️

A lightweight, Firebase-backed prototype of an AI-assisted cycling training dashboard built with Next.js.

## Features
- Google authentication via Firebase Auth (per-user data isolation)
- Upload `.fit` or `.tcx` workout files directly to Firebase Storage
- Automatic parsing of key ride metrics (duration, distance, average power & heart rate)
- AI summary placeholder that generates a motivational recap for each session
- Dashboard with workout history, metric highlights, and power/HR charts powered by Recharts
- Personal FTP preference stored locally for future intensity calculations

## Getting started
```bash
npm install
npm run dev
```

Create an `.env.local` file with your Firebase project credentials before running the app:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Then visit `http://localhost:3000` to sign in with Google, upload rides, and explore the dashboard.

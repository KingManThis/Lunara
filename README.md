# Lunara: private period & cycle tracker

A period tracker that keeps all data on the user's device: no account, no server, no tracking.

**Features**
- Predicts the next period, ovulation and fertile window from the user's own history
  (average of the last 6 cycles; settings are used until two periods are logged)
- Today screen with a cycle ring, cycle day, phase and tips
- Calendar with logged, predicted, fertile and ovulation days; tap any past day to log it
- Daily log: flow (spotting → heavy), 14 symptoms, 10 moods, sex, basal temperature, notes
- Insights: average cycle and period length, range, regularity, recent cycles, most-logged symptoms and moods
- Settings: cycle defaults, 4-digit PIN lock (re-locks when the app is backgrounded), backup export/restore, delete all data
- Installable (PWA), works offline, light and dark mode

**Stack:** React + Vite + TypeScript. Data in `localStorage`. Cycle maths in `src/lib/cycle.ts` with tests (`npm test`).

## Develop
```bash
npm install
npm run dev     # local dev server
npm test        # cycle engine tests
npm run build
```

## Deploy
Pushing to `main` runs tests, builds and publishes to GitHub Pages (Settings → Pages → Source: GitHub Actions).

## Towards the App Store
The app is built so it can be wrapped as a native iOS/Android app with [Capacitor](https://capacitorjs.com) without a rewrite:
`npm i @capacitor/core @capacitor/cli @capacitor/ios`, `npx cap init`, `npm run build`, `npx cap add ios`, open in Xcode.
Before submitting: Apple Developer account ($99/year), a privacy policy URL, App Privacy answers ("Data Not Collected"
fits this design), screenshots, and health-app review notes (estimates only, not contraception).
For native storage that survives cache clearing, move from `localStorage` to Capacitor Preferences or SQLite.

## Disclaimer
Predictions are estimates for information only. Not medical advice and not a method of contraception.

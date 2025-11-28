# Solo Leveling System — Progressive Web App (PWA) support and Android optimizations

This repository is a local-first gamified system that supports PWA features and offline caching.

## What I changed (mobile / Android-focused)
- Added `manifest.json` and simple icons in `/icons`.
- Added a service worker (`service-worker.js`) with caching and offline fallback (`offline.html`).
- Added an install button (`#installBtn`) to `index.html` and handled the `beforeinstallprompt` event in `app.js`.
- Adjusted `styles.css` for safer insets and touch targets on mobile/standalone displays.
- Created a `.gitignore` with common entries.

## How to test on Android / desktop
1. Host the site locally (recommended using a simple static server like `http-server`) or deploy to a remote host.

To run locally (PowerShell):
```
npm install --global http-server
cd "C:\\Users\\priya\\OneDrive\\Desktop\\Solo Lefeling System"
http-server -c-1 .
```

2. Open the site in Chrome for Android (or desktop Chrome and use Device Toolbar emulation).
3. Confirm that the Chrome install banner is available and that tapping the `Install` button triggers the native install UI.
4. Try going offline (toggle devtools offline or disable network on your phone) and verify the app serves `offline.html` for navigations.
5. Verify icons and `manifest.json` are detected (Chrome DevTools → Application → Manifest).

### Verify Settings modal & Danger Zone on Mobile
- Open Settings (top-right → Settings) while on mobile or using Device Toolbar.
- Ensure the modal's header and the "Danger zone" section (Reset everything) are visible and reachable by scrolling.
- When the virtual keyboard is open (e.g., focus the Username field), verify the modal scrolls correctly and the Danger Zone button is not permanently hidden.
If you find the Danger Zone content is still clipped, try closing the keyboard and scroll within the modal — the layout uses a sticky header and safe-area padding for visibility.

## Developer notes
- If you edit `service-worker.js`, you may need to `unregister` existing workers in DevTools and reload the page to reload the new service worker during development.
- To test updates, change the `PRECACHE_URLS` or bump the cache name (currently `solo-v1-static`) and reload the site.

## Files added/updated
- `manifest.json` — PWA manifest
- `service-worker.js` — Offline caching + assets
- `offline.html` — Offline page
- `icons/*` — Simple SVG icons (192px and 512px)
- `index.html` — Linked manifest, added install button
- `app.js` — Service worker registration, install prompt
- `styles.css` — Mobile/standalone & safe area improvements

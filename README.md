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

## Deployment (GitHub Pages)
1. Push your commits to the `master` branch of the repo on GitHub (we did not push automatically).
2. The included GitHub Actions workflow `.github/workflows/deploy.yml` will automatically build and deploy the `master` branch contents to the `gh-pages` branch on push.
3. After the workflow completes (Actions → Select the workflow → Open latest run), your site will be published at:
	- https://<username>.github.io/<repo-name>/ (if repo is public)

Notes:
- The workflow will use the repository root as publish directory. If you prefer a static build step, modify `publish_dir` in the workflow.
- If you want the site at https://<username>.github.io (without the repo path), use `username.github.io` as the repo name and set Pages source to gh-pages branch.
- If the GitHub Pages path does not behave as expected, confirm `start_url` in `manifest.json` and service worker URLs are correct (we now use relative paths which usually work).

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

# Timo Music — YouTube Music Playlist Site

This repository contains a small static site that embeds a YouTube Music playlist and provides an optional client-side UI to fetch playlist titles and thumbnails using the YouTube Data API.

Live behavior
- The page embeds your playlist so visitors stream directly from YouTube — audio is not hosted here.
- If you provide a YouTube Data API v3 key in the page input, the site will fetch playlist items (titles + thumbnails) client-side and allow selecting tracks.

Files added
- `index.html` — main site with embedded playlist and UI
- `assets/styles.css` — dark theme styles
- `js/app.js` — client-side code to fetch playlist items when an API key is provided
- `.github/workflows/pages.yml` — GitHub Actions workflow to deploy the site to GitHub Pages (automatically runs on push to `main` and publishes to `gh-pages` branch)

Deployment
1. Enable GitHub Pages for this repository (Settings → Pages). The included workflow publishes to the `gh-pages` branch, and the Pages site will typically be available at:
   `https://<your-username>.github.io/Timo-music`

2. The workflow runs automatically on pushes to `main` and will publish the repository root to `gh-pages`.

YouTube API key options
- Client-side (default): paste your YouTube Data API key into the site input (in the browser) and click "Load playlist details" — this keeps the key off the repository.
- Server-side (optional): if you prefer server-side fetching, we can modify the workflow to inject an API key stored in repository secrets and fetch at deploy time. Tell me if you want that; I will not add any keys to the repo.

Notes
- Do not commit private API keys to this repo. Use GitHub Secrets if you want automated builds that require keys.
- This site embeds YouTube content and respects YouTube's terms. It does not download or re-host audio.

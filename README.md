# Chinese Web Reader

A pure client-side web application for reading Chinese articles and novels. It supports HTML file uploads, Simplified to Traditional Chinese conversion (with auto-translation of mainland terms to Taiwan terminology), smart global string replacements, and offline browser storage capable of handling massive texts.

## Features
- **Offline Library (IndexedDB)**: Utilizes `localforage` for storage, allowing you to save novels with millions of characters without hitting the capacity limits of traditional LocalStorage.
- **Auto-Titling**: Automatically names the article based on the uploaded file's name.
- **Smart S2T Conversion**: Built-in `opencc-js` to convert Simplified Chinese to Traditional Chinese, with automatic handling of Taiwan-specific terminology (e.g., converting "屏幕" to "螢幕").
- **Advanced Replacement Dictionary**:
  - General String Replacement: Perfect for replacing continuous strings (e.g., changing character names throughout the entire article).
  - Smart Word Replacement: Powered by the browser's native `Intl.Segmenter`. Accurately replaces independent words without false positives (e.g., safely replacing "嚴" with "周" without accidentally altering the word "嚴重").
- **Reading Settings & Table of Contents**: Supports Light/Dark/Paper themes, font size adjustments, and automatically extracts HTML `<h3>` tags to build a quick-jump Table of Contents sidebar.

## Deployment & Setup

This project supports rapid deployment using Docker and can be integrated with Cloudflare Tunnel to serve traffic externally.

### 1. Local Development
Ensure you have Node.js installed (v18+ recommended).
```bash
npm install
npm run dev
```

### 2. Docker Deployment
The project includes a multi-stage `Dockerfile` and `docker-compose.yml` that builds the React application and serves it via Nginx, defaulting to port `8001` on the host machine.

```bash
# Start the service
docker-compose up -d --build

# Stop the service
docker-compose down -v
```

Once started, open `http://localhost:8001/library` in your browser.

### 3. Cloudflare Tunnel Integration
The `docker-compose.yml` in this project includes a `cloudflared` service configured to use Local Config mode. Upon container startup, it automatically routes traffic from port `8001` to `app.carlostsai.com/library`.

**Important Note on Storage:**
Because all data is stored exclusively in your device's browser (IndexedDB), please remember:
A novel uploaded on your computer's browser can only be read on that specific computer. Similarly, novels uploaded on your phone will only be saved on that phone. If you clear your browser's site data or cache, your saved articles will be lost.

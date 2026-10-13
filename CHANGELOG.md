# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-10-13

### Fixed
- **Real Chrome Tab & Window Scraping**: Replaced mock tabs fallback with genuine browser tab scraping via `chrome.windows.getAll({ populate: true })` and `chrome.tabs.query()`.
- **Eliminated Fake/Random Tabs**: Ensured hosted web pages never show hardcoded mock tabs disguised as real tabs; returns empty state unless demo mode is explicitly enabled.
- **Handling Navigating / Pending Tabs**: Tab URLs now resolve `tab.url || tab.pendingUrl` to prevent blank or missing titles during page loads.

### Added
- **Content Script Extension Bridge**: Added `content-bridge.js` to automatically relay tab queries between hosted dashboards (`localhost`, `*.vercel.app`) and the extension service worker.
- **Web Preview Mode Banner & Guide**: Added informative security notification and setup modal explaining browser sandbox restrictions with step-by-step instructions for loading into Chrome.
- **Explicit Demo Mode**: Added toggleable demo preview mode allowing users to explore the dashboard layout with sample tabs on demand.
- **Real-Time Tab Event Listeners**: Added live listeners for `chrome.tabs.onCreated`, `onUpdated`, `onRemoved`, and `chrome.windows` events.

---

## [1.0.0] - 2026-10-13

### Added
- **Chrome Manifest V3 Architecture**: Event-driven background service worker with live badge counter and keyboard shortcuts (`Ctrl+Shift+E`, `Ctrl+Shift+S`).
- **Live Tab Management**: Real-time cross-window tab list, multi-selection, batch actions, search, pin/unpin, and native Chrome tab grouping.
- **Session Manager**: Snapshot open windows and workspaces into named sessions; duplicate-safe restoration with progress reporting.
- **Custom Workspaces**: Organize tabs and sessions into distinct workspaces (Work, Personal, Research) with custom colors and auto-seeding.
- **Smart Duplicate Detection**: Conservative URL canonicalization stripping tracking parameters (`utm_*`, `fbclid`, etc.) while preserving functional identifiers, with retention rules (`keep-active`, `keep-oldest`, `keep-newest`) and pinned tab protection.
- **Unified Search**: Fast multi-entity search across open tabs, sessions, workspaces, and saved bookmarks with category filters.
- **Recently Closed Recovery**: Seamless recovery of closed tabs and windows via `chrome.sessions`.
- **Local-First Storage**: Durable IndexedDB persistence (`TabPilotDB` v1) with versioned migrations and soft-delete tombstones.
- **Backup & Export**: Full JSON export and schema-validated import with database storage quota meter.
- **Optional Cloud Sync & AI**: Opt-in Supabase sync with PostgreSQL RLS tables, and local heuristic fallback + remote proxy for AI clustering and page summaries.
- **Local Preview Server**: Standalone browser portal for quick testing and UI exploration.
- **CI & Quality Assurance**: GitHub Actions CI workflow, Vitest test suite with 47 tests, strict TypeScript, and ESLint.

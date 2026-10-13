# TabPilot 🧭

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38b2ac.svg)](https://tailwindcss.com/)

> **Production-quality, privacy-conscious AI tab organizer, session restore, workspace manager, and duplicate tab cleaner browser extension.**

TabPilot helps you organize open tabs across windows, snapshot and restore sessions safely, manage multiple workspaces, search your browsing history, detect duplicate tabs, and optionally cluster tabs or summarize pages using AI.

---

## 🚀 Key Features

- **⚡ Live Tab Management**: Real-time overview of tabs across browser windows, multi-select, batch actions, search, pin/unpin, and native Chrome tab grouping.
- **💾 Saved Sessions**: Snapshot open windows and workspaces into named sessions. Preview session tabs, restore with progress reporting, and prevent duplicate tab creation.
- **📁 Custom Workspaces**: Organize tabs and sessions into distinct workspaces (e.g. Work, Research, Personal) with custom colors and default settings.
- **🔍 Smart Duplicate Tab Detection**: Conservative, reliable URL normalization that distinguishes exact duplicates from distinct pages (preserving distinguishing query parameters `id`, `v`, `q`), with transparent retention rules (`keep-active`, `keep-oldest`, `keep-newest`) and pinned tab protection.
- **🔎 Unified Search**: Search across open tabs, saved collections, sessions, and workspaces with tokenization and filters.
- **🕒 Recently Closed Recovery**: Direct integration with `chrome.sessions` to recover recently closed tabs and windows.
- **🔒 Local-First & Privacy-Focused**: Durable IndexedDB persistence (`TabPilotDB`) with versioned migrations and soft-delete tombstones. Functions completely offline with zero accounts required.
- **☁️ Optional Cloud Sync**: Explicit opt-in synchronization with Supabase Auth, PostgreSQL Row Level Security (RLS), versioned conflict detection, and transactional sync queues.
- **🤖 Optional AI Organization & Summaries**: Smart group recommendations and page content summaries with strict schema validation, confidence indicators, and reliable deterministic offline fallbacks.
- **📦 Import & Export**: Full JSON export and schema-validated import for backup, migration, and portability.

---

## 🛠️ Tech Stack & Architecture

```
src/
├── background/         # Manifest V3 service worker, message router, tab event listeners
├── popup/              # Compact browser action popup (400x580 max)
├── dashboard/          # Full-page organizer dashboard
├── components/         # Accessible UI components (AppShell, TabRow, ConfirmDialog, etc.)
├── features/           # Feature modules (tabs, sessions, workspaces, duplicates, AI)
├── services/           # Core domain logic (TabService, SessionService, DuplicateService, etc.)
├── adapters/           # Abstraction layer (ChromeTabs, IndexedDB, Supabase, AI)
├── domain/             # Strict TypeScript types, Zod schemas, errors, runtime events
├── lib/                # URL normalization, permissions, date utils, logger
└── styles/             # Design tokens and Tailwind directives
```

---

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18, v20, or v24 recommended)
- `npm` (v9 or higher)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/RANGAHARISH/tab_pilot.git
cd tab_pilot

# 2. Install dependencies
npm install

# 3. Build the Chrome extension
npm run build:extension
```

This outputs the compiled extension to the `dist/` directory.

---

## 🧩 Loading into Chrome, Edge, or Brave

1. Open your browser and go to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** using the toggle in the upper-right corner.
3. Click **Load unpacked**.
4. Select the `dist/` folder from this repository.
5. TabPilot is now ready to use!
   - Click the extension icon in the toolbar or press `Ctrl+Shift+E` (`Command+Shift+E`) to open the popup.
   - Press `Ctrl+Shift+S` (`Command+Shift+S`) to quick-save your current window's session.
   - Click **Open Full Dashboard** to access the complete management suite.

---

## 🖥️ Local Interactive Preview

You can also run TabPilot in standalone browser preview mode:

```bash
npm run dev
```

Visit [http://localhost:5173/](http://localhost:5173/) to explore the preview portal, full dashboard (`/dashboard.html`), and extension popup preview (`/popup.html`).

---

## 🧪 Testing & Quality Assurance

TabPilot includes a comprehensive automated test suite with unit, component, integration, and E2E manifest tests:

```bash
# Run Vitest test suite (47 tests across 15 test suites)
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint
npm run lint

# Package extension into release ZIP
npm run package:extension
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl+Shift+E` / `Cmd+Shift+E` | Open TabPilot popup | Browser-wide |
| `Ctrl+Shift+S` / `Cmd+Shift+S` | Quick-save active window session | Browser-wide |
| `/` | Focus search bar | Dashboard / Popup |
| `Esc` | Close modal / clear selection | Active view |

---

## 🤝 Contributing

Contributions, feedback, and pull requests are warmly welcomed! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on code style, testing, and contribution guidelines.

---

## 📄 License & Policies

- **License**: [MIT License](./LICENSE)
- **Privacy Policy**: [PRIVACY.md](./PRIVACY.md)
- **Security Policy**: [SECURITY.md](./SECURITY.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

# TabPilot (Smart Tab & Session Organizer)

TabPilot is a production-quality Chrome Manifest V3 browser extension built with React, TypeScript, and Tailwind CSS. It is designed to be local-first, privacy-conscious, and blazing fast with hundreds of open tabs.

## Key Features

- **Live Tab Management**: Real-time overview of tabs across browser windows, multi-select, batch actions, search, pin/unpin, and native Chrome tab grouping.
- **Saved Sessions**: Snapshot open windows and workspaces into named sessions. Preview session tabs, restore with progress reporting, and prevent duplicate tab creation.
- **Custom Workspaces**: Organize tabs and sessions into distinct workspaces (e.g. Work, Research, Personal) with custom colors and default settings.
- **Duplicate Tab Detection**: Conservative, reliable URL normalization that distinguishes exact duplicates from distinct pages (preserving distinguishing query parameters), with transparent retention rules and safe batch closure.
- **Unified Search**: Search across open tabs, saved collections, sessions, and workspaces with tokenization and filters (domain, workspace, type).
- **Recently Closed Recovery**: Direct integration with `chrome.sessions` to recover recently closed tabs and windows where supported.
- **Local-First & Offline**: Durable IndexedDB persistence (`TabPilotDB`) with versioned migrations and soft-delete tombstones; functions completely offline with zero accounts required.
- **Optional Supabase Cloud Sync**: Explicit opt-in synchronization with Supabase Auth, PostgreSQL Row Level Security (RLS), versioned conflict detection, and transactional sync queues.
- **Optional AI Organization & Summaries**: Smart group recommendations and page content summaries with strict schema validation, confidence indicators, rate limiting, and reliable deterministic fallbacks.
- **Import & Export**: Full JSON export and schema-validated import for backup, migration, and portability.

## Extension Architecture

```
src/
├── background/         # Service worker, message router, tab event listeners
├── popup/              # Compact browser action popup (400x580 max)
├── dashboard/          # Full-page organizer dashboard
├── components/         # Accessible UI components (AppShell, TabRow, etc.)
├── features/           # Feature modules (tabs, sessions, workspaces, duplicates, AI)
├── services/           # Core business logic (TabService, SyncService, etc.)
├── adapters/           # Testable abstraction layer (Chrome, IndexedDB, Supabase, AI)
├── domain/             # Strict types, Zod schemas, errors, runtime events
├── lib/                # URL normalization, permissions, date utils, logger
└── styles/             # Design tokens and Tailwind directives
```

## Getting Started

### Prerequisites
- Node.js >= 18.x (tested on Node v20/v24)
- npm >= 9.x

### Installation

```bash
# Clone the repository and install dependencies
npm install
```

### Development

To run the Vite development server with Hot Module Replacement:
```bash
npm run dev
```

### Production Build

To build the unpacked Chrome extension:
```bash
npm run build:extension
```
This bundles the popup, dashboard, and background service worker into the `dist/` directory and copies `manifest.json` and icons.

### Loading Unpacked in Chrome or Edge

1. Open Google Chrome or Microsoft Edge.
2. Navigate to `chrome://extensions` (or `edge://extensions`).
3. Toggle **Developer mode** in the top right.
4. Click **Load unpacked**.
5. Select the `dist/` folder in this repository.
6. The TabPilot icon will appear in your extension toolbar. Click it to open the popup, or open `chrome-extension://<EXTENSION_ID>/dashboard.html` for the full dashboard.

### Packaging for Release

To produce a clean ZIP archive ready for Chrome Web Store or Edge Add-ons submission:
```bash
npm run package:extension
```
The output file `tabpilot-extension.zip` will be generated in the root directory.

## Testing & Quality Assurance

Run the test suite:
```bash
# Unit & integration tests via Vitest
npm test

# Type checking via TypeScript
npm run typecheck

# Code style and linting
npm run lint

# End-to-end tests via Playwright
npm run test:e2e
```

## Configuration & Optional Services

All core functionality works locally without any configuration or external accounts.

### Optional Supabase Cloud Sync
Copy `.env.example` to `.env` and fill in:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Database migrations are located in `backend_optional/supabase/migrations/`.

### Optional AI Provider
AI functions can be deployed to Supabase Edge Functions or configured via server-side endpoint. See `backend_optional/supabase/functions/` for implementation details.

## License & Policies

- Privacy Policy: See [PRIVACY.md](./PRIVACY.md)
- Security Policy: See [SECURITY.md](./SECURITY.md)

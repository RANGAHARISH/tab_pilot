# TabPilot Privacy Policy & Data Disclosure

TabPilot is built with privacy as a foundational principle. This document explains what data TabPilot accesses, where it is stored, and under what circumstances data ever leaves your device.

## 1. Local-First Architecture

- **Default Storage**: By default, 100% of your tabs, saved sessions, workspaces, and preferences are stored locally in your browser using **IndexedDB** (`TabPilotDB`) and `chrome.storage.local`.
- **No Mandatory Accounts**: You do not need to create an account, log in, or provide personal details to use any core feature of TabPilot.
- **No Background Tracking or Analytics**: TabPilot contains no advertising trackers, analytics SDKs, or background telemetries.

## 2. Browser Permissions & Purpose

TabPilot requests only the permissions necessary for its advertised features:

| Permission | Purpose |
| :--- | :--- |
| `tabs` | Required to query open tab titles, URLs, and favicons, and perform tab operations (closing, switching, moving). |
| `storage` | Stores extension settings, workspace configurations, and local sync preferences. |
| `tabGroups` | Creates and manages native browser tab groups when requested by the user. |
| `sessions` | Enables recently closed tab recovery through standard browser APIs. |

TabPilot does **not** request broad host permissions (`<all_urls>`).

## 3. Optional Cloud Synchronization

- Cloud synchronization is **strictly opt-in**.
- When enabled via Supabase, synchronized data (workspace definitions, session snapshots, saved tabs) is linked exclusively to your authenticated user ID and protected by PostgreSQL Row Level Security (RLS).
- Disabling sync or signing out immediately ceases all network transmission. Your local records remain intact on your machine.
- You can request full data deletion from the cloud backend at any time via Settings.

## 4. Optional AI Features & Data Transmission

- **Explicit Action Only**: Tab titles or page text are **never** transmitted to an AI service automatically or in the background.
- **User Triggered**: Page summarization or categorization occurs only when you explicitly click "Categorize Tabs" or "Summarize Page".
- **Data Minimization**: Only the specific tab titles or extracted readable text from the selected tab are transmitted.
- **Deterministic Fallback**: If AI services are unavailable or unconfigured, TabPilot uses local rule-based clustering and summaries that execute entirely in your browser without any network requests.

## 5. Data Export & Deletion

- You can export all your workspaces, sessions, and saved tabs at any time into a standardized JSON file.
- You can wipe all local extension data with a single click in Settings > Privacy, or by uninstalling the extension.

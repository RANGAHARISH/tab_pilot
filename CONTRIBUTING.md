# Contributing to TabPilot

Thank you for your interest in contributing to TabPilot! We welcome community contributions, bug reports, and feature requests.

---

## Code of Conduct

Please be respectful, constructive, and considerate in all interactions within this project.

---

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RANGAHARISH/tab_pilot.git
   cd tab_pilot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local preview development server:**
   ```bash
   npm run dev
   ```

4. **Build the extension:**
   ```bash
   npm run build:extension
   ```

5. **Load unpacked in Chrome/Edge:**
   - Navigate to `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist/` directory

---

## Development Workflow & Verification

Before opening a Pull Request, ensure all quality checks pass:

```bash
# Run unit and integration tests
npm test

# Check TypeScript typing
npm run typecheck

# Check code linting
npm run lint

# Package extension zip
npm run package:extension
```

---

## Architecture Guidelines

- **Local-First**: TabPilot must remain 100% functional without cloud credentials or network connectivity. All core features (tabs, sessions, workspaces, search, duplicate detection) must run locally via IndexedDB (`TabPilotDB`) and Chrome APIs.
- **Privacy-Conscious**: Never send tab URLs, session titles, or page contents to remote servers unless the user has explicitly opted into cloud synchronization or AI processing.
- **Manifest V3 Least Privilege**: Maintain minimal permissions (`tabs`, `storage`, `tabGroups`, `sessions`). Avoid broad host permissions (`<all_urls>`).
- **No Mock Data in Production**: All tab interactions must bind to real browser tabs via `ITabsAdapter`.

---

## Submitting Pull Requests

1. Fork the repository and create a branch from `main`.
2. Follow conventional commit messages (e.g. `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`).
3. Ensure all tests and lint checks pass.
4. Open a Pull Request detailing the changes and linking any relevant issues.

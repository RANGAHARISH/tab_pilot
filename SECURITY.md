# TabPilot Security Architecture & Policy

TabPilot adheres to modern browser extension security practices, utilizing Chrome Manifest V3 and zero-trust data validation across all boundaries.

## 1. Content Security Policy (CSP)

TabPilot enforces a strict extension Content Security Policy:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; worker-src 'self';"
}
```
- **No Remote Code Execution**: No external scripts or styles are fetched or executed at runtime. All application logic is compiled and bundled into local static assets.
- **No `eval()` or Dynamic Scripts**: The code strictly avoids `eval()`, `new Function()`, and inline script evaluation.

## 2. Input Sanitization & URL Safety

- **Scheme Validation**: All restored and navigated URLs are validated before browser dispatch. Dangerous schemes including `javascript:`, `vbscript:`, `data:`, and local `file:` schemes are strictly rejected or stripped. Only valid `http:` and `https:` schemes (and safe `chrome://` where permitted) are handled.
- **DOM Injection Protection**: All webpage titles, URLs, tags, and AI model responses are treated as untrusted strings and rendered using React text nodes rather than `dangerouslySetInnerHTML`.
- **Zod Schema Validation**: All persisted records, JSON imports, and AI API responses pass through strict Zod schemas before being processed by application state.

## 3. Secret & Credential Management

- **No Server Secrets in Client Code**: AI provider API secret keys and Supabase `service_role` keys are **strictly forbidden** from client bundles and extension storage.
- **Client Supabase Anon Key**: The only optional client-facing key is the Supabase public `anon` key, which confers no privileges without authenticated session tokens and is constrained by strict PostgreSQL Row Level Security policies.

## 4. Ephemeral Service Worker Security

- The extension service worker validates all incoming runtime messages against typed schemas.
- Senders are verified to originate from the extension's own origin before executing internal commands.

## 5. Vulnerability Reporting

If you discover a security vulnerability in TabPilot, please report it via private disclosure rather than opening a public issue. We commit to investigating and resolving verified security vulnerabilities promptly.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('E2E / Packaging: Chrome Extension Manifest V3 Validation', () => {
  const manifestPath = path.resolve(__dirname, '../../extension/manifest.json');

  it('exists and is valid JSON', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('TabPilot - Smart Tab & Session Manager');
    expect(manifest.version).toBe('1.0.0');
  });

  it('contains least-privilege permissions without broad host wildcards', () => {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    expect(manifest.permissions).toContain('tabs');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('tabGroups');
    expect(manifest.permissions).toContain('sessions');

    // Verify no broad <all_urls> or *://*/* host permissions
    if (manifest.host_permissions) {
      expect(manifest.host_permissions).not.toContain('<all_urls>');
      expect(manifest.host_permissions).not.toContain('*://*/*');
    }
  });

  it('verifies declared icons and entry files exist in extension root', () => {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    const baseDir = path.dirname(manifestPath);

    // Check icons
    for (const size of Object.keys(manifest.icons)) {
      const relPath = manifest.icons[size];
      const absPath = path.resolve(baseDir, relPath);
      expect(fs.existsSync(absPath), `Icon ${absPath} must exist`).toBe(true);
    }

    // Check action popup
    expect(manifest.action?.default_popup).toBe('popup.html');
    expect(fs.existsSync(path.resolve(__dirname, '../../popup.html'))).toBe(true);

    // Check dashboard
    expect(manifest.options_ui?.page).toBe('dashboard.html');
    expect(fs.existsSync(path.resolve(__dirname, '../../dashboard.html'))).toBe(true);

    // Check background service worker config
    expect(manifest.background?.service_worker).toBe('service-worker.js');
    expect(manifest.background?.type).toBe('module');
  });
});

import { describe, it, expect } from 'vitest';
import {
  WorkspaceSchema,
  SessionSchema,
  TabRecordSchema,
  ExportDataPayloadSchema,
  AISuggestionListSchema,
  UserPreferencesSchema,
} from '../../src/domain/schemas';

describe('domain/schemas', () => {
  it('validates a correct Workspace schema', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Engineering',
      description: 'Tech tabs and PRs',
      icon: 'briefcase',
      color: '#2563eb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: 0,
      settings: { isDefault: true },
      version: 1,
      deletedAt: null,
    };
    const res = WorkspaceSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects an invalid Workspace with empty name', () => {
    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: '',
      color: '#2563eb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: 0,
      settings: { isDefault: false },
      version: 1,
    };
    const res = WorkspaceSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates a correct Session schema with tab snapshots', () => {
    const session = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Morning Routine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspaceId: null,
      tabs: [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          url: 'https://news.ycombinator.com',
          title: 'Hacker News',
          faviconUrl: null,
          domain: 'news.ycombinator.com',
          pinned: false,
        },
      ],
      tabCount: 1,
      restoreOptions: { openInNewWindow: false, avoidDuplicates: true },
      version: 1,
      deletedAt: null,
    };
    const res = SessionSchema.safeParse(session);
    expect(res.success).toBe(true);
  });

  it('validates AI suggestions output schema', () => {
    const suggestions = [
      {
        category: 'Development',
        suggestedGroupName: 'GitHub PRs',
        reason: 'Multiple pull requests open',
        confidence: 0.95,
        tabIds: [101, 102],
      },
    ];
    const res = AISuggestionListSchema.safeParse(suggestions);
    expect(res.success).toBe(true);
  });

  it('validates export data payload', () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workspaces: [],
      sessions: [],
      savedTabs: [],
      tabGroups: [],
      preferences: {
        theme: 'dark',
        defaultWorkspaceId: null,
        autoSaveSessions: false,
        confirmBeforeClosingTabs: true,
        enableAI: false,
        enableCloudSync: false,
        syncIntervalMinutes: 15,
        reducedMotion: false,
      },
    };
    const res = ExportDataPayloadSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });
});

import { z } from 'zod';

export const SavedTabSnapshotSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  url: z.string().url(),
  title: z.string().max(1000).default('Untitled'),
  faviconUrl: z.string().nullable().optional().default(null),
  domain: z.string().default(''),
  pinned: z.boolean().optional().default(false),
  groupName: z.string().nullable().optional().default(null),
});

export const TabRecordSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().max(1000).default('Untitled'),
  faviconUrl: z.string().nullable().optional().default(null),
  domain: z.string().default(''),
  workspaceId: z.string().uuid().nullable().default(null),
  groupId: z.string().uuid().nullable().default(null),
  tags: z.array(z.string().max(50)).default([]),
  savedAt: z.string().datetime(),
  lastVisitedAt: z.string().datetime().nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
  version: z.number().int().min(1).default(1),
  deletedAt: z.string().datetime().nullable().optional().default(null),
});

export const SessionRestoreOptionsSchema = z.object({
  openInNewWindow: z.boolean().default(false),
  avoidDuplicates: z.boolean().default(true),
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  workspaceId: z.string().uuid().nullable().default(null),
  tabs: z.array(SavedTabSnapshotSchema),
  tabCount: z.number().int().nonnegative(),
  restoreOptions: SessionRestoreOptionsSchema,
  version: z.number().int().min(1).default(1),
  deletedAt: z.string().datetime().nullable().optional().default(null),
});

export const WorkspaceSettingsSchema = z.object({
  isDefault: z.boolean().default(false),
  autoGroupDomains: z.boolean().optional().default(false),
});

export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().default(null),
  icon: z.string().max(50).nullable().default(null),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  sortOrder: z.number().int().default(0),
  settings: WorkspaceSettingsSchema,
  version: z.number().int().min(1).default(1),
  deletedAt: z.string().datetime().nullable().optional().default(null),
});

export const TabGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  workspaceId: z.string().uuid().nullable().default(null),
  color: z.string().nullable().default(null),
  tabIds: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().min(1).default(1),
  deletedAt: z.string().datetime().nullable().optional().default(null),
});

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  defaultWorkspaceId: z.string().uuid().nullable().default(null),
  autoSaveSessions: z.boolean().default(false),
  confirmBeforeClosingTabs: z.boolean().default(true),
  enableAI: z.boolean().default(false),
  enableCloudSync: z.boolean().default(false),
  syncIntervalMinutes: z.number().int().positive().nullable().default(15),
  reducedMotion: z.boolean().default(false),
  aiProviderEndpoint: z.string().url().optional(),
});

export const SyncMetadataSchema = z.object({
  entityId: z.string(),
  entityType: z.enum(['workspace', 'saved_tab', 'session', 'tab_group', 'user_preferences']),
  version: z.number().int().min(1),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  syncStatus: z.enum(['local', 'pending', 'synced', 'conflict', 'error']),
  lastError: z.string().nullable().optional(),
});

export const AISuggestionSchema = z.object({
  category: z.string().min(1).max(100),
  suggestedGroupName: z.string().min(1).max(100),
  reason: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1),
  tabIds: z.array(z.number().int()),
});

export const AISuggestionListSchema = z.array(AISuggestionSchema);

export const PageSummaryResultSchema = z.object({
  tabId: z.number().int(),
  url: z.string().url(),
  title: z.string().max(500),
  summary: z.string().min(10).max(5000),
  keyPoints: z.array(z.string().max(500)),
  generatedAt: z.string().datetime(),
});

export const ExportDataPayloadSchema = z.object({
  version: z.number().int().min(1),
  exportedAt: z.string().datetime(),
  workspaces: z.array(WorkspaceSchema),
  sessions: z.array(SessionSchema),
  savedTabs: z.array(TabRecordSchema),
  tabGroups: z.array(TabGroupSchema),
  preferences: UserPreferencesSchema,
});

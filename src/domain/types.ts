export type TabStatus = 'loading' | 'complete';

export interface BrowserTab {
  id: number;
  windowId: number;
  url: string;
  title: string;
  favIconUrl?: string | null;
  active: boolean;
  pinned: boolean;
  highlighted?: boolean;
  incognito?: boolean;
  groupId?: number | null;
  discarded?: boolean;
  index?: number;
  status?: TabStatus;
}

export interface SavedTabSnapshot {
  id: string;
  url: string;
  title: string;
  faviconUrl: string | null;
  domain: string;
  pinned?: boolean;
  groupName?: string | null;
}

export interface TabRecord {
  id: string;
  url: string;
  title: string;
  faviconUrl: string | null;
  domain: string;
  workspaceId: string | null;
  groupId: string | null;
  tags: string[];
  savedAt: string;
  lastVisitedAt?: string | null;
  notes?: string | null;
  metadata?: {
    pinned?: boolean;
    summary?: string | null;
    sourceSessionId?: string | null;
    [key: string]: unknown;
  };
  version: number;
  deletedAt?: string | null;
}

export interface SessionRestoreOptions {
  openInNewWindow: boolean;
  avoidDuplicates: boolean;
}

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string | null;
  tabs: SavedTabSnapshot[];
  tabCount: number;
  restoreOptions: SessionRestoreOptions;
  version: number;
  deletedAt?: string | null;
}

export interface WorkspaceSettings {
  isDefault: boolean;
  autoGroupDomains?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
  settings: WorkspaceSettings;
  version: number;
  deletedAt?: string | null;
}

export interface TabGroup {
  id: string;
  name: string;
  workspaceId: string | null;
  color: string | null;
  tabIds: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
  deletedAt?: string | null;
}

export type ThemeOption = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: ThemeOption;
  defaultWorkspaceId: string | null;
  autoSaveSessions: boolean;
  confirmBeforeClosingTabs: boolean;
  enableAI: boolean;
  enableCloudSync: boolean;
  syncIntervalMinutes: number | null;
  reducedMotion: boolean;
  aiProviderEndpoint?: string;
}

export type SyncStatusType = 'local' | 'pending' | 'synced' | 'conflict' | 'error';

export interface SyncMetadata {
  entityId: string;
  entityType: 'workspace' | 'saved_tab' | 'session' | 'tab_group' | 'user_preferences';
  version: number;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatusType;
  lastError?: string | null;
}

export interface DuplicateGroup {
  normalizedUrl: string;
  domain: string;
  isExact: boolean;
  tabs: BrowserTab[];
  primaryTabId: number;
}

export interface AISuggestion {
  category: string;
  suggestedGroupName: string;
  reason: string;
  confidence: number;
  tabIds: number[];
}

export interface PageSummaryResult {
  tabId: number;
  url: string;
  title: string;
  summary: string;
  keyPoints: string[];
  generatedAt: string;
}

export interface RecentlyClosedItem {
  id: string;
  type: 'tab' | 'window';
  title: string;
  url?: string;
  tabCount?: number;
  closedAt: string;
  sessionId?: string;
}

export interface ExportDataPayload {
  version: number;
  exportedAt: string;
  workspaces: Workspace[];
  sessions: Session[];
  savedTabs: TabRecord[];
  tabGroups: TabGroup[];
  preferences: UserPreferences;
}

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { NetworkError } from '../domain/errors';
import { logger } from '../lib/logger';
import type { Workspace, Session, TabRecord, TabGroup } from '../domain/types';

export interface RemoteChanges {
  workspaces: Workspace[];
  sessions: Session[];
  savedTabs: TabRecord[];
  tabGroups: TabGroup[];
}

export class SupabaseAdapter {
  private client: SupabaseClient | null = null;
  private url: string | null = null;
  private anonKey: string | null = null;

  constructor() {
    this.initFromEnv();
  }

  private initFromEnv() {
    try {
      const url =
        typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL
          ? process.env.VITE_SUPABASE_URL
          : (import.meta as unknown as { env?: { VITE_SUPABASE_URL?: string } })?.env?.VITE_SUPABASE_URL;

      const anonKey =
        typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY
          ? process.env.VITE_SUPABASE_ANON_KEY
          : (import.meta as unknown as { env?: { VITE_SUPABASE_ANON_KEY?: string } })?.env?.VITE_SUPABASE_ANON_KEY;

      if (url && anonKey) {
        this.configure(url, anonKey);
      }
    } catch {
      // Running in environment without standard env access
    }
  }

  public configure(url: string, anonKey: string): void {
    if (!url || !anonKey) {
      this.client = null;
      this.url = null;
      this.anonKey = null;
      return;
    }

    try {
      this.url = url.trim();
      this.anonKey = anonKey.trim();
      this.client = createClient(this.url, this.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
      logger.info('Supabase client initialized successfully');
    } catch (err) {
      logger.error('Failed to configure Supabase client:', err);
      this.client = null;
    }
  }

  public isConfigured(): boolean {
    return !!this.client;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.auth.getUser();
      if (error || !data?.user) return null;
      return data.user;
    } catch (err) {
      logger.warn('Failed to get current user from Supabase:', err);
      return null;
    }
  }

  async signIn(email: string, password: string):Promise<{ user: User | null; error?: string }> {
    if (!this.client) {
      return { user: null, error: 'Supabase is not configured. Please enter project URL and public anon key in settings.' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }
      return { user: data.user, error: undefined };
    } catch (err: unknown) {
      return { user: null, error: (err as Error)?.message || 'Sign in failed' };
    }
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error?: string }> {
    if (!this.client) {
      return { user: null, error: 'Supabase is not configured' };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }
      return { user: data.user, error: undefined };
    } catch (err: unknown) {
      return { user: null, error: (err as Error)?.message || 'Sign up failed' };
    }
  }

  async signOut(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.auth.signOut();
    } catch (err) {
      logger.warn('Error during Supabase sign-out:', err);
    }
  }

  async syncWorkspaces(workspaces: Workspace[]): Promise<void> {
    if (!this.client || workspaces.length === 0) return;
    const user = await this.getCurrentUser();
    if (!user) throw new NetworkError('Authentication required to sync workspaces');

    const records = workspaces.map((w) => ({
      id: w.id,
      user_id: user.id,
      name: w.name,
      description: w.description,
      icon: w.icon,
      color: w.color,
      sort_order: w.sortOrder,
      version: w.version,
      updated_at: w.updatedAt,
      deleted_at: w.deletedAt || null,
    }));

    const { error } = await this.client
      .from('workspaces')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new NetworkError(`Failed to sync workspaces: ${error.message}`);
    }
  }

  async syncSessions(sessions: Session[]): Promise<void> {
    if (!this.client || sessions.length === 0) return;
    const user = await this.getCurrentUser();
    if (!user) throw new NetworkError('Authentication required to sync sessions');

    const records = sessions.map((s) => ({
      id: s.id,
      user_id: user.id,
      workspace_id: s.workspaceId,
      name: s.name,
      tab_snapshots: s.tabs,
      tab_count: s.tabCount,
      restore_options: s.restoreOptions,
      version: s.version,
      updated_at: s.updatedAt,
      deleted_at: s.deletedAt || null,
    }));

    const { error } = await this.client
      .from('sessions')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new NetworkError(`Failed to sync sessions: ${error.message}`);
    }
  }

  async syncSavedTabs(tabs: TabRecord[]): Promise<void> {
    if (!this.client || tabs.length === 0) return;
    const user = await this.getCurrentUser();
    if (!user) throw new NetworkError('Authentication required to sync saved tabs');

    const records = tabs.map((t) => ({
      id: t.id,
      user_id: user.id,
      workspace_id: t.workspaceId,
      url: t.url,
      title: t.title,
      domain: t.domain,
      tags: t.tags,
      metadata: t.metadata,
      version: t.version,
      updated_at: t.savedAt,
      deleted_at: t.deletedAt || null,
    }));

    const { error } = await this.client
      .from('saved_tabs')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new NetworkError(`Failed to sync saved tabs: ${error.message}`);
    }
  }

  async pullRemoteChanges(sinceIsoString?: string): Promise<RemoteChanges> {
    if (!this.client) {
      return { workspaces: [], sessions: [], savedTabs: [], tabGroups: [] };
    }
    const user = await this.getCurrentUser();
    if (!user) {
      return { workspaces: [], sessions: [], savedTabs: [], tabGroups: [] };
    }

    let wsQuery = this.client.from('workspaces').select('*').eq('user_id', user.id);
    let sessQuery = this.client.from('sessions').select('*').eq('user_id', user.id);
    let tabQuery = this.client.from('saved_tabs').select('*').eq('user_id', user.id);
    let grpQuery = this.client.from('tab_groups').select('*').eq('user_id', user.id);

    if (sinceIsoString) {
      wsQuery = wsQuery.gt('updated_at', sinceIsoString);
      sessQuery = sessQuery.gt('updated_at', sinceIsoString);
      tabQuery = tabQuery.gt('updated_at', sinceIsoString);
      grpQuery = grpQuery.gt('updated_at', sinceIsoString);
    }

    const [wsRes, sessRes, tabRes, grpRes] = await Promise.all([
      wsQuery,
      sessQuery,
      tabQuery,
      grpQuery,
    ]);

    const workspaces: Workspace[] = (wsRes.data || []).map((w: Record<string, unknown>) => ({
      id: String(w.id),
      name: String(w.name),
      description: (w.description as string) || null,
      icon: (w.icon as string) || null,
      color: String(w.color || '#2563eb'),
      createdAt: (w.created_at as string) || new Date().toISOString(),
      updatedAt: (w.updated_at as string) || new Date().toISOString(),
      sortOrder: Number(w.sort_order || 0),
      settings: { isDefault: false },
      version: Number(w.version || 1),
      deletedAt: (w.deleted_at as string) || null,
    }));

    const sessions: Session[] = (sessRes.data || []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      name: String(s.name),
      createdAt: (s.created_at as string) || new Date().toISOString(),
      updatedAt: (s.updated_at as string) || new Date().toISOString(),
      workspaceId: (s.workspace_id as string) || null,
      tabs: (s.tab_snapshots as Session['tabs']) || [],
      tabCount: Number(s.tab_count || 0),
      restoreOptions: (s.restore_options as Session['restoreOptions']) || {
        openInNewWindow: false,
        avoidDuplicates: true,
      },
      version: Number(s.version || 1),
      deletedAt: (s.deleted_at as string) || null,
    }));

    const savedTabs: TabRecord[] = (tabRes.data || []).map((t: Record<string, unknown>) => ({
      id: String(t.id),
      url: String(t.url),
      title: String(t.title || 'Untitled'),
      faviconUrl: null,
      domain: String(t.domain || ''),
      workspaceId: (t.workspace_id as string) || null,
      groupId: null,
      tags: (t.tags as string[]) || [],
      savedAt: (t.updated_at as string) || new Date().toISOString(),
      lastVisitedAt: null,
      metadata: (t.metadata as TabRecord['metadata']) || {},
      version: Number(t.version || 1),
      deletedAt: (t.deleted_at as string) || null,
    }));

    const tabGroups: TabGroup[] = (grpRes.data || []).map((g: Record<string, unknown>) => ({
      id: String(g.id),
      name: String(g.name),
      workspaceId: (g.workspace_id as string) || null,
      color: (g.color as string) || null,
      tabIds: (g.tab_ids as string[]) || [],
      createdAt: (g.created_at as string) || new Date().toISOString(),
      updatedAt: (g.updated_at as string) || new Date().toISOString(),
      version: Number(g.version || 1),
      deletedAt: (g.deleted_at as string) || null,
    }));

    return { workspaces, sessions, savedTabs, tabGroups };
  }
}

export const supabaseAdapter = new SupabaseAdapter();

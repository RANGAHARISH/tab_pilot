import { WorkspaceSchema } from '../domain/schemas';
import type { Workspace, Session, TabRecord } from '../domain/types';
import { IIndexedDbAdapter, indexedDbAdapter } from '../adapters/indexeddb-adapter';
import { ValidationError } from '../domain/errors';
import { logger } from '../lib/logger';

export class WorkspaceService {
  constructor(private db: IIndexedDbAdapter = indexedDbAdapter) {}

  async getAllWorkspaces(includeDeleted = false): Promise<Workspace[]> {
    const list = await this.db.getAll<Workspace>('workspaces', includeDeleted);
    if (list.length === 0 && !includeDeleted) {
      await this.seedDefaultWorkspaces();
      return this.db.getAll<Workspace>('workspaces', false);
    }
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    return this.db.get<Workspace>('workspaces', id);
  }

  async getDefaultWorkspace(): Promise<Workspace | null> {
    const list = await this.getAllWorkspaces();
    return list.find((w) => w.settings.isDefault) || list[0] || null;
  }

  async createWorkspace(data: {
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string;
    isDefault?: boolean;
  }): Promise<Workspace> {
    const now = new Date().toISOString();
    const existing = await this.getAllWorkspaces();

    // If marked as default, clear other default flags
    if (data.isDefault) {
      for (const w of existing) {
        if (w.settings.isDefault) {
          w.settings.isDefault = false;
          w.updatedAt = now;
          await this.db.put('workspaces', w);
        }
      }
    }

    const newWorkspace: Workspace = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      icon: data.icon || 'folder',
      color: data.color || '#2563eb',
      createdAt: now,
      updatedAt: now,
      sortOrder: existing.length,
      settings: {
        isDefault: !!data.isDefault || existing.length === 0,
      },
      version: 1,
      deletedAt: null,
    };

    const validated = WorkspaceSchema.parse(newWorkspace);
    await this.db.put('workspaces', validated);
    logger.info(`Created workspace "${validated.name}" (${validated.id})`);
    return validated;
  }

  async updateWorkspace(
    id: string,
    updates: {
      name?: string;
      description?: string | null;
      icon?: string | null;
      color?: string;
      isDefault?: boolean;
    }
  ): Promise<Workspace> {
    const ws = await this.getWorkspaceById(id);
    if (!ws) throw new ValidationError(`Workspace ${id} not found`);

    const now = new Date().toISOString();

    if (updates.isDefault) {
      const all = await this.getAllWorkspaces();
      for (const other of all) {
        if (other.id !== id && other.settings.isDefault) {
          other.settings.isDefault = false;
          other.updatedAt = now;
          await this.db.put('workspaces', other);
        }
      }
      ws.settings.isDefault = true;
    }

    if (updates.name !== undefined) ws.name = updates.name.trim();
    if (updates.description !== undefined) ws.description = updates.description ? updates.description.trim() : null;
    if (updates.icon !== undefined) ws.icon = updates.icon;
    if (updates.color !== undefined) ws.color = updates.color;

    ws.updatedAt = now;
    ws.version += 1;

    const validated = WorkspaceSchema.parse(ws);
    await this.db.put('workspaces', validated);
    return validated;
  }

  async deleteWorkspace(
    id: string,
    moveItemsToWorkspaceId?: string | null
  ): Promise<void> {
    const ws = await this.getWorkspaceById(id);
    if (!ws) throw new ValidationError(`Workspace ${id} not found`);

    // If target workspace provided, move associated sessions and saved tabs
    if (moveItemsToWorkspaceId) {
      const sessions = await this.db.getAll<Session>('sessions');
      for (const s of sessions) {
        if (s.workspaceId === id) {
          s.workspaceId = moveItemsToWorkspaceId;
          s.updatedAt = new Date().toISOString();
          s.version += 1;
          await this.db.put('sessions', s);
        }
      }

      const tabs = await this.db.getAll<TabRecord>('saved_tabs');
      for (const t of tabs) {
        if (t.workspaceId === id) {
          t.workspaceId = moveItemsToWorkspaceId;
          t.version += 1;
          await this.db.put('saved_tabs', t);
        }
      }
    }

    await this.db.delete('workspaces', id, true);
    logger.info(`Deleted workspace ${id}`);
  }

  private async seedDefaultWorkspaces(): Promise<void> {
    const now = new Date().toISOString();
    const defaults: Workspace[] = [
      {
        id: crypto.randomUUID(),
        name: 'Personal',
        description: 'Default personal browsing workspace',
        icon: 'user',
        color: '#2563eb', // Blue
        createdAt: now,
        updatedAt: now,
        sortOrder: 0,
        settings: { isDefault: true },
        version: 1,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        name: 'Work',
        description: 'Projects, tasks, and team communications',
        icon: 'briefcase',
        color: '#7c3aed', // Purple
        createdAt: now,
        updatedAt: now,
        sortOrder: 1,
        settings: { isDefault: false },
        version: 1,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        name: 'Research',
        description: 'Articles, documentation, and reference materials',
        icon: 'book-open',
        color: '#059669', // Emerald
        createdAt: now,
        updatedAt: now,
        sortOrder: 2,
        settings: { isDefault: false },
        version: 1,
        deletedAt: null,
      },
    ];

    for (const w of defaults) {
      await this.db.put('workspaces', w);
    }
  }
}

export const workspaceService = new WorkspaceService();

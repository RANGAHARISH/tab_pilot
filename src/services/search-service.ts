import type { BrowserTab, Session, TabRecord, Workspace } from '../domain/types';
import { IIndexedDbAdapter, indexedDbAdapter } from '../adapters/indexeddb-adapter';
import { ITabsAdapter, tabsAdapter } from '../adapters/chrome-tabs-adapter';
import { extractDomain } from '../lib/url-utils';

export type SearchContentType = 'all' | 'open_tab' | 'saved_tab' | 'session' | 'workspace';

export interface SearchFilters {
  contentType?: SearchContentType;
  workspaceId?: string | null;
  domain?: string | null;
}

export interface SearchResultItem {
  id: string;
  type: 'open_tab' | 'saved_tab' | 'session' | 'workspace';
  title: string;
  url?: string;
  domain?: string;
  metadata?: string;
  score: number;
  rawItem: BrowserTab | TabRecord | Session | Workspace;
}

export class SearchService {
  constructor(
    private db: IIndexedDbAdapter = indexedDbAdapter,
    private tabs: ITabsAdapter = tabsAdapter
  ) {}

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\-._/:?&=]+/)
      .filter((token) => token.length > 1);
  }

  private calculateMatchScore(queryTokens: string[], textToSearch: string): number {
    const text = textToSearch.toLowerCase();
    let score = 0;

    for (const token of queryTokens) {
      if (text === token) {
        score += 10;
      } else if (text.startsWith(token)) {
        score += 6;
      } else if (text.includes(token)) {
        score += 3;
      }
    }

    return score;
  }

  async search(
    rawQuery: string,
    filters: SearchFilters = {},
    maxResults = 50
  ): Promise<SearchResultItem[]> {
    const query = rawQuery.trim();
    const queryTokens = query ? this.tokenize(query) : [];

    const results: SearchResultItem[] = [];
    const typeFilter = filters.contentType || 'all';

    // 1. Search Open Tabs
    if (typeFilter === 'all' || typeFilter === 'open_tab') {
      const openTabs = await this.tabs.queryTabs();
      for (const tab of openTabs) {
        if (!tab.url || tab.url.startsWith('chrome-extension://')) continue;
        const domain = extractDomain(tab.url);

        if (filters.domain && !domain.includes(filters.domain.toLowerCase())) {
          continue;
        }

        let score = 1; // base score if query is empty
        if (queryTokens.length > 0) {
          const titleScore = this.calculateMatchScore(queryTokens, tab.title);
          const urlScore = this.calculateMatchScore(queryTokens, tab.url);
          const domainScore = this.calculateMatchScore(queryTokens, domain);
          score = titleScore * 3 + urlScore * 2 + domainScore;
          if (score === 0) continue;
        }

        results.push({
          id: `open_${tab.id}`,
          type: 'open_tab',
          title: tab.title,
          url: tab.url,
          domain,
          metadata: tab.pinned ? 'Pinned tab' : 'Active window',
          score,
          rawItem: tab,
        });
      }
    }

    // 2. Search Saved Sessions
    if (typeFilter === 'all' || typeFilter === 'session') {
      const sessions = await this.db.getAll<Session>('sessions');
      for (const sess of sessions) {
        if (filters.workspaceId && sess.workspaceId !== filters.workspaceId) {
          continue;
        }

        let score = 1;
        if (queryTokens.length > 0) {
          const nameScore = this.calculateMatchScore(queryTokens, sess.name);
          const tabMatchScore = sess.tabs.reduce((acc, t) => {
            return acc + this.calculateMatchScore(queryTokens, t.title + ' ' + t.url);
          }, 0);
          score = nameScore * 4 + tabMatchScore;
          if (score === 0) continue;
        }

        results.push({
          id: `session_${sess.id}`,
          type: 'session',
          title: sess.name,
          metadata: `${sess.tabCount} tabs • Saved ${new Date(sess.createdAt).toLocaleDateString()}`,
          score,
          rawItem: sess,
        });
      }
    }

    // 3. Search Saved Tabs
    if (typeFilter === 'all' || typeFilter === 'saved_tab') {
      const savedTabs = await this.db.getAll<TabRecord>('saved_tabs');
      for (const tab of savedTabs) {
        if (filters.workspaceId && tab.workspaceId !== filters.workspaceId) {
          continue;
        }
        if (filters.domain && !tab.domain.includes(filters.domain.toLowerCase())) {
          continue;
        }

        let score = 1;
        if (queryTokens.length > 0) {
          const titleScore = this.calculateMatchScore(queryTokens, tab.title);
          const urlScore = this.calculateMatchScore(queryTokens, tab.url);
          const tagsScore = tab.tags.reduce((acc, tag) => acc + this.calculateMatchScore(queryTokens, tag), 0);
          score = titleScore * 3 + urlScore * 2 + tagsScore * 2;
          if (score === 0) continue;
        }

        results.push({
          id: `saved_tab_${tab.id}`,
          type: 'saved_tab',
          title: tab.title,
          url: tab.url,
          domain: tab.domain,
          metadata: tab.tags.length > 0 ? tab.tags.join(', ') : undefined,
          score,
          rawItem: tab,
        });
      }
    }

    // 4. Search Workspaces
    if (typeFilter === 'all' || typeFilter === 'workspace') {
      const workspaces = await this.db.getAll<Workspace>('workspaces');
      for (const ws of workspaces) {
        let score = 1;
        if (queryTokens.length > 0) {
          const nameScore = this.calculateMatchScore(queryTokens, ws.name);
          const descScore = ws.description ? this.calculateMatchScore(queryTokens, ws.description) : 0;
          score = nameScore * 4 + descScore;
          if (score === 0) continue;
        }

        results.push({
          id: `ws_${ws.id}`,
          type: 'workspace',
          title: ws.name,
          metadata: ws.description || 'Workspace',
          score,
          rawItem: ws,
        });
      }
    }

    // Sort descending by score, capped to maxResults
    return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }
}

export const searchService = new SearchService();

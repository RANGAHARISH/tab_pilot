import { AISuggestionListSchema, PageSummaryResultSchema } from '../domain/schemas';
import type { AISuggestion, BrowserTab, PageSummaryResult } from '../domain/types';
import { AIProviderError } from '../domain/errors';
import { extractDomain } from '../lib/url-utils';
import { logger } from '../lib/logger';

export interface IAIProviderAdapter {
  isConfigured(): boolean;
  categorizeTabs(tabs: BrowserTab[], userApiKey?: string): Promise<AISuggestion[]>;
  summarizePage(tab: BrowserTab, content: string, userApiKey?: string): Promise<PageSummaryResult>;
}

export class AIProviderAdapter implements IAIProviderAdapter {
  private endpoint: string | null = null;

  constructor() {
    try {
      const url =
        typeof process !== 'undefined' && process.env?.VITE_AI_ENDPOINT
          ? process.env.VITE_AI_ENDPOINT
          : (import.meta as unknown as { env?: { VITE_AI_ENDPOINT?: string } })?.env?.VITE_AI_ENDPOINT;
      if (url) {
        this.endpoint = url;
      }
    } catch {
      // Ignored
    }
  }

  setEndpoint(endpoint: string) {
    this.endpoint = endpoint;
  }

  isConfigured(): boolean {
    return !!this.endpoint;
  }

  /**
   * Deterministic local fallback for tab categorization when AI provider is not configured.
   * Clusters tabs by domain and common keyword patterns (Docs, Social, Development, Media, Research, Shopping).
   */
  private localCategorizeFallback(tabs: BrowserTab[]): AISuggestion[] {
    const domainMap: Map<string, BrowserTab[]> = new Map();
    for (const tab of tabs) {
      const domain = extractDomain(tab.url);
      const list = domainMap.get(domain) || [];
      list.push(tab);
      domainMap.set(domain, list);
    }

    const suggestions: AISuggestion[] = [];

    // Rule-based heuristic clusters
    const rules: Array<{
      category: string;
      groupName: string;
      matcher: (t: BrowserTab) => boolean;
    }> = [
      {
        category: 'Development & Docs',
        groupName: 'Docs & Dev',
        matcher: (t) =>
          /github|gitlab|stackoverflow|developer\.mozilla|docs\.|typescript|react/i.test(t.url + t.title),
      },
      {
        category: 'Social & Communication',
        groupName: 'Social',
        matcher: (t) =>
          /twitter|x\.com|reddit|linkedin|slack|discord|facebook|instagram/i.test(t.url + t.title),
      },
      {
        category: 'Media & Entertainment',
        groupName: 'Media',
        matcher: (t) =>
          /youtube|spotify|netflix|vimeo|twitch|soundcloud/i.test(t.url + t.title),
      },
      {
        category: 'Productivity & Workspace',
        groupName: 'Productivity',
        matcher: (t) =>
          /notion|linear|jira|figma|trello|asana|google\.com\/(document|spreadsheets)/i.test(t.url + t.title),
      },
      {
        category: 'Search & Reference',
        groupName: 'Search',
        matcher: (t) =>
          /google\.com\/search|bing\.com|wikipedia\.org|duckduckgo/i.test(t.url + t.title),
      },
    ];

    const assignedTabIds = new Set<number>();

    for (const rule of rules) {
      const matchingTabs = tabs.filter((t) => !assignedTabIds.has(t.id) && rule.matcher(t));
      if (matchingTabs.length >= 2) {
        matchingTabs.forEach((t) => assignedTabIds.add(t.id));
        suggestions.push({
          category: rule.category,
          suggestedGroupName: rule.groupName,
          reason: `Rule-based cluster matched keywords in ${matchingTabs.length} tabs.`,
          confidence: 0.85,
          tabIds: matchingTabs.map((t) => t.id),
        });
      }
    }

    // Remaining clusters grouped by common domain if count >= 2
    for (const [domain, dTabs] of domainMap.entries()) {
      const unassigned = dTabs.filter((t) => !assignedTabIds.has(t.id));
      if (unassigned.length >= 2 && domain !== 'unknown') {
        unassigned.forEach((t) => assignedTabIds.add(t.id));
        suggestions.push({
          category: 'Domain Cluster',
          suggestedGroupName: domain.charAt(0).toUpperCase() + domain.slice(1),
          reason: `Tabs sharing the domain ${domain}`,
          confidence: 0.9,
          tabIds: unassigned.map((t) => t.id),
        });
      }
    }

    return suggestions;
  }

  /**
   * Deterministic local fallback for summarization when AI provider is not configured.
   * Extracts top sentences and key metadata locally.
   */
  private localSummarizeFallback(tab: BrowserTab, text: string): PageSummaryResult {
    const clean = text.replace(/\s+/g, ' ').trim();
    const sentences = clean
      .split(/(?<=[.?!])\s+/)
      .filter((s) => s.length > 20 && s.length < 250);

    const summary = sentences.slice(0, 3).join(' ') || `${tab.title} from ${extractDomain(tab.url)}.`;
    const keyPoints = sentences.slice(0, 5);

    return {
      tabId: tab.id,
      url: tab.url,
      title: tab.title,
      summary: summary || 'Page content overview generated from accessible text.',
      keyPoints: keyPoints.length > 0 ? keyPoints : [tab.title, extractDomain(tab.url)],
      generatedAt: new Date().toISOString(),
    };
  }

  async categorizeTabs(tabs: BrowserTab[], userApiKey?: string): Promise<AISuggestion[]> {
    if (tabs.length === 0) return [];

    // If no remote endpoint or API key, return deterministic heuristic clusters
    if (!this.endpoint && !userApiKey) {
      logger.info('Using local deterministic rule-based tab clustering (no AI endpoint configured)');
      return this.localCategorizeFallback(tabs);
    }

    try {
      const payload = {
        tabs: tabs.map((t) => ({
          id: t.id,
          url: t.url,
          title: t.title,
          domain: extractDomain(t.url),
        })),
      };

      const targetUrl = this.endpoint || 'https://api.openai.com/v1/chat/completions';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userApiKey) {
        headers['Authorization'] = `Bearer ${userApiKey}`;
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new AIProviderError(`AI endpoint returned status ${response.status}`, response.status);
      }

      const json = await response.json();
      const parsed = AISuggestionListSchema.safeParse(json.suggestions || json);
      if (!parsed.success) {
        logger.warn('AI suggestions failed schema validation, falling back to local clustering:', parsed.error);
        return this.localCategorizeFallback(tabs);
      }

      return parsed.data;
    } catch (err) {
      logger.warn('AI categorization request failed, using local rule-based clustering fallback:', err);
      return this.localCategorizeFallback(tabs);
    }
  }

  async summarizePage(tab: BrowserTab, content: string, userApiKey?: string): Promise<PageSummaryResult> {
    if (!content || content.trim().length === 0) {
      return {
        tabId: tab.id,
        url: tab.url,
        title: tab.title,
        summary: 'No readable text content could be extracted from this page.',
        keyPoints: ['Empty or inaccessible content'],
        generatedAt: new Date().toISOString(),
      };
    }

    // Truncate to maximum 10,000 characters to prevent excessive payload or tokens
    const safeContent = content.slice(0, 10000);

    if (!this.endpoint && !userApiKey) {
      logger.info('Using local summarizer fallback (no AI endpoint configured)');
      return this.localSummarizeFallback(tab, safeContent);
    }

    try {
      const payload = {
        title: tab.title,
        url: tab.url,
        content: safeContent,
      };

      const response = await fetch(this.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { Authorization: `Bearer ${userApiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new AIProviderError(`AI summary failed with status ${response.status}`, response.status);
      }

      const data = await response.json();
      const parsed = PageSummaryResultSchema.safeParse(data);
      if (!parsed.success) {
        return this.localSummarizeFallback(tab, safeContent);
      }
      return parsed.data;
    } catch (err) {
      logger.warn('AI summary request failed, falling back to local extractor:', err);
      return this.localSummarizeFallback(tab, safeContent);
    }
  }
}

export const aiProviderAdapter = new AIProviderAdapter();

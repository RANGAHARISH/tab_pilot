import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  extractDomain,
  areUrlsDuplicates,
  isLikelyDuplicate,
  isValidWebUrl,
} from '../../src/lib/url-utils';

describe('url-utils', () => {
  describe('normalizeUrl', () => {
    it('normalizes lowercase hostname and strips standard tracking parameters', () => {
      const input = 'https://EXAMPLE.com/path?utm_source=twitter&utm_medium=social&id=123#heading';
      const output = normalizeUrl(input);
      expect(output).toBe('https://example.com/path?id=123');
    });

    it('preserves functional query parameters like video IDs and search queries', () => {
      const yt1 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_campaign=share';
      const yt2 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(normalizeUrl(yt1)).toBe(normalizeUrl(yt2));
    });

    it('strips trailing slashes from root paths consistently', () => {
      const url1 = 'https://example.com/';
      const url2 = 'https://example.com';
      expect(normalizeUrl(url1)).toBe(normalizeUrl(url2));
    });

    it('returns empty string for invalid URLs', () => {
      expect(normalizeUrl('not-a-url')).toBe('');
      expect(normalizeUrl('')).toBe('');
    });
  });

  describe('extractDomain', () => {
    it('extracts clean hostname without www', () => {
      expect(extractDomain('https://www.github.com/google/tabpilot')).toBe('github.com');
      expect(extractDomain('http://subdomain.example.org:8080/path')).toBe('subdomain.example.org');
    });

    it('returns unknown for invalid urls', () => {
      expect(extractDomain('invalid')).toBe('unknown');
    });
  });

  describe('areUrlsDuplicates', () => {
    it('detects duplicate URLs with tracking differences', () => {
      const url1 = 'https://news.ycombinator.com/item?id=3000&fbclid=IwAR123';
      const url2 = 'https://news.ycombinator.com/item?id=3000&utm_source=feed';
      expect(areUrlsDuplicates(url1, url2)).toBe(true);
    });

    it('distinguishes different query parameters identifying different content', () => {
      const url1 = 'https://news.ycombinator.com/item?id=3000';
      const url2 = 'https://news.ycombinator.com/item?id=3001';
      expect(areUrlsDuplicates(url1, url2)).toBe(false);
    });

    it('distinguishes different paths on the same domain', () => {
      expect(areUrlsDuplicates('https://example.com/a', 'https://example.com/b')).toBe(false);
    });
  });

  describe('isValidWebUrl', () => {
    it('accepts valid http and https urls', () => {
      expect(isValidWebUrl('https://example.com')).toBe(true);
      expect(isValidWebUrl('http://localhost:3000')).toBe(true);
    });

    it('rejects chrome, javascript, and data urls for security', () => {
      expect(isValidWebUrl('chrome://settings')).toBe(false);
      expect(isValidWebUrl('javascript:alert(1)')).toBe(false);
      expect(isValidWebUrl('data:text/html,test')).toBe(false);
    });
  });
});

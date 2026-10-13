import type { ExtensionMessage, ExtensionResponse } from '../domain/events';
import { tabService } from '../services/tab-service';
import { sessionService } from '../services/session-service';
import { syncService } from '../services/sync-service';
import { tabsAdapter } from '../adapters/chrome-tabs-adapter';
import { logger } from '../lib/logger';

export class MessageRouter {
  init() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      return;
    }

    chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
      // Validate sender is from the same extension
      if (sender.id !== chrome.runtime.id) {
        logger.warn('Rejected unauthorized runtime message from sender:', sender.id);
        sendResponse({
          success: false,
          error: { message: 'Unauthorized message sender', code: 'UNAUTHORIZED' },
        });
        return false;
      }

      const msg = message as ExtensionMessage;
      if (!msg || typeof msg !== 'object' || !msg.type) {
        sendResponse({
          success: false,
          error: { message: 'Malformed message format', code: 'BAD_REQUEST' },
        });
        return false;
      }

      // Handle message asynchronously
      this.handleMessage(msg)
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((err: unknown) => {
          logger.error(`Error processing message ${msg.type}:`, err);
          sendResponse({
            success: false,
            error: {
              message: (err as Error)?.message || 'An error occurred processing message',
              code: (err as { code?: string })?.code || 'INTERNAL_ERROR',
            },
          });
        });

      // Keep channel open for async response
      return true;
    });

    logger.info('Message router registered');
  }

  private async handleMessage(msg: ExtensionMessage): Promise<unknown> {
    switch (msg.type) {
      case 'QUERY_TABS':
        return tabService.getOpenTabs(msg.payload);

      case 'GET_ALL_WINDOWS':
        return tabService.getAllWindows();

      case 'ACTIVATE_TAB':
        return tabService.activateTab(msg.payload.tabId, msg.payload.windowId);

      case 'CLOSE_TABS':
        return tabService.closeTabs(msg.payload.tabIds);

      case 'MOVE_TABS':
        return tabService.moveTabs(msg.payload.tabIds, msg.payload.index, msg.payload.windowId);

      case 'GROUP_TABS':
        return tabService.groupTabs(msg.payload.tabIds, msg.payload.groupName, msg.payload.color);

      case 'PIN_TAB':
        return tabService.togglePin(msg.payload.tabId, !msg.payload.pinned);

      case 'SAVE_SESSION':
        return sessionService.saveSession(msg.payload);

      case 'RESTORE_SESSION':
        return sessionService.restoreSession(msg.payload.sessionId, msg.payload.options);

      case 'GET_RECENTLY_CLOSED':
        return tabService.getRecentlyClosed();

      case 'RESTORE_RECENTLY_CLOSED':
        return tabService.restoreRecentlyClosed(msg.payload.sessionId);

      case 'EXTRACT_PAGE_CONTENT':
        return tabsAdapter.extractPageContent(msg.payload.tabId);

      case 'TRIGGER_SYNC':
        return syncService.runSync();

      default:
        throw new Error(`Unhandled message type: ${(msg as { type: string }).type}`);
    }
  }
}

export const messageRouter = new MessageRouter();

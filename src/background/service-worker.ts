import { tabEventHandler } from './tab-event-handler';
import { messageRouter } from './message-router';
import { workspaceService } from '../services/workspace-service';
import { sessionService } from '../services/session-service';
import { indexedDbAdapter } from '../adapters/indexeddb-adapter';
import { logger } from '../lib/logger';

logger.info('TabPilot background service worker starting...');

// Initialize listeners
tabEventHandler.init();
messageRouter.init();

// Handle Extension Lifecycle
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(async (details) => {
    logger.info(`TabPilot installed/updated: reason=${details.reason}`);

    try {
      await indexedDbAdapter.init();
      // Ensure default workspaces exist
      await workspaceService.getAllWorkspaces();
      logger.info('Storage initialized and default workspaces confirmed');
    } catch (err) {
      logger.error('Failed to initialize storage on install:', err);
    }
  });
}

// Handle Keyboard Shortcuts
if (typeof chrome !== 'undefined' && chrome.commands) {
  chrome.commands.onCommand.addListener(async (command) => {
    logger.info(`Command received: ${command}`);

    if (command === 'save_session') {
      try {
        const session = await sessionService.saveSession({ currentWindowOnly: true });
        logger.info(`Quick-saved session via command: ${session.name}`);

        // Briefly badge confirmation
        if (chrome.action) {
          chrome.action.setBadgeText({ text: '✓' });
          chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
          setTimeout(() => {
            tabEventHandler.updateTabCountBadge();
          }, 2000);
        }
      } catch (err) {
        logger.error('Failed to quick-save session from shortcut:', err);
      }
    }
  });
}

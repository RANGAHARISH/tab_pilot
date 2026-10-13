import { logger } from './logger';

export async function hasPermission(permission: string): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.permissions) {
    return true; // Non-extension or test mock environment
  }
  try {
    return await new Promise<boolean>((resolve) => {
      chrome.permissions.contains({ permissions: [permission] }, (result) => {
        if (chrome.runtime.lastError) {
          logger.warn(`Permission check failed for ${permission}:`, chrome.runtime.lastError.message);
          resolve(false);
        } else {
          resolve(!!result);
        }
      });
    });
  } catch (err) {
    logger.warn(`Exception checking permission ${permission}:`, err);
    return false;
  }
}

export async function requestPermission(permission: string): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.permissions) {
    return true;
  }
  try {
    return await new Promise<boolean>((resolve) => {
      chrome.permissions.request({ permissions: [permission] }, (granted) => {
        if (chrome.runtime.lastError) {
          logger.warn(`Permission request failed for ${permission}:`, chrome.runtime.lastError.message);
          resolve(false);
        } else {
          resolve(!!granted);
        }
      });
    });
  } catch (err) {
    logger.warn(`Exception requesting permission ${permission}:`, err);
    return false;
  }
}

export function isTabGroupsSupported(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.tabGroups;
}

export function isSessionsSupported(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.sessions;
}

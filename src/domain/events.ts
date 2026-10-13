import type { BrowserTab, SessionRestoreOptions } from './types';

export type ExtensionMessageType =
  | 'QUERY_TABS'
  | 'GET_ALL_WINDOWS'
  | 'ACTIVATE_TAB'
  | 'CLOSE_TABS'
  | 'MOVE_TABS'
  | 'GROUP_TABS'
  | 'PIN_TAB'
  | 'SAVE_SESSION'
  | 'RESTORE_SESSION'
  | 'GET_RECENTLY_CLOSED'
  | 'RESTORE_RECENTLY_CLOSED'
  | 'EXTRACT_PAGE_CONTENT'
  | 'TRIGGER_SYNC';

export interface BaseExtensionMessage<T extends ExtensionMessageType, P = unknown> {
  type: T;
  payload: P;
}

export type QueryTabsMessage = BaseExtensionMessage<
  'QUERY_TABS',
  { currentWindow?: boolean; windowId?: number }
>;

export type ActivateTabMessage = BaseExtensionMessage<
  'ACTIVATE_TAB',
  { tabId: number; windowId?: number }
>;

export type CloseTabsMessage = BaseExtensionMessage<
  'CLOSE_TABS',
  { tabIds: number[] }
>;

export type MoveTabsMessage = BaseExtensionMessage<
  'MOVE_TABS',
  { tabIds: number[]; index: number; windowId?: number }
>;

export type GroupTabsMessage = BaseExtensionMessage<
  'GROUP_TABS',
  { tabIds: number[]; groupName?: string; color?: chrome.tabGroups.ColorEnum }
>;

export type PinTabMessage = BaseExtensionMessage<
  'PIN_TAB',
  { tabId: number; pinned: boolean }
>;

export type SaveSessionMessage = BaseExtensionMessage<
  'SAVE_SESSION',
  { name?: string; tabIds?: number[]; workspaceId?: string | null }
>;

export type RestoreSessionMessage = BaseExtensionMessage<
  'RESTORE_SESSION',
  { sessionId: string; options?: Partial<SessionRestoreOptions> }
>;

export type GetRecentlyClosedMessage = BaseExtensionMessage<
  'GET_RECENTLY_CLOSED',
  Record<string, never>
>;

export type RestoreRecentlyClosedMessage = BaseExtensionMessage<
  'RESTORE_RECENTLY_CLOSED',
  { sessionId: string }
>;

export type ExtractPageContentMessage = BaseExtensionMessage<
  'EXTRACT_PAGE_CONTENT',
  { tabId: number }
>;

export type TriggerSyncMessage = BaseExtensionMessage<
  'TRIGGER_SYNC',
  Record<string, never>
>;

export type GetAllWindowsMessage = BaseExtensionMessage<
  'GET_ALL_WINDOWS',
  Record<string, never> | void
>;

export type ExtensionMessage =
  | QueryTabsMessage
  | GetAllWindowsMessage
  | ActivateTabMessage
  | CloseTabsMessage
  | MoveTabsMessage
  | GroupTabsMessage
  | PinTabMessage
  | SaveSessionMessage
  | RestoreSessionMessage
  | GetRecentlyClosedMessage
  | RestoreRecentlyClosedMessage
  | ExtractPageContentMessage
  | TriggerSyncMessage;

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export type TabListPayload = BrowserTab[];

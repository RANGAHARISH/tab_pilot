export class AppError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StorageError extends AppError {
  constructor(message: string, code = 'STORAGE_ERROR') {
    super(message, code);
  }
}

export class QuotaExceededError extends StorageError {
  constructor(message = 'IndexedDB storage quota exceeded.') {
    super(message, 'QUOTA_EXCEEDED');
  }
}

export class PermissionError extends AppError {
  public readonly permission: string;

  constructor(permission: string, message?: string) {
    super(
      message || `Required browser permission '${permission}' was denied or is missing.`,
      'PERMISSION_DENIED'
    );
    this.permission = permission;
  }
}

export class NetworkError extends AppError {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message, 'NETWORK_ERROR');
    this.status = status;
  }
}

export class AIProviderError extends AppError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message, 'AI_PROVIDER_ERROR');
    this.statusCode = statusCode;
  }
}

export class SyncConflictError extends AppError {
  public readonly entityId: string;
  public readonly localVersion: number;
  public readonly remoteVersion: number;

  constructor(entityId: string, localVersion: number, remoteVersion: number) {
    super(
      `Sync conflict detected on entity ${entityId}. Local version: ${localVersion}, Remote version: ${remoteVersion}`,
      'SYNC_CONFLICT'
    );
    this.entityId = entityId;
    this.localVersion = localVersion;
    this.remoteVersion = remoteVersion;
  }
}

export class ValidationError extends AppError {
  public readonly issues: unknown[];

  constructor(message: string, issues: unknown[] = []) {
    super(message, 'VALIDATION_ERROR');
    this.issues = issues;
  }
}

export class TabOperationError extends AppError {
  public readonly tabId?: number;

  constructor(message: string, tabId?: number) {
    super(message, 'TAB_OPERATION_ERROR');
    this.tabId = tabId;
  }
}

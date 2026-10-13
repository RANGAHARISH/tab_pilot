type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refreshtoken',
  'api_key',
  'apikey',
  'secret',
  'authorization',
  'anon_key',
  'service_role',
]);

function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    // Strip possible API keys or bearer tokens
    if (/bearer\s+[a-zA-Z0-9._-]+/i.test(value)) {
      return value.replace(/bearer\s+[a-zA-Z0-9._-]+/gi, `Bearer ${REDACTED}`);
    }
    return value;
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        result[k] = REDACTED;
      } else {
        result[k] = sanitize(v);
      }
    }
    return result;
  }
  return value;
}

class Logger {
  private isDevelopment = true;

  constructor() {
    try {
      this.isDevelopment =
        typeof process !== 'undefined'
          ? process.env.NODE_ENV !== 'production'
          : true;
    } catch {
      this.isDevelopment = true;
    }
  }

  private log(level: LogLevel, message: string, context?: unknown) {
    const timestamp = new Date().toISOString();
    const prefix = `[TabPilot][${level.toUpperCase()}][${timestamp}]`;
    const cleanContext = context ? sanitize(context) : undefined;

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(prefix, message, cleanContext || '');
        }
        break;
      case 'info':
        console.info(prefix, message, cleanContext || '');
        break;
      case 'warn':
        console.warn(prefix, message, cleanContext || '');
        break;
      case 'error':
        console.error(prefix, message, cleanContext || '');
        break;
    }
  }

  debug(message: string, context?: unknown) {
    this.log('debug', message, context);
  }

  info(message: string, context?: unknown) {
    this.log('info', message, context);
  }

  warn(message: string, context?: unknown) {
    this.log('warn', message, context);
  }

  error(message: string, context?: unknown) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();

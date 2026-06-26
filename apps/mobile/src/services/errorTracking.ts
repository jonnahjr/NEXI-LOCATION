// ═══════════════════════════════════════════════════════════════════════════
// Error Tracking — Sentry-ready scaffold
// Drop-in: replace the console.* calls with Sentry.* when you add the SDK.
// Install: npx expo install @sentry/react-native
// ═══════════════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ── Config ────────────────────────────────────────────────────────────────
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
const ENV = process.env.EXPO_PUBLIC_ENV ?? 'development';
const IS_PRODUCTION = ENV === 'production';
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

// ── Error Breadcrumbs ─────────────────────────────────────────────────────
interface Breadcrumb {
  category: string;
  message: string;
  data?: Record<string, unknown>;
  level?: 'info' | 'warning' | 'error';
  timestamp: number;
}

const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;

function addBreadcrumb(crumb: Omit<Breadcrumb, 'timestamp'>) {
  breadcrumbs.push({ ...crumb, timestamp: Date.now() });
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();

  // Sentry: Sentry.addBreadcrumb(crumb);
}

// ── User context ──────────────────────────────────────────────────────────
let currentUserId: string | null = null;

function setUserContext(userId: string, email?: string, name?: string) {
  currentUserId = userId;
  if (!IS_PRODUCTION) {
    console.log('[ErrorTracking] User context set:', userId);
  }
  // Sentry: Sentry.setUser({ id: userId, email, username: name });
}

function clearUserContext() {
  currentUserId = null;
  // Sentry: Sentry.setUser(null);
}

// ── Capture error ─────────────────────────────────────────────────────────
function captureError(
  error: Error | unknown,
  context?: Record<string, unknown>,
) {
  const err = error instanceof Error ? error : new Error(String(error));

  const payload = {
    message: err.message,
    stack: err.stack,
    userId: currentUserId,
    platform: Platform.OS,
    version: APP_VERSION,
    env: ENV,
    breadcrumbs: [...breadcrumbs],
    context,
    timestamp: new Date().toISOString(),
  };

  if (IS_PRODUCTION) {
    // Sentry: Sentry.captureException(err, { extra: context });
    // Or send to your own backend:
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(payload) })
    console.error('[ErrorTracking]', payload);
  } else {
    console.error(`❌ [${err.name}] ${err.message}`, context ?? '');
  }
}

// ── Capture message ───────────────────────────────────────────────────────
function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>,
) {
  addBreadcrumb({ category: 'log', message, level, data: context });

  if (!IS_PRODUCTION) {
    const prefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [ErrorTracking] ${message}`, context ?? '');
  }
  // Sentry: Sentry.captureMessage(message, level);
}

// ── Performance tracing ───────────────────────────────────────────────────
function startTransaction(name: string, op: string) {
  const start = Date.now();
  addBreadcrumb({ category: 'transaction', message: `START: ${name}` });

  return {
    finish: (status: 'ok' | 'error' = 'ok') => {
      const durationMs = Date.now() - start;
      addBreadcrumb({
        category: 'transaction',
        message: `FINISH: ${name}`,
        data: { durationMs, status },
      });
      if (!IS_PRODUCTION) {
        console.log(`⏱ [Perf] ${name} — ${durationMs}ms [${status}]`);
      }
      // Sentry: transaction.setStatus(status); transaction.finish();
    },
  };
}

// ── Setup global error handler ────────────────────────────────────────────
function setupGlobalErrorHandler() {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    captureError(error, { isFatal, source: 'global_handler' });
    originalHandler(error, isFatal);
  });
}

// ── Navigation breadcrumb helper ──────────────────────────────────────────
function trackScreenView(screenName: string) {
  addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${screenName}`,
    data: { screen: screenName },
    level: 'info',
  });
  // Sentry: Sentry.addBreadcrumb({ category: 'navigation', message: screenName });
}

// ── Track user action ─────────────────────────────────────────────────────
function trackAction(action: string, data?: Record<string, unknown>) {
  addBreadcrumb({ category: 'user', message: action, data, level: 'info' });
}

// ── Init (call once in _layout.tsx) ──────────────────────────────────────
function init() {
  if (!DSN && IS_PRODUCTION) {
    console.warn('[ErrorTracking] EXPO_PUBLIC_SENTRY_DSN not set. Errors will not be reported.');
  }
  setupGlobalErrorHandler();

  if (!IS_PRODUCTION) {
    console.log(`[ErrorTracking] Initialized — env:${ENV} v${APP_VERSION}`);
  }

  // Sentry.init({
  //   dsn: DSN,
  //   environment: ENV,
  //   release: `nexi-locate@${APP_VERSION}`,
  //   tracesSampleRate: IS_PRODUCTION ? 0.2 : 1.0,
  //   enableAutoSessionTracking: true,
  // });
}

// ── Public API ────────────────────────────────────────────────────────────
export const errorTracking = {
  init,
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  startTransaction,
  trackScreenView,
  trackAction,
  addBreadcrumb,
};

export default errorTracking;

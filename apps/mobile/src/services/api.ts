// ── Base API Client ─────────────────────────────────────────────────────────
// Handles REST API calls to the NestJS backend

import { Platform } from 'react-native';
import { API_HOST, API_PORT } from '../config';

// Android emulator: 10.0.2.2 maps to host machine's localhost
// iOS simulator: localhost works directly
// Physical device: use local network IP (set in config.ts)
const DEV_API_HOST = Platform.select({
  android: `http://${API_HOST}:${API_PORT}`,
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const API_BASE_URL = DEV_API_HOST;

// ── Generic fetch wrapper ──────────────────────────────────────────────────

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, timeout = 10000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// ── Convenience methods ────────────────────────────────────────────────────

export const api = {
  get: <T = any>(path: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<T>(`${path}${query}`, { method: 'GET' });
  },
  patch: <T = any>(path: string, body?: any, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<T>(`${path}${query}`, { method: 'PATCH', body });
  },
  post: <T = any>(path: string, body?: any) => {
    return apiRequest<T>(path, { method: 'POST', body });
  },
  delete: <T = any>(path: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<T>(`${path}${query}`, { method: 'DELETE' });
  },
};

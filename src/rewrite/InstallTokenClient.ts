import { Configuration } from '../config/Configuration';
import { InstallTokenStore } from './InstallTokenStore';

const TOKEN_REFRESH_SKEW_MS = 60_000;
const REGISTER_TIMEOUT_MS = 15_000;

interface RegisterResponseBody {
  token?: string;
  error?: string;
}

function parseExpiresAt(token: string): number | undefined {
  const parts = token.split('.');
  if (parts.length !== 4) {
    return undefined;
  }

  const expiresAt = Number(parts[2]);
  return Number.isFinite(expiresAt) ? expiresAt : undefined;
}

export function getRegisterUrl(apiUrl: string): string {
  if (apiUrl.endsWith('/api/rewrite')) {
    return apiUrl.replace(/\/api\/rewrite$/, '/api/register');
  }

  try {
    const url = new URL(apiUrl);
    return `${url.origin}/api/register`;
  } catch {
    return apiUrl.replace(/\/rewrite\/?$/, '/register');
  }
}

export class InstallTokenClient {
  private registerPromise: Promise<string> | undefined;

  constructor(
    private readonly configuration: Configuration,
    private readonly store: InstallTokenStore,
  ) {}

  async getToken(): Promise<string> {
    const existing = await this.store.get();
    if (existing && !this.shouldRefresh(existing)) {
      return existing;
    }

    return this.register();
  }

  async clearAndRefresh(): Promise<string> {
    await this.store.clear();
    this.registerPromise = undefined;
    return this.register();
  }

  private shouldRefresh(token: string): boolean {
    const expiresAt = parseExpiresAt(token);
    if (!expiresAt) {
      return true;
    }

    return Date.now() >= expiresAt - TOKEN_REFRESH_SKEW_MS;
  }

  private register(): Promise<string> {
    if (!this.registerPromise) {
      this.registerPromise = this.fetchAndStoreToken().finally(() => {
        this.registerPromise = undefined;
      });
    }

    return this.registerPromise;
  }

  private async fetchAndStoreToken(): Promise<string> {
    const registerUrl = getRegisterUrl(this.configuration.getApiUrl());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REGISTER_TIMEOUT_MS);

    try {
      const response = await fetch(registerUrl, {
        method: 'POST',
        signal: controller.signal,
      });

      const body = (await response.json().catch(() => ({}))) as RegisterResponseBody;

      if (!response.ok) {
        throw new Error(body.error ?? `Quackie registration failed (${response.status})`);
      }

      if (!body.token) {
        throw new Error('Quackie registration returned an empty token');
      }

      await this.store.set(body.token);
      return body.token;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Quackie registration timed out. Check your connection and try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

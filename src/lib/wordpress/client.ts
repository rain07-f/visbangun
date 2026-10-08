const API_URL = import.meta.env.PUBLIC_WORDPRESS_API_URL || 'https://be-web.visi-bangun.com/wp-json';

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Robust fetch helper for WordPress REST API with timeout and error handling.
 */
export async function wpFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T | null> {
  const { timeoutMs = 8000, ...fetchOptions } = options;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${cleanEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(fetchOptions.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[WordPress API] HTTP ${res.status} for endpoint: ${url}`);
      return null;
    }

    const data = await res.json();
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn(`[WordPress API] Request timed out after ${timeoutMs}ms: ${url}`);
    } else {
      console.warn(`[WordPress API] Network error for ${url}:`, error.message);
    }
    return null;
  }
}

export function getWordpressUrl(): string {
  return import.meta.env.PUBLIC_WORDPRESS_URL || 'https://be-web.visi-bangun.com';
}

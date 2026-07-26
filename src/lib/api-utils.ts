// Master-level utility: Prevents server crashes from hanging/malformed API responses
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'DefenseOS/1.0 (Educational Security Scanner)',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The external service may be rate-limiting or unavailable.');
    }
    throw new Error(error.message || 'Network request failed');
  } finally {
    clearTimeout(id);
  }
}
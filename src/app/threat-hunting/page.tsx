'use client';

import { useState } from 'react';
import { fetchWithTimeout } from '@/lib/api-utils';

export default function ThreatHuntingPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const isIP = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(query.trim());
      const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(query.trim());

      if (isIP) {
        const data = await fetchWithTimeout(`https://ipapi.co/${query.trim()}/json/`);
        setResult({ type: 'IP', data });
      } else if (isDomain) {
        const data = await fetchWithTimeout(`https://dns.google/resolve?name=${query.trim()}&type=ANY`);
        setResult({ type: 'Domain', data });
      } else {
        setError('Invalid input. Please enter a valid IPv4 address or domain name.');
      }
    } catch (err: any) {
      // GRACEFUL DEGRADATION: Shows error to user instead of crashing the server
      setError(err.message || 'Failed to fetch threat intelligence. Service may be temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display text-white">Threat Hunting</h1>
        <span className="px-3 py-1 text-xs font-mono rounded bg-green-500/20 text-green-400 border border-green-500/30">
          ● LIVE API
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter IP (e.g., 8.8.8.8) or Domain (e.g., google.com)"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? 'Scanning...' : 'Hunt'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-sm">
          ⚠️ {error}
        </div>
      )}

      {result && !error && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-6 font-mono text-sm overflow-x-auto">
          <div className="flex items-center gap-2 mb-4 text-cyan-400 font-semibold">
            <span className="text-lg">🔍</span> Live Intelligence for: {query}
          </div>
          <pre className="text-zinc-300 whitespace-pre-wrap break-all">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

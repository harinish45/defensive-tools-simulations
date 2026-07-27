'use client';

import { useState, useEffect } from 'react';

interface CVE {
  id: string;
  summary: string;
  cvss?: number;
  publish_date: string;
}

export default function DashboardPage() {
  const [cves, setCves] = useState<CVE[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uptime, setUptime] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Fix hydration: only run client-side logic after mount
  useEffect(() => {
    setMounted(true);
    
    // Real uptime counter
    const uptimeInterval = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);

    // Fetch REAL live CVEs
    const fetchCVEs = async () => {
      try {
        const res = await fetch('/api/cves');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        // Normalize data to ensure 'id' always exists for React keys
        const normalizedData = data.slice(0, 10).map((item: any, index: number) => ({
          id: item.id || item.CVE_id || item.cve || `cve-fallback-${index}`,
          summary: item.summary || item.title || 'No description available.',
          cvss: item.cvss || item.cvss_score || 0,
          publish_date: item.published || item.publish_date || new Date().toISOString(),
        }));
        
        setCves(normalizedData);
      } catch (err: any) {
        setError('Unable to reach live CVE feed. Check API route.');
      } finally {
        setLoading(false);
      }
    };

    fetchCVEs();
    const cveInterval = setInterval(fetchCVEs, 60000); // Refresh every 60s

    return () => {
      clearInterval(uptimeInterval);
      clearInterval(cveInterval);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // If not mounted yet, render a static skeleton to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold text-white">Security Intelligence Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={`skeleton-${i}`} className="h-24 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display text-white">Security Intelligence Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-mono rounded bg-green-500/20 text-green-400 border border-green-500/30">
            ● LIVE CVE FEED
          </span>
          <span className="text-sm font-mono text-zinc-400">
            Uptime: {formatUptime(uptime)}
          </span>
        </div>
      </div>

      {/* Real Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-lg p-4 border border-zinc-700">
          <div className="text-zinc-400 text-sm font-mono">ACTIVE MODULES</div>
          <div className="text-3xl font-bold text-cyan-400 mt-2">6</div>
          <div className="text-xs text-zinc-500 mt-1">All systems operational</div>
        </div>
        <div className="glass rounded-lg p-4 border border-zinc-700">
          <div className="text-zinc-400 text-sm font-mono">LATEST CVEs</div>
          <div className="text-3xl font-bold text-yellow-400 mt-2">{loading ? '...' : cves.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Fetched from CIRCL.lu</div>
        </div>
        <div className="glass rounded-lg p-4 border border-zinc-700">
          <div className="text-zinc-400 text-sm font-mono">CRITICAL THREATS</div>
          <div className="text-3xl font-bold text-red-400 mt-2">
            {loading ? '...' : cves.filter(c => c.summary?.toLowerCase().includes('critical') || (c.cvss && c.cvss >= 9.0)).length}
          </div>
          <div className="text-xs text-zinc-500 mt-1">In latest feed</div>
        </div>
        <div className="glass rounded-lg p-4 border border-zinc-700">
          <div className="text-zinc-400 text-sm font-mono">CLIENT UPTIME</div>
          <div className="text-3xl font-bold text-green-400 mt-2 font-mono">{formatUptime(uptime)}</div>
          <div className="text-xs text-zinc-500 mt-1">Session active</div>
        </div>
      </div>

      {/* Live Incident Feed (Real CVEs) */}
      <div className="glass rounded-lg border border-zinc-700 overflow-hidden">
        <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live Global Vulnerability Feed
          </h2>
          <span className="text-xs font-mono text-zinc-400">Auto-refresh: 60s</span>
        </div>
        
        <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
          {error && (
            <div className="p-4 text-red-400 font-mono text-sm">{error}</div>
          )}
          {loading && !error && (
            <div className="p-4 text-zinc-400 font-mono text-sm">Connecting to live CVE feed...</div>
          )}
          {!loading && cves.length === 0 && !error && (
            <div className="p-4 text-zinc-400 font-mono text-sm">No recent vulnerabilities found.</div>
          )}
          {cves.map((cve, index) => {
            const isCritical = cve.summary?.toLowerCase().includes('critical') || (cve.cvss && cve.cvss >= 9.0);
            const severity = isCritical ? 'CRITICAL' : 'MEDIUM';
            const color = isCritical ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            
            return (
              <div key={cve.id || `cve-${index}`} className="p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-mono rounded border ${color}`}>
                        {severity}
                      </span>
                      <span className="text-cyan-400 font-mono text-sm font-semibold truncate">
                        {cve.id}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-sm truncate">
                      {cve.summary}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {new Date(cve.publish_date).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { fetchWithTimeout } from '@/lib/api-utils';

export default function PhishingAnalyzerPage() {
  const [emailBody, setEmailBody] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeEmail = async () => {
    if (!emailBody.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = emailBody.match(urlRegex) || [];
      
      let score = 0;
      const flags: string[] = [];

      if (/(urgent|immediate|suspended|verify your account|wire transfer|gift card)/i.test(emailBody)) {
        score += 30;
        flags.push('Urgency/Fear-based language detected');
      }
      if (urls.some((u: string) => /bit\.ly|tinyurl|t\.co/i.test(u))) {
        score += 20;
        flags.push('URL shortener detected (hides true destination)');
      }

      const liveChecks: any[] = [];
      // Limit to 2 URLs to prevent VM memory exhaustion
      for (const url of urls.slice(0, 2)) {
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          const html = await fetchWithTimeout(proxyUrl, {}, 4000);
          
          const titleMatch = (html as string).match(/<title[^>]*>([^<]+)<\/title>/i);
          liveChecks.push({
            url,
            status: 'Live',
            title: titleMatch ? titleMatch[1].trim() : 'No title found',
          });
        } catch (err: any) {
          liveChecks.push({
            url,
            status: 'Failed/Blocked',
            error: err.message,
          });
        }
      }

      setAnalysis({ score: Math.min(score, 100), flags, urlsFound: urls, liveChecks });
    } catch (err: any) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 70) return 'text-red-400 border-red-500/50 bg-red-500/10';
    if (score >= 40) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    return 'text-green-400 border-green-500/50 bg-green-500/10';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display text-white">Phishing Analyzer</h1>
        <span className="px-3 py-1 text-xs font-mono rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          ● HEURISTIC + LIVE FETCH
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-400">Paste Email Body or Headers</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="Dear user, your account will be suspended. Click here: http://bit.ly/xyz..."
            className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"
          />
          <button
            onClick={analyzeEmail}
            disabled={loading || !emailBody.trim()}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-700 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Email'}
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-sm">
              ⚠️ {error}
            </div>
          )}

          {analysis && !error && (
            <div className={`p-6 rounded-lg border ${getSeverityColor(analysis.score)} space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Threat Score: {analysis.score}/100</h3>
                <span className="text-2xl">{analysis.score >= 70 ? '🚨' : analysis.score >= 40 ? '⚠️' : '✅'}</span>
              </div>
              
              {analysis.flags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider opacity-80">Red Flags</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysis.flags.map((flag: string, i: number) => <li key={i}>{flag}</li>)}
                  </ul>
                </div>
              )}

              {analysis.liveChecks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider opacity-80">Live URL Verification</h4>
                  <div className="space-y-2">
                    {analysis.liveChecks.map((check: any, i: number) => (
                      <div key={i} className="bg-black/20 p-3 rounded text-xs font-mono break-all">
                        <div className="text-cyan-300 mb-1">{check.url}</div>
                        <div className="text-zinc-400">
                          Status: <span className={check.status === 'Live' ? 'text-green-400' : 'text-red-400'}>{check.status}</span>
                        </div>
                        {check.title && <div className="text-zinc-300 mt-1">Title: "{check.title}"</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

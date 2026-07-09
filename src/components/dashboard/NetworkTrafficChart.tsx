"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type DataPoint = {
  time: string;
  inbound: number;
  outbound: number;
  blocked: number;
};

// Generate realistic-looking network traffic data
const generateData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      inbound: Math.floor(Math.random() * 500) + 100,
      outbound: Math.floor(Math.random() * 300) + 50,
      blocked: Math.floor(Math.random() * 50) + 5,
    });
  }
  return data;
};

export function NetworkTrafficChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only set the mounted flag and data once after mounting
    const timeout = setTimeout(() => {
      setData(generateData());
      setMounted(true);
    }, 0);

    // Simulate real-time updates every 5 seconds
    const interval = setInterval(() => {
      setData(prev => {
        if (prev.length === 0) return prev;
        const newData = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        newData.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          inbound: Math.max(0, Math.floor(last.inbound + (Math.random() * 40 - 20))),
          outbound: Math.max(0, Math.floor(last.outbound + (Math.random() * 30 - 15))),
          blocked: Math.max(0, Math.floor(last.blocked + (Math.random() * 10 - 5))),
        });
        return newData;
      });
    }, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) return <div className="h-[300px] w-full animate-pulse bg-white/5 rounded-xl border border-white/10"></div>;

  return (
    <div className="glass-panel rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Network Traffic Analysis</h3>
          <p className="text-sm text-muted-foreground">Real-time inbound/outbound flow</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Inbound</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Outbound</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Blocked</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="rgba(255,255,255,0.4)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="rgba(255,255,255,0.4)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} MB/s`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20,20,20,0.9)',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                backdropFilter: 'blur(8px)'
              }}
            />
            <Area type="monotone" dataKey="inbound" stroke="var(--primary)" fillOpacity={1} fill="url(#colorInbound)" strokeWidth={2} />
            <Area type="monotone" dataKey="outbound" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOutbound)" strokeWidth={2} />
            <Area type="monotone" dataKey="blocked" stroke="var(--destructive)" fillOpacity={1} fill="url(#colorBlocked)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

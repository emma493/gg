import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { subscribeToEvents } from '../lib/analytics';

const surface = { background: '#1E1F27', border: '1px solid rgba(255,255,255,0.08)' };

const COLORS = ['#FF2B55', '#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6'];

export default function AnalyticsPage() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsub = subscribeToEvents((list) => {
      setEvents(list);
      setConnected(true);
    }, () => setConnected(false));
    return () => unsub();
  }, []);

  const byType = useMemo(() => {
    const m = {};
    for (const e of events) {
      const t = e.event_type || 'page_view';
      m[t] = (m[t] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [events]);

  // Events per day (last 7 days)
  const byDay = useMemo(() => {
    const m = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      m[d.toISOString().slice(0, 10)] = 0;
    }
    for (const e of events) {
      const ts = e.timestamp;
      const d = ts ? (ts.toDate ? ts.toDate() : new Date(ts)) : new Date();
      const key = d.toISOString().slice(0, 10);
      if (m.hasOwnProperty(key)) m[key] += 1;
    }
    return Object.entries(m);
  }, [events]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-white text-[22px] font-extrabold tracking-tight">Analytics</h1>
          <p className="text-[#8A8B91] text-[13px] mt-1">
            {connected ? 'Live — Firestore real-time' : 'Connecting…'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <div className="lg:col-span-2 rounded-[14px] p-5" style={surface}>
          <h3 className="text-white text-[16px] font-bold mb-4">Events over time (last 7 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDay}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF2B55" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FF2B55" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="0" tick={{ fontSize: 12, fill: '#8A8B91' }} />
                <YAxis tick={{ fontSize: 12, fill: '#8A8B91' }} />
                <Tooltip />
                <Line type="monotone" dataKey="1" stroke="#FF2B55" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[14px] p-5" style={surface}>
          <h3 className="text-white text-[16px] font-bold mb-4">Events by type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="1"
                  nameKey="0"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  fill="#8884d8"
                  label
                >
                  {byType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[14px] p-5" style={surface}>
          <h3 className="text-white text-[16px] font-bold mb-4">Event breakdown</h3>
          <div className="space-y-2">
            {byType.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-2 rounded-[8px]" style={{ background: '#16171D' }}>
                <span className="text-[#8A8B91] text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                <span className="text-white font-mono text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Eye,
  Share2,
  Monitor,
  Clock,
  UserRound,
} from 'lucide-react';
import { subscribeToEventStats, subscribeToUniqueVisitors, subscribeToRecentActivity } from '../lib/analytics';
import { getUserRole } from '../lib/admin';

const surface = { background: '#1E1F27', border: '1px solid rgba(255,255,255,0.08)' };

const StatCard = ({ icon: Icon, label, value, sub, color = '#FF2B55' }) => (
  <div className="rounded-[14px] p-5" style={surface}>
    <div className="flex items-center gap-2.5 text-[#8A8B91] mb-2">
      <Icon size={15} style={{ color }} />
      <span className="text-[12px] font-bold uppercase tracking-[0.12em]">{label}</span>
    </div>
    <div className="text-white text-[28px] font-black tabular-nums">{value}</div>
    <div className="text-[#8A8B91] text-[12px] mt-1">{sub}</div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToEventStats((s) => setStats(s), () => setConnected(false));
    const unsub2 = subscribeToUniqueVisitors((n) => setUniqueVisitors(n), () => setConnected(false));
    const unsub3 = subscribeToRecentActivity((list) => setRecentActivity(list), () => setConnected(false));
    setConnected(true);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const totalEvents = useMemo(() => Object.values(stats).reduce((a, b) => a + b, 0), [stats]);
  const shares = stats.whatsapp_share || 0;
  const registrations = stats.registration_complete || 0;
  const pageViews = stats.page_view || 0;
  const shareRate = pageViews > 0 ? ((shares / pageViews) * 100).toFixed(1) : '0';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-white text-[22px] font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-[#8A8B91] text-[13px] mt-1">
            {connected ? 'Live — Firestore real-time' : 'Connecting to Firestore…'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          icon={Users}
          label="Total visitors"
          value={pageViews.toLocaleString()}
          sub={`${uniqueVisitors} unique • ${Math.max(0, pageViews - uniqueVisitors)} returning`}
        />
        <StatCard
          icon={Share2}
          label="WhatsApp shares"
          value={shares.toLocaleString()}
          sub={`${shareRate}% of visitors shared`}
        />
        <StatCard
          icon={UserRound}
          label="Registrations"
          value={registrations.toLocaleString()}
          sub="Completed sign-ups"
        />
        <StatCard
          icon={Eye}
          label="Admin seat"
          value="1"
          sub="Single admin active"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[14px] p-4" style={surface}>
          <h3 className="text-white text-[16px] font-bold mb-4">Recent activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-[#8A8B91]">No activity yet</div>
          ) : (
            <div className="grid gap-3">
              {recentActivity.map((e) => (
                <div key={e.id} className="p-3 rounded-[10px] flex items-center gap-3" style={{ background: '#16171D' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#FF2B55/20', color: '#FF2B55' }}>
                    {e.event_type === 'whatsapp_share' ? 'S' : e.event_type === 'registration_complete' ? 'R' : 'V'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {e.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div className="text-[#8A8B91] text-[11px] truncate">
                      {e.userId} • {e.country} • {e.device_type}
                    </div>
                  </div>
                  <div className="text-right text-[#8A8B91] text-[11px]">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[14px] p-4" style={surface}>
          <h3 className="text-white text-[16px] font-bold mb-4">Quick stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#8A8B91]">Page views</span>
              <span className="text-white font-mono">{pageViews.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8A8B91]">Unique visitors</span>
              <span className="text-white font-mono">{uniqueVisitors.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8A8B91]">Shares</span>
              <span className="text-white font-mono text-[#34d399]">{shares.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8A8B91]">Registrations</span>
              <span className="text-white font-mono text-[#34d399]">{registrations.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8A8B91]">Share rate</span>
              <span className="text-white font-mono">{shareRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

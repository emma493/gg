import { useEffect, useMemo, useState } from 'react';
import { UserRound, Search } from 'lucide-react';
import { subscribeToEvents } from '../lib/analytics';
import { getCountryInfo } from '../lib/utils';

const surface = { background: '#1E1F27', border: '1px solid rgba(255,255,255,0.08)' };
const inputStyle = { background: '#16171D', border: '1px solid rgba(255,255,255,0.1)' };

export default function UsersPage() {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsub = subscribeToEvents((list) => {
      setEvents(list);
      setConnected(true);
    }, () => setConnected(false));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      const hay = [e.userId, e.country, e.device_type, e.event_type, e.details].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [events, query]);

  // Derive unique visitors with first seen
  const visitorMap = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const uid = e.userId;
      if (!uid || uid === 'anonymous') continue;
      if (!map.has(uid) || new Date(e.timestamp) < new Date(map.get(uid).firstSeen)) {
        map.set(uid, {
          userId: uid,
          firstSeen: e.timestamp,
          lastSeen: e.timestamp,
          country: e.country,
          device: e.device_type,
          events: 0,
        });
      } else {
        const v = map.get(uid);
        if (new Date(e.timestamp) > new Date(v.lastSeen)) v.lastSeen = e.timestamp;
        v.events += 1;
      }
    }
    return [...map.values()].sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
  }, [events]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-white text-[22px] font-extrabold tracking-tight">Visitors</h1>
          <p className="text-[#8A8B91] text-[13px] mt-1">
            {connected ? 'Live — Firestore real-time' : 'Connecting…'}
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search userId, country, device…"
            className="w-full pl-9 pr-3 py-2.5 rounded-[10px] text-white text-[13px] outline-none placeholder:text-[#8A8B91]"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="rounded-[14px] p-4" style={surface}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="pb-2 text-[#8A8B91] text-[11px] font-bold uppercase">User ID</th>
                <th className="pb-2 text-[#8A8B91] text-[11px] font-bold uppercase">Country</th>
                <th className="pb-2 text-[#8A8B91] text-[11px] font-bold uppercase">Device</th>
                <th className="pb-2 text-[#8A8B91] text-[11px] font-bold uppercase">Events</th>
                <th className="pb-2 text-[#8A8B91] text-[11px] font-bold uppercase">First seen</th>
                <th className="pb-2 text-[#8A8B91] text-[11px] font-bold uppercase">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {visitorMap.length === 0 && connected ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8A8B91]">No visitors yet</td>
                </tr>
              ) : (
                visitorMap.map((v) => (
                  <tr key={v.userId} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 text-white font-medium truncate max-w-[150px]" title={v.userId}>{v.userId}</td>
                    <td className="py-3 text-[#8A8B91]">{getCountryInfo(v.country).flag} {v.country}</td>
                    <td className="py-3 text-[#8A8B91]">{v.device}</td>
                    <td className="py-3 text-white font-mono">{v.events}</td>
                    <td className="py-3 text-[#8A8B91] text-[12px]">{new Date(v.firstSeen).toLocaleString()}</td>
                    <td className="py-3 text-[#8A8B91] text-[12px]">{new Date(v.lastSeen).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

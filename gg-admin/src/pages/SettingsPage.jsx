import { useState } from 'react';
import { UserRound, Mail, Lock, AlertCircle } from 'lucide-react';

const surface = { background: '#1E1F27', border: '1px solid rgba(255,255,255,0.08)' };
const inputStyle = { background: '#16171D', border: '1px solid rgba(255,255,255,0.1)' };

export default function SettingsPage({ user }) {
  const [tab, setTab] = useState('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-white text-[22px] font-extrabold tracking-tight">Settings</h1>
        <p className="text-[#8A8B91] text-[13px] mt-1">Manage your admin account</p>
      </div>

      <div className="flex gap-4">
        <nav className="flex flex-col gap-1 w-[200px]">
          {['profile', 'security'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors no-underline w-full text-left ${
                tab === t ? 'bg-[#FF2B55]/[0.12] text-white' : 'text-[#A1A2A7] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {t === 'profile' ? <UserRound size={16} /> : <Lock size={16} />}
              {t === 'profile' ? 'Profile' : 'Security'}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          {tab === 'profile' && (
            <div className="rounded-[14px] p-6" style={surface}>
              <h2 className="text-white text-[18px] font-bold mb-4">Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: '#FF2B55' }}>
                    {(user?.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{user?.displayName || 'Admin'}</div>
                    <div className="text-[#8A8B91] text-[12px]">{user?.email}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="rounded-[14px] p-6" style={surface}>
              <h2 className="text-white text-[18px] font-bold mb-4">Security</h2>
              <p className="text-[#8A8B91] text-[13px] mb-4">Change your admin password.</p>
              {error && <div className="p-3 rounded-[8px] text-[#FF2B55] text-[13px] mb-4" style={{ background: 'rgba(255,43,85,0.1)' }}>{error}</div>}
              {success && <div className="p-3 rounded-[8px] text-[#34d399] text-[13px] mb-4" style={{ background: 'rgba(52,211,153,0.1)' }}>{success}</div>}
              <form onSubmit={(e) => {
                e.preventDefault();
                setSuccess('Password updated successfully.');
              }} className="space-y-3">
                <label className="block text-[#8A8B91] text-[12px] font-bold mb-1.5">Current password</label>
                <input type="password" className="w-full px-3.5 py-2.5 rounded-[10px] text-white text-[14px] outline-none placeholder:text-[#8A8B91]" style={inputStyle} placeholder="••••••••" />
                <label className="block text-[#8A8B91] text-[12px] font-bold mb-1.5">New password</label>
                <input type="password" className="w-full px-3.5 py-2.5 rounded-[10px] text-white text-[14px] outline-none placeholder:text-[#8A8B91]" style={inputStyle} placeholder="••••••••" />
                <button type="submit" className="w-full py-2.5 rounded-[10px] text-white font-bold bg-[#FF2B55] hover:bg-[#FF2B55]/[0.9]">Update password</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

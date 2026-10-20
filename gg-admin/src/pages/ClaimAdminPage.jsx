import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, UserRound } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { checkAdminSeat, claimAdminSeat, logAdminAction } from '../lib/admin';

const surface = { background: '#1E1F27', border: '1px solid rgba(255,255,255,0.08)' };
const inputStyle = { background: '#16171D', border: '1px solid rgba(255,255,255,0.1)' };

function Card({ title, children }) {
  return (
    <div className="rounded-[14px] p-6" style={surface}>
      <h2 className="text-white text-[18px] font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function AuthButton({ children, loading, primary = true }) {
  return (
    <button
      disabled={loading}
      className={`w-full py-2.5 rounded-[10px] text-[14px] font-bold disabled:opacity-60 transition-colors ${
        primary ? 'text-white bg-[#FF2B55] hover:bg-[#FF2B55]/[0.9]' : 'text-[#E1E2E6] hover:text-white hover:bg-white/[0.08]'
      }`}
    >
      {loading && <span className="mr-2">Loading…</span>}
      {children}
    </button>
  );
}

export default function ClaimAdminPage({ user }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [seatClaimed, setSeatClaimed] = useState(false);

  useEffect(() => {
    (async () => {
      const seat = await checkAdminSeat();
      setSeatClaimed(seat.claimed);
      if (seat.claimed) setError('Admin seat already claimed.');
    })();
  }, []);

  const handleClaim = async () => {
    setLoading(true);
    setError('');
    try {
      const u = user;
      if (!u) throw new Error('Not signed in — please log in first');
      await claimAdminSeat(u.uid);
      await setDoc(doc(db, 'users', u.uid), { role: 'admin' }, { merge: true });
      await logAdminAction('claim_admin_seat', u.uid);
      setSuccess('Admin seat claimed! Redirecting…');
      setTimeout(() => { window.location.href = '/gg-admin/dashboard'; }, 1000);
    } catch (e) {
      setError(e.message || 'Failed to claim admin seat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1014' }}>
      <div className="w-full sm:w-[400px] p-6">
        <Card title="Claim Admin Seat">
          <p className="text-[#8A8B91] text-[13px] mb-6">
            Become the sole administrator of this GG project. Only one admin seat exists.
          </p>
          {seatClaimed && (
            <div className="p-3 rounded-[8px] text-[#FF2B55] text-[13px] mb-4 flex items-center gap-2" style={{ background: 'rgba(255,43,85,0.1)' }}>
              <AlertCircle size={14} />
              Admin seat already claimed.
            </div>
          )}
          {!seatClaimed && error && (
            <div className="p-3 rounded-[8px] text-[#FF2B55] text-[13px] mb-4" style={{ background: 'rgba(255,43,85,0.1)' }}>{error}</div>
          )}
          {!seatClaimed && success && (
            <div className="p-3 rounded-[8px] text-[#34d399] text-[13px] mb-4 flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.1)' }}>
              <CheckCircle2 size={14} />
              {success}
            </div>
          )}
          {!seatClaimed && (
            <AuthButton loading={loading} onClick={handleClaim} primary>
              <UserRound size={16} className="mr-2" />
              Claim Admin Seat
            </AuthButton>
          )}
          {seatClaimed && !success && (
            <AuthButton primary>
              Seat taken — sign in to access dashboard
            </AuthButton>
          )}
        </Card>
      </div>
    </div>
  );
}

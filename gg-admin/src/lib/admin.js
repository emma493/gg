import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const SEAT_ID = 'seat';

export async function checkAdminSeat() {
  const seatRef = doc(db, 'admin_seat', SEAT_ID);
  const snap = await getDoc(seatRef);
  if (!snap.exists()) return { claimed: false, claimedBy: null, claimedAt: null };
  const data = snap.data();
  return {
    claimed: data.claimed === true,
    claimedBy: data.claimedBy || null,
    claimedAt: data.claimedAt ? data.claimedAt.toDate() : null,
  };
}

export async function claimAdminSeat(uid) {
  const seatRef = doc(db, 'admin_seat', SEAT_ID);
  const snap = await getDoc(seatRef);
  if (snap.exists() && snap.data().claimed === true) {
    throw new Error('Admin seat already claimed');
  }
  await setDoc(seatRef, {
    claimed: true,
    claimedBy: uid,
    claimedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getUserRole(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data().role || 'user';
}

export async function logAdminAction(action, targetId = null, meta = {}) {
  const { auth } = await import('./firebase');
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(doc(db, 'audit_logs', `${Date.now()}_${Math.random().toString(36).slice(2)}`), {
    action,
    performedBy: user.uid,
    performedByEmail: user.email,
    targetId,
    timestamp: serverTimestamp(),
    ...meta,
  });
}

export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

import { collection, query, where, orderBy, limit, onSnapshot, doc, setDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { db } from './firebase';

export const EVENTS_COLLECTION = 'events';
export const USERS_COLLECTION = 'users';
export const AUDIT_COLLECTION = 'audit_logs';

/**
 * Log an analytics event from the user page.
 * Call this from the Shatta Wale clone (user page) to track visitor behavior.
 */
export async function logEvent(eventData) {
  const { auth } = await import('./firebase');
  const user = auth.currentUser;
  const payload = {
    event_type: eventData.event_type || 'page_view',
    userId: eventData.userId || 'anonymous',
    timestamp: serverTimestamp(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    device_type: eventData.device_type || 'Mobile',
    country: eventData.country || 'GH',
    referrer: typeof document !== 'undefined' ? document.referrer : 'Direct',
    details: eventData.details || '',
    ...(eventData.video_id ? { video_id: eventData.video_id } : {}),
    ...(eventData.referral_group ? { referral_group: eventData.referral_group } : {}),
    ...(eventData.utm_source ? { utm_source: eventData.utm_source } : {}),
    ...(eventData.utm_medium ? { utm_medium: eventData.utm_medium } : {}),
    ...(eventData.utm_campaign ? { utm_campaign: eventData.utm_campaign } : {}),
    ...(eventData.landing_page ? { landing_page: eventData.landing_page } : {}),
    ...(eventData.country_source ? { country_source: eventData.country_source } : {}),
    ...(user ? { performedBy: user.uid, performedByEmail: user.email } : {}),
  };
  await setDoc(doc(collection(db, EVENTS_COLLECTION)), payload);
  return payload;
}

/**
 * Subscribe to all events in real-time.
 */
export function subscribeToEvents(onData, onError) {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
      };
    });
    onData(items);
  }, onError);
}

/**
 * Subscribe to event counts grouped by type for dashboard stats.
 */
export function subscribeToEventStats(onData, onError) {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  return onSnapshot(eventsRef, (snapshot) => {
    const stats = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const type = data.event_type || 'page_view';
      stats[type] = (stats[type] || 0) + 1;
    });
    onData(stats);
  }, onError);
}

/**
 * Subscribe to unique visitors (distinct userIds).
 */
export function subscribeToUniqueVisitors(onData, onError) {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  return onSnapshot(eventsRef, (snapshot) => {
    const ids = new Set();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.userId && data.userId !== 'anonymous') ids.add(data.userId);
    });
    onData(ids.size);
  }, onError);
}

/**
 * Subscribe to recent activity (latest events) for live feed.
 */
export function subscribeToRecentActivity(onData, onError, count = 20) {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(count));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        event_type: data.event_type || 'page_view',
        userId: data.userId || 'anonymous',
        country: data.country || 'GH',
        device_type: data.device_type || 'Mobile',
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
        details: data.details || '',
      };
    });
    onData(items);
  }, onError);
}

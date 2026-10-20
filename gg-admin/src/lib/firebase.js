import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyByP-tAqO4ncfy8cFRKl4S_syetwCHKB2k",
  authDomain: "gg-agency-840eb.firebaseapp.com",
  projectId: "gg-agency-840eb",
  storageBucket: "gg-agency-840eb.firebasestorage.app",
  messagingSenderId: "526401289543",
  appId: "1:526401289543:web:f68620d4e8a7a67b992062",
  measurementId: "G-6LTVD763CV",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

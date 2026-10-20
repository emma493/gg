import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../lib/admin';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

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

function InputField({ label, type = 'text', ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-[#8A8B91] text-[12px] font-bold mb-1.5">{label}</label>
      <input
        type={type}
        className="w-full px-3.5 py-2.5 rounded-[10px] text-white text-[14px] outline-none placeholder:text-[#8A8B91]"
        style={inputStyle}
        {...props}
      />
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

export default function LoginPage({ initialMode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode || 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mode === 'login' ? schema : z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(6, 'Min 6 characters'),
      displayName: z.string().min(2, 'Min 2 characters'),
    })),
    defaultValues: mode === 'login' ? { email: '', password: '' } : { email: '', password: '', displayName: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (mode === 'login') {
        const userCred = await signInWithEmailAndPassword(auth, values.email, values.password);
        await setDoc(doc(db, 'users', userCred.user.uid), { lastLogin: serverTimestamp() }, { merge: true });
        const role = await getUserRole(userCred.user.uid);
        if (role === 'admin') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/claim-admin', { replace: true });
        }
      } else {
        const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email: values.email,
          displayName: values.displayName,
          role: 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isActive: true,
        });
        setSuccess('Account created. You can now log in.');
        setMode('login');
        reset({ email: '', password: '' });
      }
    } catch (e) {
      setError(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1014' }}>
      <div className="w-full sm:w-[400px] p-6">
        <Card title={mode === 'login' ? 'Welcome back' : 'Create account'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {mode === 'signup' && (
              <InputField label="Display name" {...register('displayName')} placeholder="e.g. Admin User" />
            )}
            <InputField label="Email" type="email" {...register('email')} placeholder="you@example.com" />
            <InputField label="Password" type="password" {...register('password')} placeholder="••••••••" />
            {errors.email && <span className="text-[#FF2B55] text-[12px]">{errors.email.message}</span>}
            {errors.password && <span className="text-[#FF2B55] text-[12px]">{errors.password.message}</span>}
            {error && <div className="p-3 rounded-[8px] text-[#FF2B55] text-[13px]" style={{ background: 'rgba(255,43,85,0.1)' }}>{error}</div>}
            {success && <div className="p-3 rounded-[8px] text-[#34d399] text-[13px]" style={{ background: 'rgba(52,211,153,0.1)' }}>{success}</div>}
            <AuthButton loading={loading} primary>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </AuthButton>
            <p className="text-center text-[#8A8B91] text-[13px] mt-4">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[#FF2B55] font-bold hover:underline ml-1"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { X, Mail, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuthModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  if (!isOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setStep('otp');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onClose();
        router.push('/chat');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-md p-8 rounded-3xl relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-3xl font-bold mb-2">Welcome</h2>
        <p className="text-gray-400 mb-8">
          {step === 'email' ? 'Enter your college email to continue.' : 'Check your inbox for the 6-digit code.'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={step === 'email' ? handleRequestOTP : handleVerifyOTP}>
          <div className="space-y-4 mb-8">
            {step === 'email' ? (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="email"
                  placeholder="student@lead.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            ) : (
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all tracking-[0.5em] font-mono text-lg"
                  required
                />
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Processing...' : (step === 'email' ? 'Send OTP' : 'Verify & Continue')}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          By continuing, you agree to our Terms of Service.
        </p>

        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
      </div>
    </div>
  );
}

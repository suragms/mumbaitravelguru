'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Mail, Lock, Smartphone, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, sendOtp, verifyOtp, googleLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await sendOtp(phoneNumber);
      setOtpSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOtp(phoneNumber, otp);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('Google OAuth requires client-side setup. Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID env var and initialize the Google Identity Services library.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-400">MumbaiTravelGuru</h1>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        <div className="metal-card rounded-2xl p-8">
          <div className="flex mb-6 bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('email'); setOtpSent(false); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'email' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Mail className="inline w-4 h-4 mr-1" /> Email
            </button>
            <button
              onClick={() => { setActiveTab('otp'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'otp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone className="inline w-4 h-4 mr-1" /> OTP
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        placeholder="+919876543210"
                        required
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">OTP Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        placeholder="123456"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-800 px-2 text-slate-500">OR</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-100 text-slate-900 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

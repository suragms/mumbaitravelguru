'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  LogOut,
  Plane,
  Compass,
  ShieldCheck,
  User as UserIcon,
  CreditCard,
  History,
  AlertCircle,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import HeroSection from '@/components/HeroSection';
import HomeSections from '@/components/HomeSections';

// Interfaces based on .NET DTOs
interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[];
  createdAt: string;
}

interface AuthResult {
  succeeded: boolean;
  token: string;
  refreshToken: string;
  user?: UserDto;
  error?: string;
}

interface WalletDto {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

interface WalletTransactionDto {
  id: string;
  walletId: string;
  amount: number;
  type: 'Credit' | 'Debit';
  status: string;
  description: string;
  referenceId: string;
  createdAt: string;
}

const POPULAR_ROUTES = [
  { from: 'BOM', to: 'DEL', price: '3,999', label: 'Mumbai → Delhi' },
  { from: 'BOM', to: 'GOI', price: '5,200', label: 'Mumbai → Goa' },
  { from: 'BOM', to: 'BLR', price: '4,499', label: 'Mumbai → Bengaluru' },
  { from: 'BOM', to: 'CCU', price: '5,999', label: 'Mumbai → Kolkata' },
  { from: 'BOM', to: 'PNQ', price: '1,999', label: 'Mumbai → Pune' },
  { from: 'BOM', to: 'JAI', price: '3,799', label: 'Mumbai → Jaipur' },
];

export default function Home() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);

  // Auth Form States
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authError, setAuthError] = useState('');

  // Wallet Form States
  const [walletTab, setWalletTab] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');

  // Load token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('mtg_token');
    const savedUser = localStorage.getItem('mtg_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Set randomized reference ID for transaction idempotency
  const resetReferenceId = () => {
    const prefix = walletTab === 'credit' ? 'TX-DEP-' : 'TX-PAY-';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setReferenceId(`${prefix}${rand}`);
  };

  useEffect(() => {
    if (token) {
      resetReferenceId();
    }
  }, [walletTab, token]);

  // Queries
  const {
    data: wallet,
    isLoading: isWalletLoading,
    isFetching: isWalletFetching,
    refetch: refetchWallet,
  } = useQuery<WalletDto>({
    queryKey: ['wallet'],
    queryFn: () => apiRequest<WalletDto>('/api/v1/wallet/balance'),
    enabled: !!token,
  });

  const {
    data: transactions = [],
    isLoading: isTxLoading,
    refetch: refetchTransactions,
  } = useQuery<WalletTransactionDto[]>({
    queryKey: ['transactions'],
    queryFn: () => apiRequest<WalletTransactionDto[]>('/api/v1/wallet/transactions'),
    enabled: !!token,
  });

  // Auth Mutations
  const loginMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest<AuthResult>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      if (data.succeeded && data.token && data.user) {
        localStorage.setItem('mtg_token', data.token);
        localStorage.setItem('mtg_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
        setAuthError('');
        setEmail('');
        setPassword('');
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    },
    onError: (err: any) => {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest<AuthResult>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      if (data.succeeded && data.token && data.user) {
        localStorage.setItem('mtg_token', data.token);
        localStorage.setItem('mtg_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
        setAuthError('');
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else {
        setAuthError(data.error || 'Registration failed.');
      }
    },
    onError: (err: any) => {
      setAuthError(err.message || 'Registration failed. Check inputs.');
    },
  });

  // Wallet Mutations
  const transactionMutation = useMutation({
    mutationFn: ({ type, body }: { type: 'credit' | 'debit'; body: any }) =>
      apiRequest<WalletTransactionDto>(`/api/v1/wallet/${type}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setWalletSuccess(`Wallet ${walletTab === 'credit' ? 'credited' : 'debited'} successfully!`);
      setWalletError('');
      setAmount('');
      setDescription('');
      resetReferenceId();
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setTimeout(() => setWalletSuccess(''), 5000);
    },
    onError: (err: any) => {
      setWalletError(err.message || 'Transaction failed.');
      setWalletSuccess('');
    },
  });

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ email, password, firstName, lastName, phoneNumber });
    }
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWalletError('');
    setWalletSuccess('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setWalletError('Amount must be a positive number.');
      return;
    }
    if (!description.trim()) {
      setWalletError('Description is required.');
      return;
    }

    transactionMutation.mutate({
      type: walletTab,
      body: {
        amount: parsedAmount,
        description: description.trim(),
        referenceId: referenceId.trim(),
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('mtg_token');
    localStorage.removeItem('mtg_user');
    setToken(null);
    setCurrentUser(null);
    queryClient.clear();
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* -------- Header -------- */}
      <header className="sticky top-0 z-40 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-gate-gold/15 p-1.5 rounded-lg text-gate-gold group-hover:bg-gate-gold/25 transition-colors">
              <Compass className="h-5 w-5" />
            </div>
            <span className="font-display text-lg sm:text-xl text-paper tracking-wide">
              Mumbai Travel Guru
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {token && currentUser ? (
              <>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-paper/90">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  <span className="text-xs text-gate-gold/70 font-mono">
                    {currentUser.roles?.[0] || 'User'}
                  </span>
                </div>
                <Link
                  href="/profile"
                  className="border border-monsoon/60 hover:border-gate-gold/50 text-sandstone p-2 rounded-lg transition-all"
                  title="Profile"
                >
                  <UserIcon className="h-4 w-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="border border-monsoon/60 hover:border-gate-gold/50 text-sandstone p-2 rounded-lg transition-all"
                  title="Log out"
                  id="btn-logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-gate-gold hover:text-gate-gold-dim transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* -------- Main -------- */}
      <main className="flex-1">
        {/* ====== HERO SECTION (full width, self-contained layout) ====== */}
        <HeroSection />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10">

          {/* ====== AUTH / WALLET SECTION ====== */}
          {!token ? (
            /* ---- Anonymous: sign in / register ---- */
            <section className="max-w-lg mx-auto animate-fade-in">
              <div className="bg-harbour border border-monsoon/60 rounded-xl p-5 sm:p-6 relative overflow-hidden">
                <div className="flex mb-5 border-b border-monsoon/50 pb-3">
                  <button
                    onClick={() => { setIsLogin(true); setAuthError(''); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      isLogin
                        ? 'bg-gate-gold/15 text-gate-gold border border-gate-gold/30'
                        : 'text-sandstone/60 hover:text-sandstone'
                    }`}
                    id="tab-login"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => { setIsLogin(false); setAuthError(''); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      !isLogin
                        ? 'bg-gate-gold/15 text-gate-gold border border-gate-gold/30'
                        : 'text-sandstone/60 hover:text-sandstone'
                    }`}
                    id="tab-register"
                  >
                    Create account
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-3 rounded-lg bg-gate-gold/10 border border-gate-gold/20 text-gate-gold text-xs flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3.5">
                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-sandstone/70 font-medium">First name</label>
                        <input
                          type="text" required value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-sea-deep/80 border border-monsoon/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gate-gold text-paper"
                          placeholder="John" id="input-firstname"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-sandstone/70 font-medium">Last name</label>
                        <input
                          type="text" required value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-sea-deep/80 border border-monsoon/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gate-gold text-paper"
                          placeholder="Doe" id="input-lastname"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-sandstone/70 font-medium">Email address</label>
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-sea-deep/80 border border-monsoon/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gate-gold text-paper"
                      placeholder="name@domain.com" id="input-email"
                    />
                  </div>

                  {!isLogin && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-sandstone/70 font-medium">Phone number</label>
                      <input
                        type="tel" required value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-sea-deep/80 border border-monsoon/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gate-gold text-paper"
                        placeholder="+919999999999" id="input-phone"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-sandstone/70 font-medium">Password</label>
                    <input
                      type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-sea-deep/80 border border-monsoon/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gate-gold text-paper"
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" id="input-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginMutation.isPending || registerMutation.isPending}
                    className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 rounded-lg transition-colors mt-1 flex items-center justify-center gap-2 text-sm"
                    id="btn-auth-submit"
                  >
                    {(loginMutation.isPending || registerMutation.isPending) && (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    )}
                    {isLogin ? 'Sign in' : 'Create account'}
                  </button>
                </form>
              </div>
            </section>
          ) : (
            /* ---- Authenticated: Wallet + Transactions ---- */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Wallet Card */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-harbour border border-monsoon/60 rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs text-sandstone/60 tracking-wider uppercase font-medium">Travel Wallet</span>
                      <div className="text-2xl sm:text-3xl font-bold text-paper mt-1 font-mono tracking-tight">
                        {isWalletLoading ? (
                          <span className="h-7 w-28 bg-monsoon/60 animate-pulse rounded inline-block" />
                        ) : (
                          <>
                            <span className="text-sandstone/60 text-lg font-body">₹</span>
                            {wallet?.balance?.toFixed(2)}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-gate-gold/10 border border-gate-gold/20 p-2.5 rounded-xl text-gate-gold">
                      <WalletIcon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-monsoon/50 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-sandstone/60">
                      <ShieldCheck className="h-3.5 w-3.5 text-gate-gold" />
                      <span>Secure &amp; ready to book</span>
                    </div>
                    <button
                      onClick={() => { refetchWallet(); refetchTransactions(); }}
                      className="p-1.5 bg-sea-deep/60 hover:bg-sea-deep border border-monsoon/50 rounded-lg text-sandstone/60 hover:text-sandstone transition-all flex items-center gap-1"
                      title="Refresh"
                    >
                      <RefreshCw className={`h-3 w-3 ${isWalletFetching ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Transaction Form */}
                <div className="bg-harbour border border-monsoon/60 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-paper mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gate-gold" />
                    Manage funds
                  </h3>

                  <div className="flex bg-sea-deep/80 p-0.5 rounded-lg mb-4 border border-monsoon/50">
                    <button
                      onClick={() => setWalletTab('credit')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        walletTab === 'credit'
                          ? 'bg-gate-gold/15 text-gate-gold border border-gate-gold/30'
                          : 'text-sandstone/60 hover:text-sandstone'
                      }`}
                      id="tab-credit"
                    >
                      Add money
                    </button>
                    <button
                      onClick={() => setWalletTab('debit')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        walletTab === 'debit'
                          ? 'bg-gate-gold/15 text-gate-gold border border-gate-gold/30'
                          : 'text-sandstone/60 hover:text-sandstone'
                      }`}
                      id="tab-debit"
                    >
                      Use balance
                    </button>
                  </div>

                  {walletError && (
                    <div className="mb-3 p-2.5 rounded-lg bg-gate-gold/10 border border-gate-gold/20 text-gate-gold text-xs">
                      {walletError}
                    </div>
                  )}
                  {walletSuccess && (
                    <div className="mb-3 p-2.5 rounded-lg bg-gate-gold/10 border border-gate-gold/20 text-gate-gold text-xs">
                      {walletSuccess}
                    </div>
                  )}

                  <form onSubmit={handleTransactionSubmit} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-sandstone/70 font-medium">Amount (₹)</label>
                      <input
                        type="number" step="0.01" required value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-sea-deep/80 border border-monsoon/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gate-gold text-paper font-mono"
                        placeholder="0.00" id="input-tx-amount"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-sandstone/70 font-medium">Description</label>
                      <input
                        type="text" required value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-sea-deep/80 border border-monsoon/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gate-gold text-paper"
                        placeholder={walletTab === 'credit' ? 'e.g. Added via card' : 'e.g. Flight booking'}
                        id="input-tx-desc"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-sandstone/70 font-medium">Reference ID</label>
                        <span className="text-[10px] text-gate-gold/60 bg-gate-gold/5 px-1.5 py-0.5 rounded border border-gate-gold/10">
                          Idempotency key
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text" required value={referenceId}
                          onChange={(e) => setReferenceId(e.target.value)}
                          className="flex-1 bg-sea-deep/80 border border-monsoon/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gate-gold text-paper font-mono"
                          placeholder="TX-REF-12345" id="input-tx-ref"
                        />
                        <button
                          type="button" onClick={resetReferenceId}
                          className="bg-monsoon/40 hover:bg-monsoon/60 border border-monsoon/50 px-2.5 rounded-lg text-xs text-sandstone/70 transition-all"
                        >
                          New
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={transactionMutation.isPending}
                      className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                      id="btn-tx-submit"
                    >
                      {transactionMutation.isPending && (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                      {walletTab === 'credit' ? 'Deposit to wallet' : 'Pay from wallet'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Transactions History */}
              <div className="lg:col-span-2 bg-harbour border border-monsoon/60 rounded-xl p-5 flex flex-col">
                <h3 className="text-sm font-bold text-paper mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-gate-gold" />
                  Recent transactions
                </h3>

                {isTxLoading ? (
                  <div className="flex-1 flex items-center justify-center py-8 gap-2">
                    <RefreshCw className="h-5 w-5 text-gate-gold animate-spin" />
                    <span className="text-xs text-sandstone/60">Loading...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex-1 border border-dashed border-monsoon/50 rounded-xl flex flex-col items-center justify-center py-10 px-4 text-center">
                    <History className="h-8 w-8 text-monsoon-light mb-2" />
                    <span className="text-sm font-semibold text-sandstone/70">No transactions yet</span>
                    <p className="text-xs text-sandstone/50 mt-1 max-w-xs">
                      Deposit funds or complete a booking to see your transaction history here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-5">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-monsoon/50 text-[10px] text-sandstone/50 uppercase font-semibold tracking-wider">
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4 hidden sm:table-cell">Ref ID</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-monsoon/30 text-xs text-paper/80">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-sea-deep/30 transition-colors">
                            <td className="py-2.5 px-4 text-sandstone/60 font-mono whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-2.5 px-4 max-w-[160px] truncate" title={tx.description}>
                              {tx.description}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                tx.type === 'Credit'
                                  ? 'bg-gate-gold/10 text-gate-gold border border-gate-gold/20'
                                  : 'bg-gate-gold/10 text-gate-gold border border-gate-gold/20'
                              }`}>
                                {tx.type === 'Credit' ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-sandstone/40 font-mono text-[10px] hidden sm:table-cell">
                              {tx.referenceId || '—'}
                            </td>
                            <td className={`py-2.5 px-4 text-right font-bold font-mono ${
                              tx.type === 'Credit' ? 'text-gate-gold' : 'text-sandstone'
                            }`}>
                              {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====== POPULAR ROUTES ====== */}
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-display text-xl sm:text-2xl text-paper">
                Popular routes from Mumbai
              </h2>
              <Link
                href="/flights/results?origin=BOM"
                className="text-xs text-gate-gold hover:text-gate-gold-dim font-medium flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {POPULAR_ROUTES.map((route) => (
                <Link
                  key={route.to}
                  href={`/flights/results?origin=BOM&destination=${route.to}&tripType=OneWay&adults=1&cabinClass=Economy`}
                  className="bg-harbour border border-monsoon/60 hover:border-gate-gold/40 rounded-xl p-3.5 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-sandstone/50" />
                      <span className="text-xs font-semibold text-paper/90">{route.label}</span>
                    </div>
                    <Plane className="w-3 h-3 text-sandstone/40 group-hover:text-gate-gold transition-colors" />
                  </div>
                  <div className="font-mono text-gate-gold font-bold text-sm tracking-tight">
                    ₹{route.price}
                  </div>
                  <div className="text-[10px] text-sandstone/50 mt-0.5">per person</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ====== HOME SECTIONS (Why Book, Offers, Packages, Footer) ====== */}
      <HomeSections />
    </div>
  );
}

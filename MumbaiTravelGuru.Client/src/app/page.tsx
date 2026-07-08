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
  Hotel, 
  Bus, 
  Compass, 
  ShieldCheck,
  User as UserIcon,
  CreditCard,
  History,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

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
  const [activeTab, setActiveTab] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');

  // OTA Mock Tab state
  const [otaTab, setOtaTab] = useState<'flights' | 'hotels' | 'buses' | 'holidays'>('flights');

  // Load token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('mtg_token');
    const savedUser = localStorage.getItem('mtg_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Set randomized reference ID for transaction idempotency demo
  const resetReferenceId = () => {
    const prefix = activeTab === 'credit' ? 'TX-DEP-' : 'TX-PAY-';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setReferenceId(`${prefix}${rand}`);
  };

  useEffect(() => {
    if (token) {
      resetReferenceId();
    }
  }, [activeTab, token]);

  // Queries for user wallet balance
  const { 
    data: wallet, 
    isLoading: isWalletLoading, 
    isFetching: isWalletFetching,
    refetch: refetchWallet 
  } = useQuery<WalletDto>({
    queryKey: ['wallet'],
    queryFn: () => apiRequest<WalletDto>('/api/v1/wallet/balance'),
    enabled: !!token,
  });

  // Queries for wallet transactions list
  const { 
    data: transactions = [], 
    isLoading: isTxLoading,
    refetch: refetchTransactions
  } = useQuery<WalletTransactionDto[]>({
    queryKey: ['transactions'],
    queryFn: () => apiRequest<WalletTransactionDto[]>('/api/v1/wallet/transactions'),
    enabled: !!token,
  });

  // Auth Mutations
  const loginMutation = useMutation({
    mutationFn: (body: any) => apiRequest<AuthResult>('/api/v1/auth/login', {
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
        // Force refresh queries
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    },
    onError: (err: any) => {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    }
  });

  const registerMutation = useMutation({
    mutationFn: (body: any) => apiRequest<AuthResult>('/api/v1/auth/register', {
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
        // Force refresh queries
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      } else {
        setAuthError(data.error || 'Registration failed.');
      }
    },
    onError: (err: any) => {
      setAuthError(err.message || 'Registration failed. Check inputs.');
    }
  });

  // Wallet mutations (Credit/Debit)
  const transactionMutation = useMutation({
    mutationFn: ({ type, body }: { type: 'credit' | 'debit'; body: any }) => 
      apiRequest<WalletTransactionDto>(`/api/v1/wallet/${type}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      setWalletSuccess(`Wallet ${activeTab === 'credit' ? 'credited' : 'debited'} successfully!`);
      setWalletError('');
      setAmount('');
      setDescription('');
      resetReferenceId();
      // Invalidate queries to fetch new balance and list
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Auto-clear success message
      setTimeout(() => setWalletSuccess(''), 5000);
    },
    onError: (err: any) => {
      setWalletError(err.message || 'Transaction failed.');
      setWalletSuccess('');
    }
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
      type: activeTab,
      body: {
        amount: parsedAmount,
        description: description.trim(),
        referenceId: referenceId.trim()
      }
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
    <div className="flex-1 flex flex-col glow-primary">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/35">
              <Compass className="h-6 w-6 animate-pulse" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">
              Mumbai Travel Guru
            </span>
          </div>

          {token && currentUser && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-slate-200">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="text-xs text-indigo-400 font-mono capitalize">
                  {currentUser.roles?.[0] || 'User'} Account
                </span>
              </div>
              <Link
                href="/profile"
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-indigo-400 p-2 rounded-lg transition-all"
                title="Profile"
              >
                <UserIcon className="h-4 w-4" />
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 p-2 rounded-lg transition-all"
                title="Log Out"
                id="btn-logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* HERO SECTION FOR BRANDING */}
        <section className="text-center sm:text-left py-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Welcome to the Next-Gen OTA Experience
          </h1>
          <p className="text-slate-400 text-base max-w-2xl">
            Compare and book Flights, Hotels, and Holiday Packages. Add funds to your travel wallet to enjoy zero-convenience fee bookings and fast, instant refunds.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/flights/results?origin=BOM&destination=DEL&tripType=OneWay&adults=1&cabinClass=Economy"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              <Plane className="w-4 h-4" /> Search Flights
            </Link>
            <Link href="/packages"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              <Compass className="w-4 h-4" /> Holiday Packages
            </Link>
            <Link href="/bus"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              <Bus className="w-4 h-4" /> Book Bus Tickets
            </Link>
          </div>
        </section>

        {!token ? (
          /* ANONYMOUS VIEW - AUTHENTICATION FORM */
          <div className="max-w-md w-full mx-auto my-8">
            <div className="glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-3xl"></div>
              
              <div className="flex justify-center mb-6 border-b border-slate-800 pb-4">
                <button 
                  onClick={() => { setIsLogin(true); setAuthError(''); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                  id="tab-login"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setIsLogin(false); setAuthError(''); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                  id="tab-register"
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2 items-start">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400 font-medium">First Name</label>
                      <input 
                        type="text" 
                        required 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                        placeholder="John"
                        id="input-firstname"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400 font-medium">Last Name</label>
                      <input 
                        type="text" 
                        required 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                        placeholder="Doe"
                        id="input-lastname"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                    placeholder="name@domain.com"
                    id="input-email"
                  />
                </div>

                {!isLogin && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-medium">Phone Number</label>
                    <input 
                      type="tel" 
                      required 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                      placeholder="+919999999999"
                      id="input-phone"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                    placeholder="••••••••"
                    id="input-password"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loginMutation.isPending || registerMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-4 flex items-center justify-center gap-2"
                  id="btn-auth-submit"
                >
                  {(loginMutation.isPending || registerMutation.isPending) && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED VIEW - DASHBOARD */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: WALLET CARD & FORM */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              
              {/* Sleek Metallic Wallet Balance Card */}
              <div className="metal-card rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
                
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Travel Wallet Balance</span>
                    <span className="text-3xl font-extrabold tracking-tight text-white mt-1">
                      {isWalletLoading ? (
                        <span className="h-8 w-32 bg-slate-800 animate-pulse rounded inline-block"></span>
                      ) : (
                        `${wallet?.currency} ${wallet?.balance?.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl text-indigo-400">
                    <WalletIcon className="h-6 w-6" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-6">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-indigo-400" />
                    <span>Secure Booking Ready</span>
                  </div>
                  
                  <button 
                    onClick={() => { refetchWallet(); refetchTransactions(); }}
                    className="p-1.5 bg-slate-800/60 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-slate-200 border border-slate-750 transition-all flex items-center gap-1"
                    title="Refresh Balance"
                    id="btn-refresh"
                  >
                    <RefreshCw className={`h-3 w-3 ${isWalletFetching ? 'animate-spin' : ''}`} />
                    <span className="text-[10px]">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Transaction Action Form (Credit/Debit) */}
              <div className="glass rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-400" />
                  Manage Funds
                </h3>

                <div className="flex bg-slate-950 p-1 rounded-xl mb-4 border border-slate-900">
                  <button 
                    onClick={() => setActiveTab('credit')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'credit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    id="tab-credit"
                  >
                    Add Balance (Credit)
                  </button>
                  <button 
                    onClick={() => setActiveTab('debit')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'debit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    id="tab-debit"
                  >
                    Use Balance (Debit)
                  </button>
                </div>

                {walletError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {walletError}
                  </div>
                )}

                {walletSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    {walletSuccess}
                  </div>
                )}

                <form onSubmit={handleTransactionSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-medium">Amount ({wallet?.currency || 'INR'})</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white font-mono"
                      placeholder="0.00"
                      id="input-tx-amount"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-medium">Description</label>
                    <input 
                      type="text" 
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                      placeholder={activeTab === 'credit' ? 'e.g. Added credit card payment' : 'e.g. Flight booking ticket'}
                      id="input-tx-desc"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400 font-medium">Idempotency Reference ID</label>
                      <span className="text-[10px] text-amber-400 bg-amber-400/5 px-1.5 py-0.5 rounded-md border border-amber-400/10">Double-Submit Guard</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={referenceId}
                        onChange={(e) => setReferenceId(e.target.value)}
                        className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white font-mono text-xs"
                        placeholder="TX-REF-12345"
                        id="input-tx-ref"
                      />
                      <button 
                        type="button" 
                        onClick={resetReferenceId}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 rounded-xl text-slate-350 text-xs transition-all"
                        title="Generate New Reference ID"
                      >
                        New
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={transactionMutation.isPending}
                    className={`w-full text-white font-semibold py-3 px-4 rounded-xl transition-all mt-2 flex items-center justify-center gap-2 ${activeTab === 'credit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20'}`}
                    id="btn-tx-submit"
                  >
                    {transactionMutation.isPending && (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    )}
                    {activeTab === 'credit' ? 'Deposit to Wallet' : 'Withdraw / Debit Wallet'}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT COLUMN: OTA TAB PREVIEWS & TRANSACTION LOGS */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Premium OTA Search Interface Preview */}
              <div className="glass rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setOtaTab('flights')}
                      className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-all ${otaTab === 'flights' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-450 hover:text-slate-300'}`}
                    >
                      <Plane className="h-4 w-4" /> Flights
                    </button>
                    <button 
                      onClick={() => setOtaTab('hotels')}
                      className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-all ${otaTab === 'hotels' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-450 hover:text-slate-300'}`}
                    >
                      <Hotel className="h-4 w-4" /> Hotels
                    </button>
                    <button 
                      onClick={() => setOtaTab('buses')}
                      className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-all ${otaTab === 'buses' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-450 hover:text-slate-300'}`}
                    >
                      <Bus className="h-4 w-4" /> Buses
                    </button>
                    <button 
                      onClick={() => setOtaTab('holidays')}
                      className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-all ${otaTab === 'holidays' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-450 hover:text-slate-300'}`}
                    >
                      <Compass className="h-4 w-4" /> Holidays
                    </button>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">OTA Live catalog</span>
                </div>

                {otaTab === 'flights' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">FROM</span>
                        <div className="text-sm font-bold text-white mt-0.5">Mumbai (BOM)</div>
                        <div className="text-xs text-slate-400">Chhatrapati Shivaji Maharaj Airport</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">TO</span>
                        <div className="text-sm font-bold text-white mt-0.5">New Delhi (DEL)</div>
                        <div className="text-xs text-slate-400">Indira Gandhi International Airport</div>
                      </div>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs text-slate-400 text-center sm:text-left">
                        <span>Save flat <strong>10%</strong> on BOM-DEL flights when paying with your <strong>Guru Wallet</strong>!</span>
                      </div>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20">
                        Search Flights
                      </button>
                    </div>
                  </div>
                )}

                {otaTab === 'hotels' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 col-span-1 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">DESTINATION / CITY</span>
                        <div className="text-sm font-bold text-white mt-0.5">Goa, India</div>
                        <div className="text-xs text-slate-400">Popular beach destination</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">GUESTS & ROOMS</span>
                        <div className="text-sm font-bold text-white mt-0.5">2 Adults, 1 Room</div>
                        <div className="text-xs text-slate-400">Couple stay</div>
                      </div>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs text-slate-400 text-center sm:text-left">
                        <span>Direct local property tie-ups on Mumbai Travel Guru offer <strong>free cancellations</strong> inside the Wallet.</span>
                      </div>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20">
                        Search Hotels
                      </button>
                    </div>
                  </div>
                )}

                {otaTab === 'buses' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">FROM</span>
                        <div className="text-sm font-bold text-white mt-0.5">Mumbai</div>
                        <div className="text-xs text-slate-400">Dadar, Borivali, Andheri</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">TO</span>
                        <div className="text-sm font-bold text-white mt-0.5">Pune</div>
                        <div className="text-xs text-slate-400">Shivaji Nagar, Swargate</div>
                      </div>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs text-slate-400 text-center sm:text-left">
                        <span>AC Sleeper, Seater & Volvo buses available. <strong>Free cancellation</strong> up to 4 hours before departure!</span>
                      </div>
                      <button className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md shadow-amber-600/20">
                        Search Buses
                      </button>
                    </div>
                  </div>
                )}

                {otaTab === 'holidays' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-850 flex gap-4">
                        <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400 h-10 w-10 flex items-center justify-center shrink-0">
                          <Compass className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Classic Maldives Getaway</div>
                          <div className="text-xs text-slate-400 mt-0.5">5 Days / 4 Nights • Resort stay included</div>
                          <div className="text-indigo-400 text-xs font-bold mt-2">INR 45,999 / person</div>
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-850 flex gap-4">
                        <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 h-10 w-10 flex items-center justify-center shrink-0">
                          <Compass className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Exploring Alibaug & Konkan</div>
                          <div className="text-xs text-slate-400 mt-0.5">3 Days / 2 Nights • Cab & hotel package</div>
                          <div className="text-indigo-400 text-xs font-bold mt-2">INR 12,499 / person</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transactions History Log Table */}
              <div className="glass rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-400" />
                  Wallet Transactions History
                </h3>

                {isTxLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3">
                    <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                    <span className="text-sm text-slate-500">Loading transactions...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex-1 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center py-12 px-4 text-center">
                    <History className="h-10 w-10 text-slate-600 mb-2" />
                    <span className="text-sm font-semibold text-slate-400">No Transactions Found</span>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Deposit some virtual funds or complete a booking to see your transaction history.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-850">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-850 text-[10px] text-slate-450 uppercase font-semibold tracking-wider">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Reference ID</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-xs text-slate-300 font-sans">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-900/35 transition-all">
                            <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4 max-w-[200px] truncate" title={tx.description}>
                              {tx.description}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${tx.type === 'Credit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'}`}>
                                {tx.type === 'Credit' ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-450 font-mono text-[10px]">
                              {tx.referenceId || 'N/A'}
                            </td>
                            <td className={`py-3 px-4 text-right font-extrabold font-mono ${tx.type === 'Credit' ? 'text-emerald-400' : 'text-rose-450'}`}>
                              {tx.type === 'Credit' ? '+' : '-'}{tx.amount?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-8 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 HexaStack Solutions. Prepared for Mumbai Travel Guru. All rights reserved.</p>
        <p className="mt-1 text-slate-650">Developed by Surag (Co-Founder & Full Stack Developer) & Anandu Krishna (Co-Founder & Product Lead)</p>
      </footer>
    </div>
  );
}

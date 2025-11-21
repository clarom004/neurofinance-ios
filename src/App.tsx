// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Activity,
  Zap,
  Target,
  CalendarDays,
  Sigma,
  ArrowRightLeft,
  X,
  Banknote,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';

// --- 1. CONFIGURAZIONE FIREBASE ---
// ⚠️ INCOLLA QUI SOTTO LE TUE CHIAVI REALI PRESE DALLA CONSOLE FIREBASE ⚠️
const firebaseConfig = {
  apiKey: 'AIzaSyBYYPNJAy8cLRKNMdLIQFF-z3HEYeHAJSg',
  authDomain: 'neurofinance-app.firebaseapp.com',
  projectId: 'neurofinance-app',
  storageBucket: 'neurofinance-app.firebasestorage.app',
  messagingSenderId: '334458613442',
  appId: '1:334458613442:web:ccfac732896c71065a955b',
};

// Inizializzazione sicura del sistema
let app, auth, db;
try {
  // Avvia solo se c'è una configurazione valida
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error('Errore Inizializzazione Firebase:', e);
}

const APP_ID = 'neuro-finance-production';

// --- 2. UTILITIES GRAFICHE E FORMATTAZIONE ---
const formatCurrency = (val) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
    val
  );

const ScientificCurrency = ({ value, size = 'large' }) => {
  const parts = formatCurrency(value).match(/^(.+)(,\d{2}.*)$/);
  if (!parts)
    return (
      <span className="text-white font-bold">{formatCurrency(value)}</span>
    );
  return (
    <div className="font-mono font-bold tracking-tighter text-white flex items-baseline">
      <span className={size === 'large' ? 'text-4xl md:text-6xl' : 'text-xl'}>
        {parts[1]}
      </span>
      <span
        className={`opacity-60 ${size === 'large' ? 'text-xl' : 'text-sm'}`}
      >
        {parts[2]}
      </span>
    </div>
  );
};

const GlassCard = ({ children, className = '' }) => (
  <div
    className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl ${className}`}
  >
    {children}
  </div>
);

const StatPill = ({ icon: Icon, label, value, color, sub }) => (
  <div className="flex flex-col justify-between h-full relative z-10">
    <div className="flex items-center gap-2 mb-2">
      <div
        className={`p-1.5 rounded-lg bg-opacity-20 ${color.replace(
          'text-',
          'bg-'
        )}`}
      >
        <Icon size={16} className={color} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
    </div>
    <div>
      <div className={`text-lg font-bold font-mono tracking-tight ${color}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
          {sub}
        </div>
      )}
    </div>
  </div>
);

// --- 3. VISTA AUTENTICAZIONE (LOGIN/SIGNUP) ---
const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!auth) return setError('Chiavi Firebase mancanti nel codice!');
    setError('');
    setLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setError('Errore: Controlla email e password (min 6 caratteri).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6 animate-bounce">
            <Sigma size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            NeuroFinance
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Ecosistema Finanziario Personale
          </p>
        </div>
        <GlassCard className="p-8">
          <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6 border border-white/5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${
                isLogin ? 'bg-slate-800 text-white' : 'text-slate-500'
              }`}
            >
              Accedi
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${
                !isLogin ? 'bg-slate-800 text-white' : 'text-slate-500'
              }`}
            >
              Registrati
            </button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail
                className="absolute left-4 top-3.5 text-slate-500"
                size={16}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 text-white text-sm focus:border-cyan-500 outline-none transition-all"
                placeholder="Email"
                required
              />
            </div>
            <div className="relative">
              <Lock
                className="absolute left-4 top-3.5 text-slate-500"
                size={16}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 text-white text-sm focus:border-cyan-500 outline-none transition-all"
                placeholder="Password"
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-bold text-center">
                {error}
              </div>
            )}
            <button
              disabled={loading}
              className="w-full bg-white text-slate-950 font-bold py-4 rounded-xl hover:bg-cyan-50 transition-all flex justify-center gap-2 items-center shadow-lg shadow-white/5"
            >
              {loading ? (
                <Activity className="animate-spin" />
              ) : isLogin ? (
                'Entra nel Wallet'
              ) : (
                'Crea Account'
              )}{' '}
              <ArrowRight size={16} />
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

// --- 4. DASHBOARD & LOGICA CORE ---
const Dashboard = ({ user }) => {
  const [txs, setTxs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dash');
  const [showAdd, setShowAdd] = useState(false);
  const [timeRange, setTimeRange] = useState('month');

  // Data Fetching
  useEffect(() => {
    if (!db) return;

    // Ascolta Profilo
    const unsubP = onSnapshot(
      doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'),
      (s) => {
        setProfile(s.exists() ? s.data() : null);
        // Se il profilo non esiste, togliamo il loading per mostrare la calibrazione
        if (!s.exists()) setLoading(false);
      }
    );

    // Ascolta Transazioni
    const unsubT = onSnapshot(
      query(
        collection(db, 'artifacts', APP_ID, 'users', user.uid, 'transactions'),
        orderBy('createdAt', 'desc')
      ),
      (s) => {
        setTxs(
          s.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          }))
        );
        // Se il profilo esiste già, togliamo il loading qui
        if (profile) setLoading(false);
      }
    );

    return () => {
      unsubP();
      unsubT();
    };
  }, [user, profile]); // Aggiunto profile alle dipendenze per reattività sullo stato di caricamento

  // Analytics Engine
  const stats = useMemo(() => {
    if (!profile) return null;
    const now = new Date();
    const start =
      timeRange === 'month'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), 0, 1);
    const periodTxs = txs.filter((t) => t.createdAt >= start);

    const income = periodTxs
      .filter((t) => t.type === 'income')
      .reduce((a, b) => a + b.amount, 0);
    const expense = periodTxs
      .filter((t) => t.type === 'expense')
      .reduce((a, b) => a + b.amount, 0);

    // Calcolo patrimonio netto totale (storico completo)
    const totalInc = txs
      .filter((t) => t.type === 'income')
      .reduce((a, b) => a + b.amount, 0);
    const totalExp = txs
      .filter((t) => t.type === 'expense')
      .reduce((a, b) => a + b.amount, 0);
    const netWorth = (profile.initialBalance || 0) + totalInc - totalExp;

    const needs = periodTxs
      .filter((t) => t.cat === 'NEEDS' && t.type === 'expense')
      .reduce((a, b) => a + b.amount, 0);
    const wants = periodTxs
      .filter((t) => t.cat === 'WANTS' && t.type === 'expense')
      .reduce((a, b) => a + b.amount, 0);

    // Gestione Percentuali (evita divisione per zero)
    const pctNeeds = income > 0 ? (needs / income) * 100 : 0;
    const pctWants = income > 0 ? (wants / income) * 100 : 0;
    const savingsPct = income > 0 ? Math.max(0, 100 - pctNeeds - pctWants) : 0;

    // Generazione Grafico
    let bal = profile.initialBalance || 0;
    // Ordina cronologicamente crescente per il calcolo progressivo
    const sortedTxs = [...txs].sort((a, b) => a.createdAt - b.createdAt);
    const chartData = sortedTxs
      .map((t) => {
        bal += t.type === 'income' ? t.amount : -t.amount;
        return {
          label: t.createdAt.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
          }),
          val: bal,
          date: t.createdAt,
        };
      })
      .filter((p) => p.date >= start);

    // Se non ci sono dati nel periodo, mostra almeno il punto di partenza
    if (chartData.length === 0)
      chartData.push({ label: 'Oggi', val: netWorth });

    return {
      netWorth,
      income,
      expense,
      net: income - expense,
      needs,
      wants,
      pctNeeds,
      pctWants,
      savingsPct,
      chartData,
    };
  }, [txs, profile, timeRange]);

  const saveTx = async (data) => {
    await addDoc(
      collection(db, 'artifacts', APP_ID, 'users', user.uid, 'transactions'),
      { ...data, createdAt: serverTimestamp() }
    );
    setShowAdd(false);
  };

  const initProfile = async (bal) => {
    await setDoc(
      doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'),
      { initialBalance: bal }
    );
    setLoading(false); // Forza aggiornamento stato
  };

  // Onboarding per nuovi utenti (se non c'è profilo)
  if (!profile && !loading)
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-6 text-white animate-in fade-in">
        <div className="max-w-xs w-full text-center">
          <Wallet
            size={48}
            className="text-cyan-400 mx-auto mb-6 animate-pulse"
          />
          <h2 className="text-2xl font-bold mb-2">Calibrazione Wallet</h2>
          <p className="text-slate-400 text-sm mb-6">
            Inserisci il saldo attuale dei tuoi conti per inizializzare gli
            algoritmi.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              initProfile(parseFloat(e.target.bal.value));
            }}
          >
            <input
              name="bal"
              type="number"
              step="0.01"
              placeholder="0.00 €"
              className="w-full bg-transparent border-b-2 border-slate-700 text-4xl font-mono font-bold text-center py-4 outline-none mb-6 focus:border-cyan-500 transition-colors"
              autoFocus
              required
            />
            <button className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/10">
              Inizializza Sistema
            </button>
          </form>
          <button
            onClick={() => signOut(auth)}
            className="mt-6 text-xs text-slate-600 hover:text-rose-400 transition-colors"
          >
            Annulla e Esci
          </button>
        </div>
      </div>
    );

  if (!stats)
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="text-cyan-500 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-32 font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
          <Sigma size={20} className="text-cyan-400" />
          <span className="font-bold text-white">NeuroFinance</span>
        </div>
        <button onClick={() => signOut(auth)}>
          <LogOut
            size={20}
            className="text-slate-500 hover:text-rose-400 transition-colors"
          />
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-4 max-w-6xl mx-auto space-y-6">
        {view === 'dash' && (
          <div className="animate-in slide-in-from-bottom-4 space-y-6">
            {/* Net Worth Section */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Patrimonio Netto
                </p>
                <div className="bg-slate-800 p-1 rounded-full flex text-[10px] font-bold border border-white/5">
                  <button
                    onClick={() => setTimeRange('month')}
                    className={`px-4 py-1 rounded-full transition-all ${
                      timeRange === 'month'
                        ? 'bg-slate-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    1M
                  </button>
                  <button
                    onClick={() => setTimeRange('year')}
                    className={`px-4 py-1 rounded-full transition-all ${
                      timeRange === 'year'
                        ? 'bg-slate-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    1Y
                  </button>
                </div>
              </div>
              <ScientificCurrency value={stats.netWorth} />
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <GlassCard className="p-4">
                <StatPill
                  icon={TrendingUp}
                  label="Entrate"
                  value={formatCurrency(stats.income)}
                  color="text-emerald-400"
                />
              </GlassCard>
              <GlassCard className="p-4">
                <StatPill
                  icon={TrendingDown}
                  label="Uscite"
                  value={formatCurrency(stats.expense)}
                  color="text-rose-400"
                />
              </GlassCard>
              <GlassCard className="p-4">
                <StatPill
                  icon={ArrowRightLeft}
                  label="Cash Flow"
                  value={
                    (stats.net >= 0 ? '+' : '') + formatCurrency(stats.net)
                  }
                  color="text-blue-400"
                />
              </GlassCard>
              <GlassCard className="p-4">
                <StatPill
                  icon={Target}
                  label="Savings Rate"
                  value={stats.savingsPct.toFixed(1) + '%'}
                  color={
                    stats.savingsPct > 0 ? 'text-cyan-400' : 'text-slate-400'
                  }
                />
              </GlassCard>
            </div>

            {/* Strategy 50/30/20 */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Strategia Allocativa
                </h3>
                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">
                  50/30/20
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">
                      Necessità
                    </span>
                    <span className="text-slate-400">
                      {stats.pctNeeds.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, stats.pctNeeds)}%` }}
                      className="h-full bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Desideri</span>
                    <span className="text-slate-400">
                      {stats.pctWants.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, stats.pctWants)}%` }}
                      className="h-full bg-rose-400 rounded-full shadow-[0_0_10px_rgba(251,113,133,0.4)]"
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Risparmi</span>
                    <span className="text-slate-400">
                      {stats.savingsPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.savingsPct}%` }}
                      className="h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                    ></div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Chart */}
            <div className="h-64 w-full pt-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">
                Trend Temporale
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#1e293b"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    minTickGap={40}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                    }}
                    itemStyle={{ color: '#22d3ee' }}
                    formatter={(val) => [formatCurrency(val), 'Saldo']}
                  />
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    fill="url(#colorVal)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="animate-in fade-in space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                Storico Transazioni
              </h2>
              <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-bold">
                {txs.length} records
              </span>
            </div>
            {txs.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex gap-4 items-center">
                  <div
                    className={`p-3 rounded-xl shadow-lg ${
                      t.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {t.type === 'income' ? (
                      <TrendingUp size={18} />
                    ) : (
                      <TrendingDown size={18} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-200">
                      {t.description}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      {t.createdAt.toLocaleDateString()} • {t.cat}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono font-bold ${
                      t.type === 'income'
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </p>
                  <button
                    onClick={() =>
                      deleteDoc(
                        doc(
                          db,
                          'artifacts',
                          APP_ID,
                          'users',
                          user.uid,
                          'transactions',
                          t.id
                        )
                      )
                    }
                    className="text-[10px] text-slate-600 mt-1 hover:text-rose-400 transition-colors"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'report' && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm animate-in fade-in border border-dashed border-slate-800 rounded-3xl">
            <CalendarDays size={40} className="mb-4 opacity-20" />
            <p>Modulo Reportistica Avanzata</p>
            <p className="text-xs opacity-50 mt-2">Disponibile a breve</p>
          </div>
        )}
      </main>

      {/* Modale Aggiungi Transazione */}
      {showAdd && (
        <AddOverlay onClose={() => setShowAdd(false)} onSave={saveTx} />
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex gap-2 z-40 scale-90 sm:scale-100 transition-all">
        <button
          onClick={() => setView('dash')}
          className={`p-3.5 rounded-xl transition-all ${
            view === 'dash'
              ? 'bg-white text-slate-900 shadow-lg shadow-white/10'
              : 'text-slate-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard size={24} />
        </button>
        <button
          onClick={() => setView('report')}
          className={`p-3.5 rounded-xl transition-all ${
            view === 'report'
              ? 'bg-white text-slate-900 shadow-lg shadow-white/10'
              : 'text-slate-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Banknote size={24} />
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="p-4 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-xl shadow-lg shadow-cyan-500/30 mx-1 hover:scale-105 active:scale-95 transition-all border border-white/10"
        >
          <Plus size={24} />
        </button>
        <button
          onClick={() => setView('history')}
          className={`p-3.5 rounded-xl transition-all ${
            view === 'history'
              ? 'bg-white text-slate-900 shadow-lg shadow-white/10'
              : 'text-slate-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <ListChecks size={24} />
        </button>
      </nav>
    </div>
  );
};

// Componente Modale Aggiunta
const AddOverlay = ({ onClose, onSave }) => {
  const [amt, setAmt] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');
  const [cat, setCat] = useState('NEEDS');

  const sub = (e) => {
    e.preventDefault();
    if (!amt || !desc) return;
    onSave({
      amount: parseFloat(amt),
      description: desc,
      type,
      cat: type === 'income' ? 'INCOME' : cat,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 animate-in slide-in-from-bottom-10 fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
        <h3 className="text-white font-bold mb-6 text-lg">Nuova Transazione</h3>
        <form onSubmit={sub} className="space-y-6">
          <div className="flex bg-slate-950 p-1.5 rounded-2xl relative border border-white/5">
            <div
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-800 rounded-xl transition-all duration-300 ease-out ${
                type === 'income'
                  ? 'translate-x-[calc(100%+6px)]'
                  : 'translate-x-1.5'
              }`}
            ></div>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all relative z-10 ${
                type === 'expense' ? 'text-rose-400' : 'text-slate-500'
              }`}
            >
              Uscita
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all relative z-10 ${
                type === 'income' ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              Entrata
            </button>
          </div>
          <div className="relative group text-center">
            <span className="absolute left-0 top-4 text-slate-600 text-sm font-bold tracking-widest">
              EUR
            </span>
            <input
              type="number"
              step="0.01"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-6xl font-mono font-bold text-center text-white border-b-2 border-slate-800 py-2 outline-none focus:border-cyan-500 transition-colors"
              autoFocus
            />
          </div>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descrizione (es. Spesa, Stipendio)"
            className="w-full bg-slate-800/50 p-4 rounded-xl text-white text-sm outline-none border border-white/5 focus:border-cyan-500/50 transition-all"
          />
          {type === 'expense' && (
            <div className="animate-in fade-in">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">
                Categoria
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'NEEDS', label: 'Necessità', color: 'blue' },
                  { id: 'WANTS', label: 'Desideri', color: 'purple' },
                  { id: 'UNCATEGORIZED', label: 'Altro', color: 'slate' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCat(c.id)}
                    className={`p-3 text-[10px] font-bold rounded-xl border transition-all ${
                      cat === c.id
                        ? `bg-${c.color}-500/20 border-${c.color}-500 text-${c.color}-400 shadow-lg`
                        : 'border-slate-800 bg-slate-800/30 text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button className="w-full bg-white text-slate-950 font-bold py-4 rounded-xl hover:bg-cyan-50 transition-all shadow-lg shadow-white/10 uppercase tracking-wider text-sm">
            Conferma Operazione
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  if (!authChecked)
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="text-slate-700 animate-pulse" />
      </div>
    );

  return user ? <Dashboard user={user} /> : <AuthView />;
}

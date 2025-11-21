// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  signOut 
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
  serverTimestamp
} from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, LayoutDashboard, ListChecks, 
  LogOut, Activity, Zap, Target, CalendarDays, Sigma, ArrowRightLeft, 
  X, Banknote, Settings, SlidersHorizontal, Lock, Mail, ArrowRight
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
let sys = { auth: null, db: null, appId: 'neuro-finance-production' };
try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0) {
    const app = initializeApp(firebaseConfig);
    sys.auth = getAuth(app);
    sys.db = getFirestore(app);
  }
} catch (e) {
  console.error("Errore Inizializzazione Firebase:", e);
}

// --- 2. SCIENTIFIC FORMATTERS (GOLD STANDARD) ---
const formatCurrencySimple = (val) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
const formatDate = (date) => new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
const formatMonth = (date) => new Date(date).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

const ScientificCurrency = ({ value, size = "large", color = "text-white" }) => {
  const formatted = new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2 
  }).format(value);
  const match = formatted.match(/^(.+)(,\d{2}.*)$/);
  if (!match) return <span className={color}>{formatted}</span>;
  const [_, integerPart, decimalPart] = match;
  const intSize = size === "large" ? "text-4xl md:text-6xl" : "text-xl md:text-2xl";
  const decSize = size === "large" ? "text-xl md:text-2xl" : "text-sm md:text-base";
  return (
    <div className={`font-mono font-bold tracking-tighter ${color} flex items-baseline`}>
      <span className={intSize}>{integerPart}</span>
      <span className={`opacity-60 ${decSize}`}>{decimalPart}</span>
    </div>
  );
};

// --- 3. ATOMIC UI COMPONENTS ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/20 ${className}`}>
    {children}
  </div>
);

const StatPill = ({ icon: Icon, label, value, colorClass, subValue, valueColor = "text-white" }) => (
  <div className="flex flex-col justify-between h-full relative z-10">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
        <Icon size={16} className={colorClass} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    </div>
    <div>
      <div className={`text-lg font-bold font-mono tracking-tight ${valueColor}`}>{value}</div>
      {subValue && <div className="text-[10px] text-slate-500 font-medium mt-0.5">{subValue}</div>}
    </div>
  </div>
);

// --- 4. AUTH VIEW (GATEKEEPER) ---
const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!sys.auth) return setError("Inserisci le chiavi Firebase nel codice!");
    setError(''); setLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(sys.auth, email, password);
      else await createUserWithEmailAndPassword(sys.auth, email, password);
    } catch (err) {
      console.error(err);
      setError("Errore: Controlla email e password (min 6 caratteri).");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6 animate-bounce">
            <Sigma size={40} className="text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">NeuroFinance</h1>
          <p className="text-slate-400 text-sm mt-2">Accesso Biometrico Sicuro</p>
        </div>
        <GlassCard className="p-8">
          <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6 border border-white/5">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${isLogin ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Accedi</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${!isLogin ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Registrati</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative"><Mail className="absolute left-4 top-3.5 text-slate-500" size={16} /><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 text-white text-sm focus:border-cyan-500 outline-none transition-all" placeholder="Email" required/></div>
            <div className="relative"><Lock className="absolute left-4 top-3.5 text-slate-500" size={16} /><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 text-white text-sm focus:border-cyan-500 outline-none transition-all" placeholder="Password" required/></div>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-bold text-center">{error}</div>}
            <button disabled={loading} className="w-full bg-white text-slate-950 font-bold py-4 rounded-xl hover:bg-cyan-50 transition-all flex justify-center gap-2 items-center shadow-lg shadow-white/5">{loading ? <Activity className="animate-spin"/> : (isLogin ? 'Entra nel Wallet' : 'Crea Account')} <ArrowRight size={16}/></button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

// --- 5. CORE SYSTEM VIEWS (GOLD STANDARD PRESERVED) ---

// A. DASHBOARD
const DashboardView = ({ analytics, timeRange, setTimeRange }) => {
  if (!analytics) return <div className="h-full flex items-center justify-center"><Activity className="animate-spin text-cyan-500"/></div>;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md z-50">
          <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">{label}</p>
          <p className="text-cyan-400 font-mono font-bold text-sm">{formatCurrencySimple(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const visualSavingsPct = analytics.periodIncome > 0 ? Math.max(0, 100 - analytics.pctNeeds - analytics.pctWants) : 0;

  return (
    <div className="space-y-6 pb-48 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative pt-2 px-2">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2"><Wallet size={12} /> Patrimonio Netto</h2>
          <div className="flex bg-slate-800/80 rounded-full p-1 border border-white/5 backdrop-blur-md">
            <button onClick={() => setTimeRange('month')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${timeRange === 'month' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>1M</button>
            <button onClick={() => setTimeRange('year')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${timeRange === 'year' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>1Y</button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
          <ScientificCurrency value={analytics.netWorth} size="large" />
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg self-start md:self-auto ${analytics.savingsRate >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{analytics.savingsRate >= 0 ? '+' : ''}{analytics.savingsRate.toFixed(1)}% Saving Rate</span>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <GlassCard className="p-4 relative group overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none"></div>
            <StatPill icon={TrendingUp} label="Entrate" value={formatCurrencySimple(analytics.periodIncome)} subValue={timeRange === 'month' ? 'Nel mese corrente' : 'Anno corrente'} colorClass="text-emerald-400" valueColor="text-emerald-400" />
        </GlassCard>
        <GlassCard className="p-4 relative group overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/10 blur-2xl rounded-full pointer-events-none"></div>
            <StatPill icon={TrendingDown} label="Uscite" value={formatCurrencySimple(analytics.periodExpense)} subValue={timeRange === 'month' ? 'Nel mese corrente' : 'Anno corrente'} colorClass="text-rose-400" valueColor="text-rose-400" />
        </GlassCard>
        <GlassCard className="p-4 relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full pointer-events-none"></div>
           <StatPill icon={ArrowRightLeft} label="Cash Flow" value={`${analytics.periodIncome >= analytics.periodExpense ? '+' : ''}${formatCurrencySimple(analytics.periodIncome - analytics.periodExpense)}`} subValue="Differenziale Netto" colorClass="text-blue-400" />
        </GlassCard>
        <GlassCard className="p-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none"></div>
          <StatPill icon={Activity} label="Runway" value={`${analytics.runwayDays} gg`} subValue="Sopravvivenza" colorClass="text-cyan-400" />
        </GlassCard>
        <GlassCard className="p-4 md:col-span-2 lg:col-span-1"><StatPill icon={Zap} label="Burn Rate" value={formatCurrencySimple(analytics.burnRateDaily)} subValue="Media giornaliera" colorClass="text-amber-400" /></GlassCard>
        <GlassCard className="p-4 md:col-span-2 lg:col-span-1"><StatPill icon={Sigma} label="Volatilità (σ)" value={formatCurrencySimple(analytics.stdDev)} subValue="Rischio / Dev. Std" colorClass="text-purple-400" /></GlassCard>
      </section>

      <GlassCard className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Target size={16} className="text-indigo-400"/> Strategia Allocativa</h3>
          <span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-400">Target: 50/30/20</span>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-xs mb-2"><span className="text-slate-300 font-bold">Necessità (Needs)</span><span className="text-white font-mono">{formatCurrencySimple(analytics.needs)} <span className="text-slate-500">/ {analytics.pctNeeds.toFixed(1)}%</span></span></div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5"><div className={`h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] ${analytics.pctNeeds > 50 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{width: `${Math.min(analytics.pctNeeds, 100)}%`}}></div></div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2"><span className="text-slate-300 font-bold">Desideri (Wants)</span><span className="text-white font-mono">{formatCurrencySimple(analytics.wants)} <span className="text-slate-500">/ {analytics.pctWants.toFixed(1)}%</span></span></div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5"><div className={`h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] ${analytics.pctWants > 30 ? 'bg-rose-500' : 'bg-purple-500'}`} style={{width: `${Math.min(analytics.pctWants, 100)}%`}}></div></div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2"><span className="text-slate-300 font-bold">Risparmi (Savings)</span><span className="text-white font-mono">{formatCurrencySimple(analytics.periodIncome - analytics.needs - analytics.wants)} <span className="text-slate-500">/ {visualSavingsPct.toFixed(1)}%</span></span></div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{width: `${visualSavingsPct}%`}}></div></div>
          </div>
        </div>
      </GlassCard>

      <div className="h-72 w-full pt-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 px-2 tracking-widest">Trend Temporale</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analytics.timeline} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs><linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} minTickGap={40} dy={10}/>
            <YAxis hide domain={['auto', 'auto']}/>
            <Tooltip content={<CustomTooltip />} cursor={{stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4'}} />
            <Area type="monotone" dataKey="balance" stroke="#22d3ee" strokeWidth={3} fill="url(#colorGradient)" animationDuration={1500}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// B. HISTORY
const HistoryView = ({ transactions, onDelete }) => {
  const [deleteId, setDeleteId] = useState(null);
  const handleDelete = (id) => { if (deleteId === id) { onDelete(id); setDeleteId(null); } else { setDeleteId(id); setTimeout(() => setDeleteId(null), 3000); } };
  return (
    <div className="pb-32 animate-in fade-in space-y-4">
      <div className="flex items-center justify-between mb-6 px-2"><h2 className="text-xl font-bold text-white tracking-tight">Storico Movimenti</h2><span className="bg-slate-800 text-slate-400 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-white/5">{transactions.length} records</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {transactions.map(t => (
          <div key={t.id} className="group relative flex items-center bg-slate-900/60 backdrop-blur-md border border-white/5 p-4 rounded-2xl hover:bg-slate-800/60 transition-all duration-200 hover:border-white/10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 border border-white/5 shadow-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{t.type === 'income' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}</div>
            <div className="flex-1 min-w-0"><h4 className="text-slate-200 font-bold text-sm truncate">{t.description}</h4><div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{formatDate(t.createdAt)}</span>{t.type === 'expense' && (<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${t.cat === 'NEEDS' ? 'border-blue-500/30 text-blue-400' : t.cat === 'WANTS' ? 'border-purple-500/30 text-purple-400' : 'border-slate-600 text-slate-500'}`}>{t.cat === 'NEEDS' ? 'Needs' : t.cat === 'WANTS' ? 'Wants' : 'Other'}</span>)}</div></div>
            <div className="text-right pl-2"><div className={`font-mono font-bold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrencySimple(t.amount)}</div><button onClick={() => handleDelete(t.id)} className={`mt-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${deleteId === t.id ? 'text-rose-500 animate-pulse' : 'text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100'}`}>{deleteId === t.id ? 'Confermi?' : 'Elimina'}</button></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// C. REPORT
const MonthlyReportView = ({ transactions }) => {
  const monthlyStats = useMemo(() => {
    const map = {};
    transactions.forEach(t => { const key = `${t.createdAt.getFullYear()}-${t.createdAt.getMonth()}`; if (!map[key]) map[key] = { date: t.createdAt, income: 0, expense: 0 }; if (t.type === 'income') map[key].income += t.amount; else map[key].expense += t.amount; });
    return Object.values(map).sort((a, b) => b.date - a.date);
  }, [transactions]);
  return (
    <div className="pb-32 animate-in fade-in space-y-6">
      <h2 className="text-xl font-bold text-white mb-6 px-2 tracking-tight">Report Mensile</h2>
      {monthlyStats.length === 0 && (<div className="text-center text-slate-500 py-20 font-mono text-sm">Nessun dato storico disponibile.</div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthlyStats.map((m, idx) => {
          const balance = m.income - m.expense;
          const savingsRate = m.income > 0 ? (balance / m.income) * 100 : 0;
          return (
            <GlassCard key={idx} className="p-5 flex flex-col gap-4 hover:bg-slate-900/80 transition-colors">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-3"><div className="p-2 bg-slate-800 rounded-xl text-cyan-400"><CalendarDays size={18} /></div><span className="font-bold text-slate-200 capitalize text-sm">{formatMonth(m.date)}</span></div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold font-mono ${balance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{balance > 0 ? '+' : ''}{formatCurrencySimple(balance)}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950/50 p-2 rounded-xl border border-white/5"><p className="text-[9px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Entrate</p><p className="text-emerald-400 font-mono font-bold text-xs">{formatCurrencySimple(m.income)}</p></div>
                <div className="bg-slate-950/50 p-2 rounded-xl border border-white/5"><p className="text-[9px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Uscite</p><p className="text-rose-400 font-mono font-bold text-xs">{formatCurrencySimple(m.expense)}</p></div>
                <div className="bg-slate-950/50 p-2 rounded-xl border border-white/5"><p className="text-[9px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Rate</p><p className={`font-mono font-bold text-xs ${savingsRate > 20 ? 'text-blue-400' : savingsRate > 0 ? 'text-slate-300' : 'text-rose-500'}`}>{savingsRate.toFixed(0)}%</p></div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

// D. OVERLAYS (ADD & SETTINGS)
const AddTransactionOverlay = ({ onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');
  const [cat, setCat] = useState('NEEDS');
  const handleSubmit = (e) => { e.preventDefault(); if (!amount || !desc) return; onSave({ amount: parseFloat(amount.replace(',', '.')), description: desc, type, cat: type === 'income' ? 'INCOME' : cat }); onClose(); };
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="p-5 flex justify-between items-center border-b border-white/5"><h3 className="text-white font-bold text-lg">Nuova Transazione</h3><button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="bg-slate-950 p-1.5 rounded-2xl flex border border-white/5 relative">
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-800 rounded-xl transition-all duration-300 ease-out ${type === 'income' ? 'translate-x-[calc(100%+6px)] bg-emerald-500/20' : 'translate-x-1.5 bg-rose-500/20'}`}></div>
            <button type="button" onClick={()=>setType('expense')} className={`flex-1 py-3 relative z-10 rounded-xl text-sm font-bold transition-colors ${type === 'expense' ? 'text-rose-400' : 'text-slate-500'}`}>Uscita</button>
            <button type="button" onClick={()=>setType('income')} className={`flex-1 py-3 relative z-10 rounded-xl text-sm font-bold transition-colors ${type === 'income' ? 'text-emerald-400' : 'text-slate-500'}`}>Entrata</button>
          </div>
          <div className="text-center relative group"><span className="absolute left-0 top-4 text-slate-600 text-sm font-bold tracking-widest">EUR</span><input type="number" inputMode="decimal" step="0.01" autoFocus value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent text-6xl font-mono font-bold text-center text-white border-b-2 border-slate-800 focus:border-cyan-500 outline-none py-2 placeholder-slate-800 transition-colors"/></div>
          <div><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrizione (es. Spesa, Stipendio)" className="w-full bg-slate-800/50 text-white rounded-xl px-5 py-4 outline-none border border-white/5 focus:border-cyan-500/50 transition-all text-sm font-medium placeholder-slate-600"/></div>
          {type === 'expense' && (<div className="animate-in fade-in slide-in-from-top-2"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Categoria 50/30/20</label><div className="grid grid-cols-3 gap-2">{[{ id: 'NEEDS', label: 'Necessità', color: 'blue' }, { id: 'WANTS', label: 'Desideri', color: 'purple' }, { id: 'UNCATEGORIZED', label: 'Altro', color: 'slate' }].map(c => (<button key={c.id} type="button" onClick={() => setCat(c.id)} className={`p-3 rounded-xl border text-xs font-bold transition-all ${cat === c.id ? `bg-${c.color}-500/20 border-${c.color}-500 text-${c.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.2)]` : 'bg-slate-800/30 border-transparent text-slate-500 hover:bg-slate-800'}`}>{c.label}</button>))}</div></div>)}
          <button className="w-full bg-white text-slate-950 font-bold py-4 rounded-2xl hover:bg-cyan-50 active:scale-95 transition-all shadow-xl shadow-white/5 text-sm uppercase tracking-wider">Conferma Operazione</button>
        </form>
      </div>
    </div>
  );
};

const SettingsModal = ({ onClose, onSave, currentInit }) => {
  const [val, setVal] = useState(currentInit);
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl p-6">
        <h3 className="text-white font-bold text-lg mb-2">Configurazione Wallet</h3>
        <p className="text-slate-400 text-xs mb-6">Ricalibra il saldo iniziale per allinearlo al tuo conto bancario reale.</p>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Saldo Iniziale</label>
        <input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl p-4 font-mono text-xl outline-none focus:border-cyan-500 mb-6"/>
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">Annulla</button><button onClick={() => { onSave(parseFloat(val)); onClose(); }} className="flex-1 py-3 rounded-xl text-sm font-bold bg-cyan-500 text-slate-900 hover:bg-cyan-400 transition-colors">Salva</button></div>
      </div>
    </div>
  );
};

// --- 6. NEURO CORE (LOGIC & STATE) ---
const NeuroCore = ({ user }) => {
  const [data, setData] = useState({ txs: [], profile: null, loading: true });
  const [view, setView] = useState('dashboard');
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const userRef = collection(sys.db, 'artifacts', sys.appId, 'users', user.uid, 'transactions');
    const profileRef = doc(sys.db, 'artifacts', sys.appId, 'users', user.uid, 'profile', 'main');
    const unsubProfile = onSnapshot(profileRef, (s) => setData(prev => ({ ...prev, profile: s.exists() ? s.data() : null, loading: s.exists() ? prev.loading : false })));
    const unsubTxs = onSnapshot(query(userRef, orderBy('createdAt', 'desc')), (s) => {
      const txs = s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }));
      setData(prev => ({ ...prev, txs, loading: false }));
    });
    return () => { unsubProfile(); unsubTxs(); };
  }, [user]);

  const analytics = useMemo(() => {
    if (!data.profile) return null;
    const now = new Date();
    const start = timeRange === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), 0, 1);
    const periodTxs = data.txs.filter(t => t.createdAt >= start);
    const periodIncome = periodTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const periodExpense = periodTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalInc = data.txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExp = data.txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const netWorth = (data.profile.initialBalance || 0) + totalInc - totalExp;
    const daysElapsed = Math.max(1, (now - start) / (1000 * 60 * 60 * 24));
    const burnRateDaily = periodExpense / daysElapsed;
    const runwayDays = burnRateDaily > 0 ? Math.floor(netWorth / burnRateDaily) : 9999;
    const expenseTxs = periodTxs.filter(t => t.type === 'expense');
    const meanExp = expenseTxs.length > 0 ? periodExpense / expenseTxs.length : 0;
    const variance = expenseTxs.reduce((acc, t) => acc + Math.pow(t.amount - meanExp, 2), 0) / (expenseTxs.length || 1);
    const stdDev = Math.sqrt(variance);
    const needs = periodTxs.filter(t => t.cat === 'NEEDS' && t.type === 'expense').reduce((acc,t)=>acc+t.amount,0);
    const wants = periodTxs.filter(t => t.cat === 'WANTS' && t.type === 'expense').reduce((acc,t)=>acc+t.amount,0);
    const pctNeeds = periodIncome > 0 ? (needs/periodIncome)*100 : 0;
    const pctWants = periodIncome > 0 ? (wants/periodIncome)*100 : 0;
    let runningBal = data.profile.initialBalance || 0;
    const chartData = [...data.txs].sort((a,b) => a.createdAt - b.createdAt).map(t => { runningBal += (t.type === 'income' ? t.amount : -t.amount); return { date: t.createdAt, balance: runningBal }; }).filter(pt => pt.date >= start).map(pt => ({ label: formatDate(pt.date), balance: pt.balance }));
    if (chartData.length === 0) chartData.push({ label: 'Start', balance: netWorth });
    return { netWorth, periodIncome, periodExpense, burnRateDaily, runwayDays, stdDev, pctNeeds, pctWants, timeline: chartData, savingsRate: periodIncome > 0 ? ((periodIncome - periodExpense) / periodIncome) * 100 : 0, needs, wants };
  }, [data, timeRange]);

  const handleSaveTx = async (tx) => await addDoc(collection(sys.db, 'artifacts', sys.appId, 'users', user.uid, 'transactions'), { ...tx, createdAt: serverTimestamp() });
  const handleDeleteTx = async (id) => await deleteDoc(doc(sys.db, 'artifacts', sys.appId, 'users', user.uid, 'transactions', id));
  const handleUpdateProfile = async (bal) => await setDoc(doc(sys.db, 'artifacts', sys.appId, 'users', user.uid, 'profile', 'main'), { initialBalance: bal }, { merge: true });

  if (!data.profile && !data.loading) return (
    <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center mb-8 animate-bounce"><Wallet size={40} className="text-cyan-400"/></div>
      <h1 className="text-3xl font-bold mb-2 text-center">NeuroFinance</h1>
      <p className="text-slate-400 text-center mb-8 max-w-xs text-sm">Inserisci il saldo attuale per calibrare il sistema.</p>
      <form onSubmit={(e)=>{e.preventDefault(); handleUpdateProfile(parseFloat(e.target.bal.value));}} className="w-full max-w-xs">
        <input name="bal" type="number" step="0.01" placeholder="0.00 €" className="w-full bg-transparent border-b-2 border-slate-700 focus:border-cyan-500 text-4xl font-mono font-bold text-center py-4 outline-none mb-8" autoFocus required/>
        <button className="w-full bg-white text-slate-950 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/10">Inizializza</button>
      </form>
      <button onClick={()=>signOut(sys.auth)} className="mt-6 text-xs text-slate-600">Esci</button>
    </div>
  );

  if (data.loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Activity className="text-cyan-500 animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20"><Sigma size={18} className="text-white"/></div><span className="font-bold text-white tracking-tight text-lg">NeuroFinance</span></div>
        <button onClick={() => signOut(sys.auth)} className="p-2 text-slate-500 hover:text-rose-400 transition-colors"><LogOut size={20}/></button>
      </header>
      <main className="pt-24 px-4 max-w-7xl mx-auto min-h-screen w-full md:px-8">
        <div className="max-w-lg mx-auto md:max-w-none">
          {view === 'dashboard' && <DashboardView analytics={analytics} timeRange={timeRange} setTimeRange={setTimeRange} />}
          {view === 'history' && <HistoryView transactions={data.txs} onDelete={handleDeleteTx} />}
          {view === 'report' && <MonthlyReportView transactions={data.txs} />}
        </div>
      </main>
      {showAdd && <AddTransactionOverlay onClose={() => setShowAdd(false)} onSave={handleSaveTx} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={handleUpdateProfile} currentInit={data.profile.initialBalance} />}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl shadow-black/50 flex items-center gap-2 scale-90 sm:scale-100">
        <button onClick={() => setView('dashboard')} className={`p-3.5 rounded-xl transition-all duration-300 ${view === 'dashboard' ? 'bg-white text-slate-900 shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><LayoutDashboard size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} /></button>
        <button onClick={() => setView('report')} className={`p-3.5 rounded-xl transition-all duration-300 ${view === 'report' ? 'bg-white text-slate-900 shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Banknote size={24} strokeWidth={view === 'report' ? 2.5 : 2} /></button>
        <button onClick={() => setShowAdd(true)} className="mx-1 bg-gradient-to-tr from-cyan-400 to-blue-500 text-white p-4 rounded-xl shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-transform border border-white/20"><Plus size={28} strokeWidth={3} /></button>
        <button onClick={() => setView('history')} className={`p-3.5 rounded-xl transition-all duration-300 ${view === 'history' ? 'bg-white text-slate-900 shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><ListChecks size={24} strokeWidth={view === 'history' ? 2.5 : 2} /></button>
        <button onClick={() => setShowSettings(true)} className="p-3.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"><Wallet size={24} strokeWidth={2} /></button>
      </nav>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    if(!sys.auth) return;
    return onAuthStateChanged(sys.auth, setUser);
  }, []);
  return user ? <NeuroCore user={user} /> : <AuthView />;
}
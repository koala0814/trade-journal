import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext.tsx';
import { PlusCircle, CheckCircle2, AlertCircle, Loader2, ArrowUpRight, ArrowDownRight, Sparkles, Brain, Clock, ShieldCheck, DollarSign } from 'lucide-react';

interface TradeLoggerProps {
  onTradeAdded?: () => void;
  onNavigateToDashboard?: () => void;
}

export default function TradeLogger({ onTradeAdded, onNavigateToDashboard }: TradeLoggerProps) {
  const { getToken } = useAuth();

  // Form State
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<'Buy' | 'Sell'>('Buy');
  const [lotSize, setLotSize] = useState('0.10');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [profit, setProfit] = useState('');
  const [commission, setCommission] = useState('0');
  const [swap, setSwap] = useState('0');
  const [entryTime, setEntryTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [exitTime, setExitTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [strategy, setStrategy] = useState('Breakout');
  const [session, setSession] = useState('London');
  const [followedRules, setFollowedRules] = useState<boolean>(true);
  const [mentalStatePre, setMentalStatePre] = useState('Calm');
  const [mentalStateDuring, setMentalStateDuring] = useState('Focused');
  const [mentalStatePost, setMentalStatePost] = useState('Satisfied');
  const [setupAnalysis, setSetupAnalysis] = useState('');
  const [outcomeAnalysis, setOutcomeAnalysis] = useState('');

  // Status & UI State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Quick Preset Symbol Suggestion Chips
  const popularSymbols = ['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'US30', 'NAS100'];
  const strategies = ['Breakout', 'Pullback', 'Liquidity Sweep', 'Fair Value Gap', 'Range Trading', 'Trend Following', 'News Trading'];
  const mentalStates = ['Calm', 'Focused', 'Anxious', 'FOMO', 'Greedy', 'Hesitant', 'Patient', 'Overconfident'];

  // Calculate estimated profit if prices are entered
  const handleAutoCalcProfit = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const lots = parseFloat(lotSize) || 1;
    if (!isNaN(entry) && !isNaN(exit)) {
      let estProfit = 0;
      if (direction === 'Buy') {
        estProfit = (exit - entry) * lots * 1000; // General multiplier representation
      } else {
        estProfit = (entry - exit) * lots * 1000;
      }
      if (!profit || profit === '0') {
        setProfit(estProfit.toFixed(2));
      }
    }
  };

  const resetForm = () => {
    setSymbol('');
    setDirection('Buy');
    setLotSize('0.10');
    setEntryPrice('');
    setExitPrice('');
    setProfit('');
    setCommission('0');
    setSwap('0');
    setEntryTime(new Date().toISOString().slice(0, 16));
    setExitTime(new Date().toISOString().slice(0, 16));
    setSetupAnalysis('');
    setOutcomeAnalysis('');
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!symbol.trim()) {
      setError('Please provide a trading symbol (e.g. EURUSD, XAUUSD)');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const tradePayload = {
        symbol: symbol.toUpperCase().trim(),
        direction,
        lotSize: lotSize || '0.01',
        entryPrice: entryPrice ? entryPrice.toString() : '0',
        exitPrice: exitPrice ? exitPrice.toString() : '0',
        profit: profit ? profit.toString() : '0',
        commission: commission ? commission.toString() : '0',
        swap: swap ? swap.toString() : '0',
        entryTime: entryTime ? new Date(entryTime).toISOString() : new Date().toISOString(),
        exitTime: exitTime ? new Date(exitTime).toISOString() : new Date().toISOString(),
        strategy,
        session,
        followedRules,
        mentalStatePre,
        mentalStateDuring,
        mentalStatePost,
        setupAnalysis,
        outcomeAnalysis,
      };

      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tradePayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to log trade');
      }

      setSuccess(true);
      if (onTradeAdded) onTradeAdded();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error creating trade entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#161b22] p-6 rounded-xl border border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-[#e6edf3]">Manual Trade Logger</h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-1 font-mono">
            Record complete trade metrics, execution context, and psychological reflections.
          </p>
        </div>
        {onNavigateToDashboard && (
          <button
            onClick={onNavigateToDashboard}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] text-xs font-semibold rounded-lg border border-[#30363d] transition-colors"
          >
            View Dashboard
          </button>
        )}
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-emerald-400 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Trade successfully logged to your journal!</p>
              <p className="text-xs text-emerald-400/80">Your analytics and win rate have been updated live.</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg transition-colors border border-emerald-500/30"
            >
              Log Another Trade
            </button>
            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Trade Parameters */}
        <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#30363d] pb-3 mb-4">
            <DollarSign className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#e6edf3]">1. Trade Execution Details</h2>
          </div>

          {/* Quick Symbol Chips */}
          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1">Trading Symbol / Instrument *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {popularSymbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setSymbol(sym)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono border transition-colors ${
                    symbol.toUpperCase() === sym
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-[#8b949e] hover:text-[#e6edf3]'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. EURUSD, XAUUSD, BTCUSD, AAPL"
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500 uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Direction Selector */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('Buy')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors ${
                    direction === 'Buy'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('Sell')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors ${
                    direction === 'Sell'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                      : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> SELL / SHORT
                </button>
              </div>
            </div>

            {/* Position Size */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Lot / Position Size</label>
              <input
                type="number"
                step="any"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                placeholder="0.10"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Net Profit */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-mono text-[#8b949e]">Net Profit / Loss ($) *</label>
                <button
                  type="button"
                  onClick={handleAutoCalcProfit}
                  className="text-[10px] text-indigo-400 hover:underline font-mono"
                >
                  Auto-calc
                </button>
              </div>
              <input
                type="number"
                step="any"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
                onBlur={handleAutoCalcProfit}
                placeholder="e.g. +150.50 or -75.00"
                className={`w-full bg-[#0d1117] border rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500 ${
                  Number(profit) > 0
                    ? 'border-emerald-500/50 text-emerald-400 font-bold'
                    : Number(profit) < 0
                    ? 'border-rose-500/50 text-rose-400 font-bold'
                    : 'border-[#30363d]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Entry Price */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Entry Price</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="1.0850"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Exit Price */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Exit Price</label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="1.0920"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Commission */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Commission ($)</label>
              <input
                type="number"
                step="any"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Swap */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Swap ($)</label>
              <input
                type="number"
                step="any"
                value={swap}
                onChange={(e) => setSwap(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Entry Time */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" /> Entry Date & Time
              </label>
              <input
                type="datetime-local"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Exit Time */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" /> Exit Date & Time
              </label>
              <input
                type="datetime-local"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Strategy & Playbook */}
        <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#30363d] pb-3 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#e6edf3]">2. Strategy & Session Context</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Strategy Select */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Trading Setup / Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              >
                {strategies.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Select */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Trading Session</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-mono text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              >
                <option value="Asian">Asian Session</option>
                <option value="London">London Session</option>
                <option value="New York">New York Session</option>
                <option value="London/NY Overlap">London / NY Overlap</option>
              </select>
            </div>

            {/* Followed Rules Checkbox */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Plan Discipline</label>
              <button
                type="button"
                onClick={() => setFollowedRules(!followedRules)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
                  followedRules
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {followedRules ? 'Followed Trading Plan ✓' : 'Deviated From Plan ✗'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Psychology & Reflection */}
        <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#30363d] pb-3 mb-4">
            <Brain className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#e6edf3]">3. Psychology & Qualitative Journal</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pre-Trade Mental State */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Pre-Trade Mindset</label>
              <select
                value={mentalStatePre}
                onChange={(e) => setMentalStatePre(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              >
                {mentalStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* During Trade Mindset */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">In-Trade Mindset</label>
              <select
                value={mentalStateDuring}
                onChange={(e) => setMentalStateDuring(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              >
                {mentalStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Post-Trade Mindset */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Post-Trade Mindset</label>
              <select
                value={mentalStatePost}
                onChange={(e) => setMentalStatePost(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              >
                {mentalStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Setup Analysis */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Setup Rationale & Analysis</label>
              <textarea
                value={setupAnalysis}
                onChange={(e) => setSetupAnalysis(e.target.value)}
                rows={3}
                placeholder="Why did you take this trade? Confluence factors, higher timeframe bias..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Outcome Analysis */}
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Execution Outcome & Lessons</label>
              <textarea
                value={outcomeAnalysis}
                onChange={(e) => setOutcomeAnalysis(e.target.value)}
                rows={3}
                placeholder="What went well or wrong? Takeaways for next time..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-5 py-3 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border border-[#30363d]"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Logging Trade...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" /> Save Trade To Journal
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

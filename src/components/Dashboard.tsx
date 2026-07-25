import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext.tsx';
import { ArrowUpRight, ArrowDownRight, Target, StickyNote, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState({ totalPnL: 0, winRate: 0, totalTrades: 0 });
  const [trades, setTrades] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [accountBalance, setAccountBalance] = useState(() => {
    const saved = localStorage.getItem('accountBalance');
    return saved ? Number(saved) : 10000;
  });

  useEffect(() => {
    localStorage.setItem('accountBalance', accountBalance.toString());
  }, [accountBalance]);

  const fetchDashboard = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const [statsRes, tradesRes] = await Promise.all([
        fetch('/api/analytics/summary', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/trades', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (tradesRes.ok) setTrades(await tradesRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [getToken]);

  const handleClearAllTrades = async () => {
    if (!window.confirm('Are you sure you want to remove all trading data?')) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/trades', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchDashboard();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/trades/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchDashboard();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#e6edf3] uppercase">Dashboard</h1>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.dispatchEvent(new Event('show_sticky_note'))}
            className="flex items-center justify-center p-2 bg-[#161b22] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title="Show Daily Goals"
          >
            <StickyNote className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 bg-[#161b22] px-3 py-1.5 rounded-lg border border-[#30363d]">
            <span className="text-[#8b949e] text-xs font-bold uppercase tracking-wider">Balance</span>
            <div className="flex items-center text-[#e6edf3] font-mono text-sm">
              <span className="text-[#8b949e] mr-1">$</span>
              <input 
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value) || 0)}
                className="bg-transparent w-24 focus:outline-none focus:text-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
          <div className="text-xs text-[#8b949e] mb-1 flex justify-between items-center">
            <span>Win Rate</span>
            <Target className="w-3 h-3 text-[#8b949e]" />
          </div>
          <div className="text-2xl font-bold text-[#e6edf3]">{stats.winRate.toFixed(1)}%</div>
          <p className="text-[10px] text-indigo-400 mt-1 font-mono">↑ 2.1% trend</p>
        </div>
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
          <div className="text-xs text-[#8b949e] mb-1 flex justify-between items-center">
            <span>Net P&L (Total)</span>
          </div>
          <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-indigo-400' : 'text-[#f85149]'}`}>
            ${stats.totalPnL.toFixed(2)}
          </div>
          <p className={`text-[10px] mt-1 font-mono ${stats.totalPnL >= 0 ? 'text-indigo-400' : 'text-[#f85149]'}`}>
            {stats.totalPnL >= 0 ? '+' : ''}{accountBalance > 0 ? ((stats.totalPnL / accountBalance) * 100).toFixed(2) : 0}% of balance
          </p>
        </div>
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
          <div className="text-xs text-[#8b949e] mb-1 flex justify-between items-center">
            <span>Total Trades</span>
          </div>
          <div className="text-2xl font-bold text-[#e6edf3]">{stats.totalTrades}</div>
          <p className="text-[10px] text-[#8b949e] mt-1 font-mono">Active log</p>
        </div>
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
          <div className="text-xs text-[#8b949e] mb-1 flex justify-between items-center">
            <span>Profit Factor</span>
          </div>
          <div className="text-2xl font-bold text-[#e6edf3]">2.14</div>
          <p className="text-[10px] text-[#8b949e] mt-1 font-mono">Alpha Strategy</p>
        </div>
      </div>

      <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#e6edf3]">Recent Trades</h2>
          {trades.length > 0 && (
            <button
              onClick={handleClearAllTrades}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#f851491a] hover:bg-[#f8514933] text-[#f85149] rounded border border-[#f851494d] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Trades
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="text-[10px] uppercase text-[#8b949e] border-b border-[#30363d] bg-[#0d1117]">
                <th className="p-4">Ticket / Symbol</th>
                <th className="p-4">Direction</th>
                <th className="p-4">Lots</th>
                <th className="p-4">P&L</th>
                <th className="p-4">Strategy</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs font-mono">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8b949e] font-sans">No trades recorded yet.</td>
                </tr>
              ) : (
                trades.slice(0, 10).map((trade) => (
                  <tr key={trade.id} className="border-b border-[#30363d] hover:bg-[#161b22] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[#e6edf3]">{trade.symbol}</div>
                      <div className="text-[10px] text-[#8b949e]">{new Date(trade.entryTime).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded ${trade.direction === 'Long' || trade.direction?.toLowerCase() === 'buy' ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#f85149] bg-[#f851491a]'}`}>
                        {trade.direction?.toUpperCase() || 'LONG'}
                      </span>
                    </td>
                    <td className="p-4 text-[#e6edf3]">{trade.lotSize || '1.00'}</td>
                    <td className={`p-4 ${Number(trade.profit) >= 0 ? 'text-indigo-400' : 'text-[#f85149]'}`}>
                      {Number(trade.profit) >= 0 ? '+' : ''}${Number(trade.profit).toFixed(2)}
                    </td>
                    <td className="p-4 font-sans text-[#e6edf3]">{trade.strategy || 'Breakout'}</td>
                    <td className="p-4 text-right font-sans">
                      <button
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#30363d] rounded transition-colors"
                        title="Delete trade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

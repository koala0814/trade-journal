#!/bin/bash
set -e

# Update Dashboard.tsx
cat << 'DASH' > src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext.tsx';
import { ArrowUpRight, ArrowDownRight, Target, StickyNote } from 'lucide-react';

export default function Dashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState({ totalPnL: 0, winRate: 0, totalTrades: 0 });
  const [trades, setTrades] = useState<any[]>([]);
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
        fetch('/api/analytics/summary', { headers: { Authorization: \`Bearer \${token}\` } }),
        fetch('/api/trades', { headers: { Authorization: \`Bearer \${token}\` } })
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
          <div className={\`text-2xl font-bold \${stats.totalPnL >= 0 ? 'text-indigo-400' : 'text-[#f85149]'}\`}>
            \${stats.totalPnL.toFixed(2)}
          </div>
          <p className={\`text-[10px] mt-1 font-mono \${stats.totalPnL >= 0 ? 'text-indigo-400' : 'text-[#f85149]'}\`}>
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
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="text-[10px] uppercase text-[#8b949e] border-b border-[#30363d] bg-[#0d1117]">
                <th className="p-4">Ticket / Symbol</th>
                <th className="p-4">Direction</th>
                <th className="p-4">Lots</th>
                <th className="p-4">P&L</th>
                <th className="p-4">Session</th>
                <th className="p-4">Strategy</th>
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
                      <span className={\`px-2 py-0.5 rounded \${trade.direction === 'Long' || trade.direction?.toLowerCase() === 'buy' ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#f85149] bg-[#f851491a]'}\`}>
                        {trade.direction?.toUpperCase() || 'LONG'}
                      </span>
                    </td>
                    <td className="p-4 text-[#e6edf3]">{trade.lotSize || '1.00'}</td>
                    <td className={\`p-4 \${Number(trade.profit) >= 0 ? 'text-indigo-400' : 'text-[#f85149]'}\`}>
                      {Number(trade.profit) >= 0 ? '+' : ''}\${Number(trade.profit).toFixed(2)}
                    </td>
                    <td className="p-4 font-sans text-[#8b949e]">{trade.session || 'London'}</td>
                    <td className="p-4 font-sans text-[#e6edf3]">{trade.strategy || 'Breakout'}</td>
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
DASH

cat << 'ANAL' > src/components/Analytics.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext.tsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UploadCloud, Loader2 } from 'lucide-react';
import ProfitCalendar from './ProfitCalendar.tsx';

export default function Analytics() {
  const { getToken } = useAuth();
  const [data, setData] = useState<{name: string, pnl: number}[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAnalytics = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/trades', { headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) {
        const tradesData = await res.json();
        setTrades(tradesData);
        
        const reversed = [...tradesData].reverse();
        let cumulative = 0;
        const chartData = reversed.map((t: any, i: number) => {
          cumulative += Number(t.profit || 0);
          return {
            name: \`T\${i+1}\`,
            pnl: cumulative
          };
        });
        setData(chartData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [getToken]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/trades/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
          },
          body: JSON.stringify({
            imageBytes: base64String,
            mimeType: file.type,
          }),
        });

        if (response.ok) {
          await fetchAnalytics();
        } else {
          console.error('Failed to parse trades');
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-[#e6edf3] uppercase">Analytics</h1>
        <div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-600/90 text-white rounded font-bold text-sm tracking-wider transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {isUploading ? 'Parsing Trades...' : 'Upload Screenshot'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 flex-1 min-h-0 pb-6">
        <div className="w-full max-w-7xl mx-auto flex-shrink-0">
          <ProfitCalendar trades={trades} />
        </div>
        <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] flex-1 flex flex-col min-h-[300px]">
          <h2 className="text-lg font-bold text-[#e6edf3] mb-4 uppercase tracking-wider flex-shrink-0">Equity Curve</h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8b949e', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8b949e', fontSize: 12}} tickFormatter={(value) => \`\$\${value}\`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #30363d', backgroundColor: '#161b22', color: '#e6edf3', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: number) => [\`\$\${value.toFixed(2)}\`, 'Cumulative P&L']}
                />
                <Line type="monotone" dataKey="pnl" stroke="#818cf8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#818cf8', stroke: '#161b22' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
ANAL


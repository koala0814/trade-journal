import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext.tsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UploadCloud, Loader2, Trash2 } from 'lucide-react';
import ProfitCalendar from './ProfitCalendar.tsx';

export default function Analytics() {
  const { getToken } = useAuth();
  const [data, setData] = useState<{name: string, pnl: number}[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAnalytics = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/trades', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const tradesData = await res.json();
        setTrades(tradesData);
        
        const reversed = [...tradesData].reverse();
        let cumulative = 0;
        const chartData = reversed.map((t: any, i: number) => {
          cumulative += Number(t.profit || 0);
          return {
            name: `T${i+1}`,
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
        await fetchAnalytics();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

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
            'Authorization': `Bearer ${token}`,
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
        <div className="flex items-center gap-3">
          {trades.length > 0 && (
            <button
              onClick={handleClearAllTrades}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f851491a] hover:bg-[#f8514933] text-[#f85149] rounded border border-[#f851494d] text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Clear Trades
            </button>
          )}
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
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8b949e', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #30363d', backgroundColor: '#161b22', color: '#e6edf3', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
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

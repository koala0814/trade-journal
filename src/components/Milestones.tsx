import React, { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext.tsx';

type MilestoneData = {
  id: number;
  title: string;
  current: number;
  target?: number;
  unit: string;
  isStatic?: boolean;
  staticLabel?: string;
  staticSubtext?: string;
};

const initialMilestones: MilestoneData[] = [
  {
    id: 1,
    title: 'Total Trades',
    current: 0,
    unit: '',
    isStatic: true,
    staticLabel: 'trades',
    staticSubtext: 'Total trades logged in journal',
  },
  {
    id: 2,
    title: 'Profit Milestones',
    current: 0,
    target: 5000,
    unit: '$',
  },
  {
    id: 3,
    title: 'Profitable Days Streak',
    current: 0,
    unit: '',
    isStatic: true,
    staticLabel: 'days',
    staticSubtext: 'Current consecutive winning days',
  }
];

const MilestoneCard: React.FC<{ 
  milestone: MilestoneData; 
  onUpdateTarget: (id: number, newTarget: number) => void;
}> = ({ 
  milestone, 
  onUpdateTarget 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(milestone.target?.toString() || '');

  const handleSave = () => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateTarget(milestone.id, val);
    } else {
      setEditValue(milestone.target?.toString() || '');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(milestone.target?.toString() || '');
    setIsEditing(false);
  };

  if (milestone.isStatic) {
    return (
      <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d] flex flex-col justify-center items-center gap-2">
        <h3 className="text-[#e6edf3] font-semibold text-sm uppercase tracking-wider text-center">{milestone.title}</h3>
        <div className="text-4xl font-bold text-indigo-400 mt-2">
          {milestone.current} <span className="text-xl text-[#8b949e] font-normal">{milestone.staticLabel || 'days'}</span>
        </div>
        <p className="text-[#8b949e] text-xs text-center mt-2">{milestone.staticSubtext || 'Current consecutive winning days'}</p>
      </div>
    );
  }

  const target = milestone.target || 1;
  const progress = Math.min((milestone.current / target) * 100, 100);
  
  return (
    <div className="bg-[#161b22] p-5 rounded-xl border border-[#30363d] flex flex-col gap-4">
      <div className="flex justify-between items-center h-8">
        <h3 className="text-[#e6edf3] font-semibold text-sm uppercase tracking-wider">{milestone.title}</h3>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e] font-bold text-sm">{milestone.unit}</span>
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-20 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="p-1 hover:bg-[#30363d] rounded text-indigo-400">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={handleCancel} className="p-1 hover:bg-[#30363d] rounded text-[#f85149]">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="text-[#e6edf3] font-bold text-sm">
              {milestone.unit}{milestone.current.toFixed(milestone.id === 2 ? 2 : 0)} <span className="text-[#8b949e] font-normal">/ {milestone.unit}{target}</span>
            </span>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#30363d] rounded text-[#8b949e] hover:text-[#e6edf3]"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="h-3 w-full bg-indigo-950 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 rounded-full animate-shimmer"
          style={{ 
            width: `${progress}%`,
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
            backgroundSize: '200% 100%'
          }}
        />
      </div>
      
      <div className="flex justify-end">
        <span className="text-[#8b949e] text-xs font-mono">{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default function Milestones() {
  const { getToken } = useAuth();
  const [milestones, setMilestones] = useState<MilestoneData[]>(() => {
    const saved = localStorage.getItem('fixed_milestones_targets_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return initialMilestones.map(m => {
          const savedTarget = parsed.find((p: any) => p.id === m.id)?.target;
          if (savedTarget && m.target !== undefined) {
            return { ...m, target: savedTarget };
          }
          return m;
        });
      } catch (e) {
        return initialMilestones;
      }
    }
    return initialMilestones;
  });

  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch('/api/trades', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const tradesData = await res.json();
          setTrades(tradesData);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAnalytics();
  }, [getToken]);

  useEffect(() => {
    const totalTrades = trades.length;
    const totalProfit = trades.reduce((sum, t) => sum + Number(t.profit || 0), 0);
    
    const dailyPnl: Record<string, number> = {};
    trades.forEach(t => {
      if (t.entryTime) {
        const dateStr = new Date(t.entryTime).toISOString().split('T')[0];
        dailyPnl[dateStr] = (dailyPnl[dateStr] || 0) + Number(t.profit || 0);
      }
    });
    
    const sortedDays = Object.keys(dailyPnl).sort((a, b) => b.localeCompare(a));
    let currentStreak = 0;
    for (const day of sortedDays) {
      if (dailyPnl[day] > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    setMilestones(prev => prev.map(m => {
      if (m.id === 1) return { ...m, current: totalTrades };
      if (m.id === 2) return { ...m, current: Math.max(0, totalProfit) };
      if (m.id === 3) return { ...m, current: currentStreak };
      return m;
    }));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('fixed_milestones_targets_v3', JSON.stringify(milestones.map(m => ({ id: m.id, target: m.target }))));
  }, [milestones]);

  const handleUpdateTarget = (id: number, newTarget: number) => {
    setMilestones(prev => 
      prev.map(m => m.id === id ? { ...m, target: newTarget } : m)
    );
  };

  const profitMilestone = milestones.find(m => m.id === 2);
  const otherMilestones = milestones.filter(m => m.id !== 2);

  return (
    <div className="space-y-6 flex flex-col h-full max-w-5xl mx-auto w-full pb-8">
      <h1 className="text-2xl font-bold tracking-tight text-[#e6edf3] uppercase">Trading Milestones</h1>
      
      {profitMilestone && (
        <div className="w-full">
          <MilestoneCard 
            key={profitMilestone.id}
            milestone={profitMilestone}
            onUpdateTarget={handleUpdateTarget}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {otherMilestones.map((milestone) => (
          <MilestoneCard 
            key={milestone.id}
            milestone={milestone}
            onUpdateTarget={handleUpdateTarget}
          />
        ))}
      </div>
    </div>
  );
}

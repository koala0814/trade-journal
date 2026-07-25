import React, { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Settings, RefreshCw } from 'lucide-react';

export default function ProfitCalendar({ trades }: { trades: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [initialBalance, setInitialBalance] = useState(10000);

  React.useEffect(() => {
    const saved = localStorage.getItem('accountBalance');
    if (saved) setInitialBalance(Number(saved));
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // compute daily aggregates
  const dailyStats = useMemo(() => {
    const stats: Record<string, { trades: number; pnl: number }> = {};
    trades.forEach((trade) => {
      if (!trade.entryTime) return;
      const dateStr = format(new Date(trade.entryTime), 'yyyy-MM-dd');
      if (!stats[dateStr]) {
        stats[dateStr] = { trades: 0, pnl: 0 };
      }
      stats[dateStr].trades += 1;
      stats[dateStr].pnl += Number(trade.profit || 0);
    });
    return stats;
  }, [trades]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const monthTrades = trades.filter(t => t.entryTime && isSameMonth(new Date(t.entryTime), currentMonth));
  const monthPnL = monthTrades.reduce((sum, t) => sum + Number(t.profit || 0), 0);

  return (
    <div className="bg-[#161b22] rounded-xl border border-[#30363d] flex flex-col h-full">
      <div className="p-4 border-b border-[#30363d] flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-1 text-[#8b949e] hover:text-[#e6edf3] bg-[#161b22] rounded"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-bold text-[#e6edf3] min-w-[140px] text-center uppercase tracking-wider text-sm">{format(currentMonth, 'MMMM-yyyy')}</span>
          <button onClick={nextMonth} className="p-1 text-[#8b949e] hover:text-[#e6edf3] bg-[#161b22] rounded"><ChevronRight className="w-5 h-5" /></button>
          <div className="hidden sm:flex gap-2 ml-4">
            <button className="p-1 text-[#8b949e] hover:text-[#e6edf3] bg-[#161b22] rounded"><Settings className="w-4 h-4" /></button>
            <button className="p-1 text-[#8b949e] hover:text-[#e6edf3] bg-[#161b22] rounded"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-mono">
          <div className="flex gap-2">
            <span className="text-[#8b949e]">P/L:</span>
            <span className={`font-bold ${monthPnL > 0 ? 'text-[#056f6e]' : monthPnL < 0 ? 'text-[#ae4964]' : 'text-white'}`}>
              {monthPnL > 0 ? '+$' : monthPnL < 0 ? '-$' : '$'}{Math.abs(monthPnL).toFixed(2)} ({((monthPnL / initialBalance) * 100).toFixed(2)}%)
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#8b949e]">Trades:</span>
            <span className="text-[#e6edf3] font-bold">{monthTrades.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="w-full h-full flex flex-col">
          <div className="grid grid-cols-7 sm:grid-cols-8 border-b border-[#30363d] text-[8px] sm:text-[10px] uppercase font-bold text-white text-center">
            <div className="p-1 sm:p-2 border-r border-[#30363d]"><span className="sm:hidden">M</span><span className="hidden sm:inline">Mon</span></div>
            <div className="p-1 sm:p-2 border-r border-[#30363d]"><span className="sm:hidden">T</span><span className="hidden sm:inline">Tue</span></div>
            <div className="p-1 sm:p-2 border-r border-[#30363d]"><span className="sm:hidden">W</span><span className="hidden sm:inline">Wed</span></div>
            <div className="p-1 sm:p-2 border-r border-[#30363d]"><span className="sm:hidden">T</span><span className="hidden sm:inline">Thu</span></div>
            <div className="p-1 sm:p-2 border-r border-[#30363d]"><span className="sm:hidden">F</span><span className="hidden sm:inline">Fri</span></div>
            <div className="p-1 sm:p-2 border-r border-[#30363d]"><span className="sm:hidden">S</span><span className="hidden sm:inline">Sat</span></div>
            <div className="p-1 sm:p-2 border-r border-[#30363d]"><span className="sm:hidden">S</span><span className="hidden sm:inline">Sun</span></div>
            <div className="hidden sm:block p-1 sm:p-2 bg-indigo-950/30 border-l border-[#30363d] text-indigo-300">Summary</div>
          </div>
          <div className="flex flex-col font-mono text-xs flex-1">
            {weeks.map((week, i) => {
              let weekTrades = 0;
              let weekPnL = 0;
              return (
                <div key={i} className="grid grid-cols-7 sm:grid-cols-8 border-b border-[#30363d] last:border-0 flex-1 min-h-[80px] sm:min-h-[120px]">
                  {week.map((day, j) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const stats = dailyStats[dateStr];
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isTodayDate = isToday(day);
                    
                    if (stats && isCurrentMonth) {
                      weekTrades += stats.trades;
                      weekPnL += stats.pnl;
                    }

                    let bgClass = '';
                    let textClass = 'text-white';
                    if (!isCurrentMonth) {
                      bgClass = 'bg-[#0d1117] opacity-30';
                      textClass = 'text-[#8b949e]';
                    } else if (stats) {
                      if (stats.pnl > 0) {
                        bgClass = 'bg-[#056f6e]';
                      } else if (stats.pnl < 0) {
                        bgClass = 'bg-[#ae4964]';
                      }
                    }

                    return (
                      <div key={j} className={`p-1 sm:p-2 border-r border-[#30363d] flex flex-col ${bgClass}`}>
                        <div className="flex justify-center sm:justify-between items-start">
                          <span className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm ${isTodayDate ? 'bg-[#e6edf3] text-black font-bold' : textClass}`}>
                            {format(day, dateFormat)}
                          </span>
                        </div>
                        {stats && stats.trades > 0 && isCurrentMonth && (
                          <div className="text-center mt-auto mb-auto flex flex-col gap-1">
                            <span className={`font-bold text-xs sm:text-sm ${textClass}`}>
                              {stats.trades} {stats.trades === 1 ? 'trade' : 'trades'}
                            </span>
                            <span className={`font-bold text-xs sm:text-sm ${textClass}`}>
                              {stats.pnl > 0 ? '+$' : stats.pnl < 0 ? '-$' : '$'}{Math.abs(stats.pnl).toFixed(2)}
                              <br className="sm:hidden" />
                              <span className="text-[10px] sm:text-xs opacity-80 sm:ml-1">
                                ({((stats.pnl / initialBalance) * 100).toFixed(2)}%)
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="hidden sm:flex p-1 sm:p-2 flex-col items-center justify-center bg-indigo-950/30 border-l border-[#30363d] text-center shadow-[inset_4px_0_12px_rgba(79,70,229,0.1)]">
                    {weekTrades > 0 ? (
                      <>
                        <span className="text-[#e6edf3] text-[10px]">{weekTrades} trades</span>
                        <span className={`font-bold text-[10px] mt-1 flex flex-col items-center ${weekPnL > 0 ? 'text-[#056f6e]' : weekPnL < 0 ? 'text-[#ae4964]' : 'text-white'}`}>
                          <span>{weekPnL > 0 ? '+$' : weekPnL < 0 ? '-$' : '$'}{Math.abs(weekPnL).toFixed(2)}</span>
                          <span className="opacity-80">({((weekPnL / initialBalance) * 100).toFixed(2)}%)</span>
                        </span>
                      </>
                    ) : (
                      <span className="text-[#8b949e] text-[10px]">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
